const { ApiError } = require('../errors/apiError');
const { dbQuery } = require('../db/query');
const { hashToken } = require('../utils/crypto');

// PUBLIC_INTERFACE
async function requireAuth(req, _res, next) {
  /** Require valid Bearer access token; attaches req.user + req.session. */
  try {
    const header = req.get('authorization') || '';
    const match = header.match(/^Bearer\s+(.+)$/i);
    const token = match ? match[1] : null;

    if (!token) return next(new ApiError(401, 'UNAUTHORIZED', 'Missing Authorization Bearer token.'));

    const tokenHash = hashToken(token);

    const { rows } = await dbQuery(
      `
      SELECT
        s.id AS session_id,
        s.user_id,
        s.session_type,
        s.expires_at,
        s.revoked_at,
        u.email,
        u.username,
        u.display_name,
        u.status
      FROM auth_sessions s
      JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = $1
        AND s.session_type = 'access'
        AND s.revoked_at IS NULL
        AND (s.expires_at IS NULL OR s.expires_at > NOW())
        AND u.deleted_at IS NULL
      LIMIT 1
      `,
      [tokenHash]
    );

    if (!rows[0]) return next(new ApiError(401, 'UNAUTHORIZED', 'Invalid or expired session token.'));

    req.session = { id: rows[0].session_id, type: rows[0].session_type };
    req.user = {
      id: rows[0].user_id,
      email: rows[0].email,
      username: rows[0].username,
      displayName: rows[0].display_name,
      status: rows[0].status,
    };

    // Update session last_used_at best-effort (no need to block on errors)
    dbQuery('UPDATE auth_sessions SET last_used_at = NOW() WHERE id = $1', [req.session.id]).catch(() => {});
    return next();
  } catch (err) {
    return next(err);
  }
}

// PUBLIC_INTERFACE
async function requireAdmin(req, _res, next) {
  /** Require that the authenticated user has role 'admin'. */
  try {
    if (!req.user) return next(new ApiError(401, 'UNAUTHORIZED', 'Not authenticated.'));
    const { rows } = await dbQuery(
      `
      SELECT 1
      FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = $1 AND r.name = 'admin'
      LIMIT 1
      `,
      [req.user.id]
    );
    if (!rows[0]) return next(new ApiError(403, 'FORBIDDEN', 'Admin privileges required.'));
    return next();
  } catch (err) {
    return next(err);
  }
}

module.exports = { requireAuth, requireAdmin };
