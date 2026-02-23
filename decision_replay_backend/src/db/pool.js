const { Pool } = require('pg');

function buildPgConfigFromEnv() {
  // Prefer POSTGRES_URL if provided.
  // Expected env vars provided by platform: POSTGRES_URL, POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB, POSTGRES_PORT
  const url = process.env.POSTGRES_URL;

  if (url) {
    // Allow URL with or without credentials; if missing, PG lib will attempt env vars.
    return {
      connectionString: url,
      user: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DB,
      port: process.env.POSTGRES_PORT ? Number(process.env.POSTGRES_PORT) : undefined,
      max: process.env.PG_POOL_MAX ? Number(process.env.PG_POOL_MAX) : 10,
      idleTimeoutMillis: process.env.PG_IDLE_TIMEOUT_MS ? Number(process.env.PG_IDLE_TIMEOUT_MS) : 30_000,
      statement_timeout: process.env.PG_STATEMENT_TIMEOUT_MS
        ? Number(process.env.PG_STATEMENT_TIMEOUT_MS)
        : 15_000,
    };
  }

  // Fallback to discrete vars.
  return {
    host: process.env.POSTGRES_HOST || 'localhost',
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
    port: process.env.POSTGRES_PORT ? Number(process.env.POSTGRES_PORT) : 5432,
    max: process.env.PG_POOL_MAX ? Number(process.env.PG_POOL_MAX) : 10,
    idleTimeoutMillis: process.env.PG_IDLE_TIMEOUT_MS ? Number(process.env.PG_IDLE_TIMEOUT_MS) : 30_000,
    statement_timeout: process.env.PG_STATEMENT_TIMEOUT_MS
      ? Number(process.env.PG_STATEMENT_TIMEOUT_MS)
      : 15_000,
  };
}

const pool = new Pool(buildPgConfigFromEnv());

module.exports = { pool };
