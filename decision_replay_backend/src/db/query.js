const { pool } = require('./pool');
const { ApiError } = require('../errors/apiError');

function mapPgError(err) {
  // Common PostgreSQL error codes:
  // 23505 unique_violation, 23503 foreign_key_violation, 22P02 invalid_text_representation
  if (!err || !err.code) return null;

  if (err.code === '23505') {
    return new ApiError(409, 'CONFLICT', 'Resource already exists.', {
      constraint: err.constraint,
      detail: err.detail,
    });
  }

  if (err.code === '23503') {
    return new ApiError(409, 'FK_VIOLATION', 'Related resource not found or violates constraints.', {
      constraint: err.constraint,
      detail: err.detail,
    });
  }

  if (err.code === '22P02') {
    return new ApiError(400, 'INVALID_INPUT', 'Invalid input format.', {
      detail: err.detail,
    });
  }

  return null;
}

// PUBLIC_INTERFACE
async function dbQuery(text, params, client) {
  /** Execute a parameterized query using the shared pool or provided client. */
  try {
    const runner = client || pool;
    return await runner.query(text, params);
  } catch (err) {
    const mapped = mapPgError(err);
    if (mapped) throw mapped;
    throw err;
  }
}

// PUBLIC_INTERFACE
async function withTransaction(fn) {
  /** Run callback inside a DB transaction, committing on success and rolling back on failure. */
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { dbQuery, withTransaction };
