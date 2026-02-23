const { ApiError } = require('../errors/apiError');

// PUBLIC_INTERFACE
function validate({ body, query, params }) {
  /** Express middleware factory to validate req.body/query/params using Zod schemas. */
  return (req, _res, next) => {
    try {
      if (body) req.body = body.parse(req.body);
      if (query) req.query = query.parse(req.query);
      if (params) req.params = params.parse(req.params);
      return next();
    } catch (err) {
      return next(
        new ApiError(400, 'VALIDATION_ERROR', 'Request validation failed.', {
          issues: err.issues || err.errors || err,
        })
      );
    }
  };
}

module.exports = { validate };
