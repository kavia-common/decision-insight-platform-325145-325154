const express = require('express');
const analyticsController = require('../controllers/analytics');
const { requireAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { uuid } = require('../schemas');
const { z } = require('zod');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Analytics
 *     description: Insights and rollup endpoints
 */

/**
 * @swagger
 * /analytics/rollups:
 *   get:
 *     tags: [Analytics]
 *     summary: Get rollups for decisions/outcomes/biases
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         schema: { type: string }
 *         description: ISO date (inclusive)
 *       - in: query
 *         name: to
 *         schema: { type: string }
 *         description: ISO date (inclusive)
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/rollups', requireAuth, analyticsController.rollups.bind(analyticsController));

/**
 * @swagger
 * /analytics/decisions/{decisionId}/insights:
 *   get:
 *     tags: [Analytics]
 *     summary: Get quality score and bias flags for a decision
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: decisionId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: OK
 */
router.get(
  '/decisions/:decisionId/insights',
  requireAuth,
  validate({ params: z.object({ decisionId: uuid }) }),
  analyticsController.decisionInsights.bind(analyticsController)
);

module.exports = router;
