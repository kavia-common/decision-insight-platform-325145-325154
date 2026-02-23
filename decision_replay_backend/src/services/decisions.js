const { dbQuery, withTransaction } = require('../db/query');
const { ApiError } = require('../errors/apiError');
const { writeAuditLog } = require('./audit');

function normalizeJson(v, fallback) {
  if (v === undefined || v === null) return fallback;
  return v;
}

async function ensureDecisionOwner({ decisionId, userId, client }) {
  const { rows } = await dbQuery(
    'SELECT id FROM decisions WHERE id=$1 AND user_id=$2 AND deleted_at IS NULL LIMIT 1',
    [decisionId, userId],
    client
  );
  if (!rows[0]) throw new ApiError(404, 'NOT_FOUND', 'Decision not found.');
}

// PUBLIC_INTERFACE
async function listDecisions({ userId, q, status, limit = 50, offset = 0 }) {
  /** List decisions for user with optional basic text query. */
  const params = [userId];
  let where = 'd.user_id = $1 AND d.deleted_at IS NULL';
  if (status) {
    params.push(status);
    where += ` AND d.status = $${params.length}`;
  }
  if (q) {
    params.push(`%${q}%`);
    where += ` AND (d.title ILIKE $${params.length} OR COALESCE(d.context,'') ILIKE $${params.length} OR COALESCE(d.notes,'') ILIKE $${params.length})`;
  }
  params.push(limit);
  params.push(offset);

  const { rows } = await dbQuery(
    `
    SELECT
      d.*,
      (
        SELECT COALESCE(json_agg(o ORDER BY o.outcome_date DESC), '[]'::json)
        FROM outcomes o
        WHERE o.decision_id = d.id AND o.user_id = d.user_id
      ) AS outcomes
    FROM decisions d
    WHERE ${where}
    ORDER BY d.decision_date DESC, d.created_at DESC
    LIMIT $${params.length - 1} OFFSET $${params.length}
    `,
    params
  );

  return rows;
}

// PUBLIC_INTERFACE
async function getDecision({ userId, decisionId }) {
  /** Get decision by id (must belong to user). */
  const { rows } = await dbQuery(
    `
    SELECT
      d.*,
      (
        SELECT COALESCE(json_agg(o ORDER BY o.outcome_date DESC), '[]'::json)
        FROM outcomes o
        WHERE o.decision_id = d.id AND o.user_id = d.user_id
      ) AS outcomes
    FROM decisions d
    WHERE d.id = $1 AND d.user_id = $2 AND d.deleted_at IS NULL
    LIMIT 1
    `,
    [decisionId, userId]
  );
  if (!rows[0]) throw new ApiError(404, 'NOT_FOUND', 'Decision not found.');
  return rows[0];
}

// PUBLIC_INTERFACE
async function createDecision({ userId, payload, ip, userAgent, requestId }) {
  /** Create a decision record. */
  const {
    title,
    context,
    decisionDate,
    status,
    options,
    criteria,
    expectedOutcome,
    selectedOption,
    confidence,
    riskLevel,
    importance,
    timeHorizon,
    notes,
  } = payload;

  const computed = computeQualityAndBias(payload);

  const { rows } = await dbQuery(
    `
    INSERT INTO decisions
      (user_id, title, context, decision_date, status, options, criteria, expected_outcome, selected_option,
       confidence, risk_level, importance, time_horizon, quality_score, bias_signals, notes)
    VALUES
      ($1,$2,$3,COALESCE($4::date, CURRENT_DATE),COALESCE($5,'open'),$6::jsonb,$7::jsonb,$8,$9::jsonb,
       $10,$11,$12,$13,$14,$15::jsonb,$16)
    RETURNING *
    `,
    [
      userId,
      title,
      context || null,
      decisionDate || null,
      status || null,
      JSON.stringify(normalizeJson(options, [])),
      JSON.stringify(normalizeJson(criteria, [])),
      expectedOutcome || null,
      selectedOption === undefined ? null : JSON.stringify(selectedOption),
      confidence === undefined ? null : confidence,
      riskLevel || null,
      importance === undefined ? null : importance,
      timeHorizon || null,
      computed.qualityScore,
      JSON.stringify(computed.biasFlags),
      notes || null,
    ]
  );

  await writeAuditLog({
    userId,
    action: 'decision.create',
    entityType: 'decision',
    entityId: rows[0].id,
    severity: 'info',
    message: 'Decision created.',
    ip,
    userAgent,
    requestId,
  });

  return rows[0];
}

// PUBLIC_INTERFACE
async function updateDecision({ userId, decisionId, payload, ip, userAgent, requestId }) {
  /** Update a decision record. */
  return withTransaction(async (client) => {
    await ensureDecisionOwner({ decisionId, userId, client });

    const computed = computeQualityAndBias(payload);

    const { rows } = await dbQuery(
      `
      UPDATE decisions
      SET
        title = COALESCE($3, title),
        context = COALESCE($4, context),
        decision_date = COALESCE($5::date, decision_date),
        status = COALESCE($6, status),
        options = COALESCE($7::jsonb, options),
        criteria = COALESCE($8::jsonb, criteria),
        expected_outcome = COALESCE($9, expected_outcome),
        selected_option = COALESCE($10::jsonb, selected_option),
        confidence = COALESCE($11, confidence),
        risk_level = COALESCE($12, risk_level),
        importance = COALESCE($13, importance),
        time_horizon = COALESCE($14, time_horizon),
        notes = COALESCE($15, notes),
        quality_score = COALESCE($16, quality_score),
        bias_signals = COALESCE($17::jsonb, bias_signals)
      WHERE id=$1 AND user_id=$2
      RETURNING *
      `,
      [
        decisionId,
        userId,
        payload.title ?? null,
        payload.context ?? null,
        payload.decisionDate ?? null,
        payload.status ?? null,
        payload.options !== undefined ? JSON.stringify(payload.options) : null,
        payload.criteria !== undefined ? JSON.stringify(payload.criteria) : null,
        payload.expectedOutcome ?? null,
        payload.selectedOption !== undefined ? JSON.stringify(payload.selectedOption) : null,
        payload.confidence ?? null,
        payload.riskLevel ?? null,
        payload.importance ?? null,
        payload.timeHorizon ?? null,
        payload.notes ?? null,
        computed.qualityScore,
        JSON.stringify(computed.biasFlags),
      ],
      client
    );

    await writeAuditLog({
      userId,
      action: 'decision.update',
      entityType: 'decision',
      entityId: decisionId,
      severity: 'info',
      message: 'Decision updated.',
      ip,
      userAgent,
      requestId,
    });

    return rows[0];
  });
}

// PUBLIC_INTERFACE
async function deleteDecision({ userId, decisionId, ip, userAgent, requestId }) {
  /** Soft-delete a decision record (keeps audit/history). */
  const { rowCount } = await dbQuery(
    `
    UPDATE decisions
    SET deleted_at = NOW()
    WHERE id=$1 AND user_id=$2 AND deleted_at IS NULL
    `,
    [decisionId, userId]
  );
  if (rowCount === 0) throw new ApiError(404, 'NOT_FOUND', 'Decision not found.');

  await writeAuditLog({
    userId,
    action: 'decision.delete',
    entityType: 'decision',
    entityId: decisionId,
    severity: 'warn',
    message: 'Decision soft-deleted.',
    ip,
    userAgent,
    requestId,
  });

  return { deleted: true };
}

// --- analytics helpers (very lightweight heuristics, safe defaults) ---
function computeQualityAndBias(payload) {
  const options = Array.isArray(payload.options) ? payload.options : null;
  const criteria = Array.isArray(payload.criteria) ? payload.criteria : null;

  // Simple quality scoring heuristic, capped [0..100].
  let score = 30;
  if (payload.title && String(payload.title).trim().length >= 5) score += 10;
  if (payload.context && String(payload.context).trim().length >= 20) score += 10;
  if (options && options.length >= 2) score += 15;
  if (criteria && criteria.length >= 2) score += 15;
  if (payload.expectedOutcome && String(payload.expectedOutcome).trim().length >= 10) score += 10;
  if (payload.confidence !== undefined && payload.confidence !== null) score += 5;
  if (payload.riskLevel) score += 5;

  score = Math.max(0, Math.min(100, score));

  // Bias flags: simple pattern signals; can be improved later.
  const text = `${payload.title || ''} ${payload.context || ''} ${payload.notes || ''}`.toLowerCase();
  const biasFlags = [];

  const push = (type, evidence) => biasFlags.push({ type, evidence, detectedAt: new Date().toISOString() });

  if (payload.confidence !== undefined && payload.confidence !== null && Number(payload.confidence) >= 90) {
    push('overconfidence', `confidence=${payload.confidence}`);
  }
  if (/\balways\b|\bnever\b|\bguarantee(d)?\b/.test(text)) push('certainty_language', 'absolute terms');
  if (/\beveryone\b|\bthey all\b|\bmost people\b/.test(text)) push('bandwagon', 'social proof phrasing');
  if (/\brecent\b|\blast time\b|\byesterday\b/.test(text)) push('recency_bias', 'recency phrasing');

  return { qualityScore: score, biasFlags };
}

module.exports = { listDecisions, getDecision, createDecision, updateDecision, deleteDecision, computeQualityAndBias };
