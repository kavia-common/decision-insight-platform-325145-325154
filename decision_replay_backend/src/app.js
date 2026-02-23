const cors = require('cors');
const cookieParser = require('cookie-parser');
const express = require('express');
const rateLimit = require('express-rate-limit');
const routes = require('./routes');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('../swagger');
const { ApiError } = require('./errors/apiError');
const { requestContext } = require('./middleware/requestContext');

// Initialize express app
const app = express();

const allowedOrigins = (process.env.ALLOWED_ORIGINS || '*')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.set('trust proxy', String(process.env.TRUST_PROXY || 'true').toLowerCase() === 'true');

// Request context / request id
app.use(requestContext);

// CORS
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser clients (no Origin header)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new ApiError(403, 'CORS_BLOCKED', 'Origin not allowed by CORS policy.'), false);
    },
    methods: (process.env.ALLOWED_METHODS || 'GET,POST,PUT,DELETE,PATCH,OPTIONS').split(','),
    allowedHeaders: (process.env.ALLOWED_HEADERS || 'Content-Type,Authorization').split(','),
    maxAge: process.env.CORS_MAX_AGE ? Number(process.env.CORS_MAX_AGE) : 3600,
    credentials: true,
  })
);

// Body + cookies
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

// Basic rate limit
app.use(
  rateLimit({
    windowMs: (process.env.RATE_LIMIT_WINDOW_S ? Number(process.env.RATE_LIMIT_WINDOW_S) : 60) * 1000,
    limit: process.env.RATE_LIMIT_MAX ? Number(process.env.RATE_LIMIT_MAX) : 100,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// Swagger docs
app.use('/docs', swaggerUi.serve, (req, res, next) => {
  const host = req.get('host');
  let protocol = req.protocol;

  const actualPort = req.socket.localPort;
  const hasPort = host.includes(':');

  const needsPort =
    !hasPort &&
    ((protocol === 'http' && actualPort !== 80) || (protocol === 'https' && actualPort !== 443));
  const fullHost = needsPort ? `${host}:${actualPort}` : host;
  protocol = req.secure ? 'https' : protocol;

  const dynamicSpec = {
    ...swaggerSpec,
    servers: [
      {
        url: `${protocol}://${fullHost}`,
      },
    ],
  };
  swaggerUi.setup(dynamicSpec)(req, res, next);
});

// Mount routes
app.use('/', routes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ status: 'error', code: 'NOT_FOUND', message: 'Route not found.' });
});

// Error handling middleware
app.use((err, req, res, _next) => {
  const statusCode = err instanceof ApiError ? err.statusCode : 500;
  const code = err instanceof ApiError ? err.code : 'INTERNAL_ERROR';

  // Avoid leaking internals in production
  const safeMessage =
    err instanceof ApiError ? err.message : 'Internal Server Error';

  const details = err instanceof ApiError ? err.details : undefined;

  console.error(`[${req.id}]`, err);

  res.status(statusCode).json({
    status: 'error',
    code,
    message: safeMessage,
    details,
    requestId: req.id,
  });
});

module.exports = app;
