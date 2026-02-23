const { dbQuery } = require('../db/query');

class AdminController {
  async listUsers(_req, res, next) {
    try {
      const { rows } = await dbQuery(
        `
        SELECT id,email,username,display_name,status,created_at,last_login_at
        FROM users
        WHERE deleted_at IS NULL
        ORDER BY created_at DESC
        LIMIT 200
        `
      );
      return res.status(200).json({ status: 'ok', users: rows });
    } catch (err) {
      return next(err);
    }
  }

  async auditLogs(req, res, next) {
    try {
      const limit = Math.min(Number(req.query.limit || 100), 500);
      const { rows } = await dbQuery(
        `
        SELECT *
        FROM audit_logs
        ORDER BY created_at DESC
        LIMIT $1
        `,
        [limit]
      );
      return res.status(200).json({ status: 'ok', auditLogs: rows });
    } catch (err) {
      return next(err);
    }
  }
}

module.exports = new AdminController();
