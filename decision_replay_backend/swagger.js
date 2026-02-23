const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Decision Replay API',
      version: '1.0.0',
      description:
        'Backend API for Decision Replay: auth, decisions, outcomes, analytics/insights, similarity search, and admin/audit.',
    },
    tags: [
      { name: 'Health', description: 'Service health' },
      { name: 'Auth', description: 'Authentication and sessions' },
      { name: 'Decisions', description: 'Decision CRUD' },
      { name: 'Outcomes', description: 'Outcome CRUD' },
      { name: 'Analytics', description: 'Insights and rollups' },
      { name: 'Similarity', description: 'Similarity search' },
      { name: 'Admin', description: 'Admin and audit logs' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'OpaqueToken',
          description:
            'Use the accessToken returned by /auth/login or /auth/signup as a Bearer token.',
        },
      },
    },
  },
  apis: ['./src/routes/*.js', './src/routes/**/*.js'],
};

const swaggerSpec = swaggerJSDoc(options);
module.exports = swaggerSpec;
