const { dbQuery, withTransaction } = require('../db/query');
const { ApiError } = require('../errors/apiError');
const { writeAuditLog } = require('./audit');

async function ensureDecisionOwner({ decisionId, userId, client }) {
  const { rows } = await dbQuery(
    'SELECT id FROM decisions WHERE id=$1 AND user_id=$2 AND deleted_at IS NULL LIMIT 1',
    [decisionId, userId],
    client
  );
  if (!rows[0]) throw new ApiError(404, 'NOT_FOUND', 'Decision not found.');
}

// PUBLIC_INTERFACE
async function listOutcomes({ userId, decisionId }) {
  /** List outcomes for a decision owned by user. */
  await ensureDecisionOwner({ decisionId, userId });
  const { rows } = await dbQuery(
    `
    SELECT *
    FROM outcomes
    WHERE user_id=$1 AND decision_id=$2
    ORDER BY outcome_date DESC, created_at DESC
    `,
    [userId, decisionId]
  );
  return rows;
}

// PUBLIC_INTERFACE
async function createOutcome({ userId, decisionId, payload, ip, userAgent, requestId }) {
  /** Create an outcome for a decision. */
  return withTransaction(async (client) => {
    await ensureDecisionOwner({ decisionId, userId, client });

    const { rows } = await dbQuery(
      `
      INSERT INTO outcomes (decision_id, user_id, outcome_date, status, summary, metrics, satisfaction, lessons_learned)
      VALUES ($1,$2,COALESCE($3::date,CURRENT_DATE),COALESCE($4,'observed'),$5,$6::jsonb,$7,$8)
      RETURNING *
      `,
      [
        decisionId,
        userId,
        payload.outcomeDate || null,
        payload.status || null,
        payload.summary || null,
        JSON.stringify(payload.metrics || {}),
        payload.satisfaction ?? null,
        payload.lessonsLearned || null,
      ],
      client
    );

    await writeAuditLog({
      userId,
      action: 'outcome.create',
      entityType: 'outcome',
      entityId: rows[0].id,
      severity: 'info',
      message: 'Outcome created.',
      ip,
      userAgent,
      requestId,
      metadata: { decisionId },
    });

    return rows[0];
  });
}

// PUBLIC_INTERFACE
async function updateOutcome({ userId, outcomeId, payload, ip, userAgent, requestId }) {
  /** Update an outcome (must belong to user). */
  const { rows } = await dbQuery(
    `
    UPDATE outcomes
    SET
      outcome_date = COALESCE($2::date, outcome_date),
      status = COALESCE($3, status),
      summary = COALESCE($4, summary),
      metrics = COALESCE($5::jsonb, metrics),
      satisfaction = COALESCE($6, satisfaction),
      lessons_learned = COALESCE($7, lessons_learned)
    WHERE id=$1 AND user_id=$8
    RETURNING *
    `,
    [
      outcomeId,
      payload.outcomeDate || null,
      payload.status || null,
      payload.summary ?? null,
      payload.metrics !== undefined ? JSON.stringify(payload.metrics) : null,
      payload.satisfaction ?? null,
      payload.lessonsLearned ?? null,
      userId,
    ]
  );
  if (!rows[0]) throw new ApiError(404, 'NOT_FOUND', 'Outcome not found.');

  await writeAuditLog({
    userId,
    action: 'outcome.update',
    entityType: 'outcome',
    entityId: outcomeId,
    severity: 'info',
    message: 'Outcome updated.',
    ip,
    userAgent,
    requestId,
  });

  return rows[0];
}

// PUBLIC_INTERFACE
async function deleteOutcome({ userId, outcomeId, ip, userAgent, requestId }) {
  /** Delete an outcome. */
  const { rows } = await dbQuery(
    'DELETE FROM outcomes WHERE id=$1 AND user_id=$2 RETURNING id, decision_id',
    [outcomeId, userId]
  );
  if (!rows[0]) throw new ApiError(404, 'NOT_FOUND', 'Outcome not found.');

  await writeAuditLog({
    userId,
    action: 'outcome.delete',
    entityType: 'outcome',
    entityId: outcomeId,
    severity: 'warn',
    message: 'Outcome deleted.',
    ip,
    userAgent,
    requestId,
    metadata: { decisionId: rows[0].decision_id },
  });

  return { deleted: true };
}

module.exports = { listOutcomes, createOutcome, updateOutcome, deleteOutcome };
