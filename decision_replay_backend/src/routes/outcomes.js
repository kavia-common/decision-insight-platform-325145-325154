const express = require('express');
const outcomesController = require('../controllers/outcomes');
const { requireAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { uuid, outcomeCreateSchema, outcomeUpdateSchema } = require('../schemas');
const { z } = require('zod');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Outcomes
 *     description: Outcome CRUD
 */

/**
 * @swagger
 * /decisions/{decisionId}/outcomes:
 *   get:
 *     tags: [Outcomes]
 *     summary: List outcomes for a decision
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
  '/decisions/:decisionId/outcomes',
  requireAuth,
  validate({ params: z.object({ decisionId: uuid }) }),
  outcomesController.list.bind(outcomesController)
);

/**
 * @swagger
 * /decisions/{decisionId}/outcomes:
 *   post:
 *     tags: [Outcomes]
 *     summary: Create an outcome for a decision
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: decisionId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       201:
 *         description: Created
 */
router.post(
  '/decisions/:decisionId/outcomes',
  requireAuth,
  validate({ params: z.object({ decisionId: uuid }), body: outcomeCreateSchema }),
  outcomesController.create.bind(outcomesController)
);

/**
 * @swagger
 * /outcomes/{outcomeId}:
 *   put:
 *     tags: [Outcomes]
 *     summary: Update an outcome
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: outcomeId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200:
 *         description: OK
 */
router.put(
  '/outcomes/:outcomeId',
  requireAuth,
  validate({ params: z.object({ outcomeId: uuid }), body: outcomeUpdateSchema }),
  outcomesController.update.bind(outcomesController)
);

/**
 * @swagger
 * /outcomes/{outcomeId}:
 *   delete:
 *     tags: [Outcomes]
 *     summary: Delete an outcome
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: outcomeId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: OK
 */
router.delete(
  '/outcomes/:outcomeId',
  requireAuth,
  validate({ params: z.object({ outcomeId: uuid }) }),
  outcomesController.remove.bind(outcomesController)
);

module.exports = router;
