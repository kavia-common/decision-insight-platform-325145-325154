const { dbQuery } = require('../db/query');

// PUBLIC_INTERFACE
async function writeAuditLog({
  userId,
  orgUserId,
  action,
  entityType,
  entityId,
  severity = 'info',
  message,
  ip,
  userAgent,
  requestId,
  metadata = {},
}) {
  /** Append an audit log entry; never throws to avoid breaking main flow. */
  try {
    await dbQuery(
      `
      INSERT INTO audit_logs
        (user_id, org_user_id, action, entity_type, entity_id, severity, message, ip, user_agent, request_id, metadata)
      VALUES
        ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb)
      `,
      [
        userId || null,
        orgUserId || null,
        action,
        entityType || null,
        entityId || null,
        severity,
        message || null,
        ip || null,
        userAgent || null,
        requestId || null,
        JSON.stringify(metadata || {}),
      ]
    );
  } catch (_err) {
    // intentionally swallow
  }
}

module.exports = { writeAuditLog };
