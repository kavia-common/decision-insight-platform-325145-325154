const { dbQuery } = require('../db/query');

// PUBLIC_INTERFACE
async function similaritySearch({ userId, queryText, limit = 10 }) {
  /**
   * Safe default similarity search using basic text search (ILIKE).
   * This is a placeholder for future vector embedding integration.
   */
  const q = `%${queryText}%`;

  const { rows } = await dbQuery(
    `
    SELECT
      d.id,
      d.title,
      d.context,
      d.decision_date,
      d.status,
      d.quality_score,
      d.bias_signals,
      -- very rough score: prefer title matches, then context/notes
      (
        CASE WHEN d.title ILIKE $2 THEN 0.9 ELSE 0 END +
        CASE WHEN COALESCE(d.context,'') ILIKE $2 THEN 0.6 ELSE 0 END +
        CASE WHEN COALESCE(d.notes,'') ILIKE $2 THEN 0.4 ELSE 0 END
      )::float AS similarity
    FROM decisions d
    WHERE d.user_id = $1 AND d.deleted_at IS NULL
      AND (d.title ILIKE $2 OR COALESCE(d.context,'') ILIKE $2 OR COALESCE(d.notes,'') ILIKE $2)
    ORDER BY similarity DESC, d.decision_date DESC
    LIMIT $3
    `,
    [userId, q, limit]
  );

  return rows;
}

module.exports = { similaritySearch };
