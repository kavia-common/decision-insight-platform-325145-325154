const crypto = require('crypto');

// PUBLIC_INTERFACE
function requestContext(req, _res, next) {
  /** Attach a stable request id for correlation across audit logs. */
  req.id = req.get('x-request-id') || crypto.randomUUID();
  return next();
}

module.exports = { requestContext };
