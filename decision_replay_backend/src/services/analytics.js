const { dbQuery } = require('../db/query');

// PUBLIC_INTERFACE
async function getRollups({ userId, from, to }) {
  /** Basic rollups for dashboard charts (counts, averages). */
  const params = [userId];
  let where = 'd.user_id=$1 AND d.deleted_at IS NULL';
  if (from) {
    params.push(from);
    where += ` AND d.decision_date >= $${params.length}::date`;
  }
  if (to) {
    params.push(to);
    where += ` AND d.decision_date <= $${params.length}::date`;
  }

  const decisionsAgg = await dbQuery(
    `
    SELECT
      COUNT(*)::int AS decisions_count,
      AVG(d.quality_score)::float AS avg_quality_score,
      AVG(d.confidence)::float AS avg_confidence
    FROM decisions d
    WHERE ${where}
    `,
    params
  );

  const statusAgg = await dbQuery(
    `
    SELECT d.status, COUNT(*)::int AS count
    FROM decisions d
    WHERE ${where}
    GROUP BY d.status
    ORDER BY d.status
    `,
    params
  );

  const outcomesAgg = await dbQuery(
    `
    SELECT
      COUNT(o.*)::int AS outcomes_count,
      AVG(o.satisfaction)::float AS avg_satisfaction
    FROM outcomes o
    JOIN decisions d ON d.id = o.decision_id
    WHERE d.user_id=$1 AND d.deleted_at IS NULL
    `,
    [userId]
  );

  const biasAgg = await dbQuery(
    `
    SELECT
      COALESCE(bias_item->>'type','unknown') AS type,
      COUNT(*)::int AS count
    FROM decisions d,
      LATERAL jsonb_array_elements(d.bias_signals) AS bias_item
    WHERE ${where}
    GROUP BY type
    ORDER BY count DESC
    LIMIT 20
    `,
    params
  );

  return {
    decisions: decisionsAgg.rows[0],
    decisionsByStatus: statusAgg.rows,
    outcomes: outcomesAgg.rows[0],
    biasByType: biasAgg.rows,
  };
}

// PUBLIC_INTERFACE
async function analyzeDecision({ userId, decisionId }) {
  /** Return quality score + bias flags for a given decision, including some light explanations. */
  const { rows } = await dbQuery(
    `
    SELECT id, title, quality_score, bias_signals, confidence, options, criteria, context, notes
    FROM decisions
    WHERE id=$1 AND user_id=$2 AND deleted_at IS NULL
    LIMIT 1
    `,
    [decisionId, userId]
  );
  if (!rows[0]) return null;

  const bias = Array.isArray(rows[0].bias_signals) ? rows[0].bias_signals : rows[0].bias_signals || [];
  const qualityScore = rows[0].quality_score;

  return {
    decisionId: rows[0].id,
    title: rows[0].title,
    qualityScore,
    biasFlags: bias,
    hints: buildHints(rows[0]),
  };
}

function buildHints(d) {
  const hints = [];
  if (!d.context || String(d.context).trim().length < 20) hints.push('Add more context to improve decision quality scoring.');
  if (!Array.isArray(d.options) || d.options.length < 2) hints.push('Consider at least two options to reduce framing bias.');
  if (!Array.isArray(d.criteria) || d.criteria.length < 2) hints.push('Define criteria to support more objective evaluation.');
  if (d.confidence !== null && d.confidence !== undefined && Number(d.confidence) >= 90) {
    hints.push('Very high confidence can correlate with overconfidence bias; consider counter-evidence.');
  }
  return hints;
}

module.exports = { getRollups, analyzeDecision };
