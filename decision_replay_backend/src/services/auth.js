const { dbQuery, withTransaction } = require('../db/query');
const { ApiError } = require('../errors/apiError');
const { hashPassword, verifyPassword, generateOpaqueToken, hashToken } = require('../utils/crypto');
const { writeAuditLog } = require('./audit');

const ACCESS_TOKEN_TTL_MIN = process.env.ACCESS_TOKEN_TTL_MIN
  ? Number(process.env.ACCESS_TOKEN_TTL_MIN)
  : 60 * 24; // 24h

function buildExpiresAt() {
  return new Date(Date.now() + ACCESS_TOKEN_TTL_MIN * 60_000);
}

async function getUserByEmail(email) {
  const { rows } = await dbQuery(
    'SELECT id,email,username,display_name,password_hash,status,deleted_at FROM users WHERE email = $1 LIMIT 1',
    [email]
  );
  return rows[0] || null;
}

// PUBLIC_INTERFACE
async function signup({ email, username, displayName, password, ip, userAgent, requestId }) {
  /** Create a new user and return an access token session. */
  return withTransaction(async (client) => {
    const existing = await dbQuery(
      'SELECT id FROM users WHERE email = $1 AND deleted_at IS NULL LIMIT 1',
      [email],
      client
    );
    if (existing.rows[0]) throw new ApiError(409, 'CONFLICT', 'Email is already registered.');

    const passwordHash = await hashPassword(password);

    const created = await dbQuery(
      `
      INSERT INTO users (email, username, display_name, password_hash, status, email_verified_at)
      VALUES ($1, $2, $3, $4, 'active', NOW())
      RETURNING id,email,username,display_name,status,created_at
      `,
      [email, username || null, displayName || null, passwordHash],
      client
    );

    // Ensure default role
    await dbQuery(
      `
      INSERT INTO user_roles (user_id, role_id, granted_by)
      SELECT $1, r.id, $1 FROM roles r WHERE r.name='user'
      ON CONFLICT DO NOTHING
      `,
      [created.rows[0].id],
      client
    );

    const token = generateOpaqueToken(32);
    const tokenHash = hashToken(token);
    const expiresAt = buildExpiresAt();

    const session = await dbQuery(
      `
      INSERT INTO auth_sessions (user_id, session_type, token_hash, expires_at, ip, user_agent, metadata)
      VALUES ($1,'access',$2,$3,$4,$5,'{}'::jsonb)
      RETURNING id, issued_at, expires_at
      `,
      [created.rows[0].id, tokenHash, expiresAt, ip || null, userAgent || null],
      client
    );

    await writeAuditLog({
      userId: created.rows[0].id,
      action: 'auth.signup',
      entityType: 'user',
      entityId: created.rows[0].id,
      severity: 'security',
      message: 'User signed up.',
      ip,
      userAgent,
      requestId,
    });

    return {
      user: {
        id: created.rows[0].id,
        email: created.rows[0].email,
        username: created.rows[0].username,
        displayName: created.rows[0].display_name,
        status: created.rows[0].status,
      },
      accessToken: token,
      expiresAt: session.rows[0].expires_at,
    };
  });
}

// PUBLIC_INTERFACE
async function login({ email, password, ip, userAgent, requestId }) {
  /** Validate credentials and return an access token session. */
  const user = await getUserByEmail(email);
  if (!user || user.deleted_at) throw new ApiError(401, 'INVALID_CREDENTIALS', 'Invalid credentials.');
  if (user.status !== 'active') throw new ApiError(403, 'USER_DISABLED', 'User is not active.');

  if (!user.password_hash) throw new ApiError(401, 'INVALID_CREDENTIALS', 'Invalid credentials.');

  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) throw new ApiError(401, 'INVALID_CREDENTIALS', 'Invalid credentials.');

  const token = generateOpaqueToken(32);
  const tokenHash = hashToken(token);
  const expiresAt = buildExpiresAt();

  await withTransaction(async (client) => {
    await dbQuery('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id], client);
    await dbQuery(
      `
      INSERT INTO auth_sessions (user_id, session_type, token_hash, expires_at, ip, user_agent, metadata)
      VALUES ($1,'access',$2,$3,$4,$5,'{}'::jsonb)
      `,
      [user.id, tokenHash, expiresAt, ip || null, userAgent || null],
      client
    );
  });

  await writeAuditLog({
    userId: user.id,
    action: 'auth.login',
    entityType: 'session',
    entityId: null,
    severity: 'security',
    message: 'User logged in.',
    ip,
    userAgent,
    requestId,
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.display_name,
      status: user.status,
    },
    accessToken: token,
    expiresAt,
  };
}

// PUBLIC_INTERFACE
async function logout({ accessToken, userId, ip, userAgent, requestId }) {
  /** Revoke the provided access token. */
  if (!accessToken) return { revoked: false };

  const tokenHash = hashToken(accessToken);
  const { rowCount } = await dbQuery(
    `
    UPDATE auth_sessions
    SET revoked_at = NOW()
    WHERE token_hash = $1 AND revoked_at IS NULL
    `,
    [tokenHash]
  );

  await writeAuditLog({
    userId: userId || null,
    action: 'auth.logout',
    entityType: 'session',
    entityId: null,
    severity: 'security',
    message: 'User logged out.',
    ip,
    userAgent,
    requestId,
    metadata: { revoked: rowCount > 0 },
  });

  return { revoked: rowCount > 0 };
}

module.exports = { signup, login, logout };
