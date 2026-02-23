const express = require('express');
const decisionsController = require('../controllers/decisions');
const { requireAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { uuid, decisionsListQuerySchema, decisionCreateSchema, decisionUpdateSchema } = require('../schemas');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Decisions
 *     description: Decision CRUD
 */

/**
 * @swagger
 * /decisions:
 *   get:
 *     tags: [Decisions]
 *     summary: List decisions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *         description: Optional text filter over title/context/notes
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [open, closed, archived] }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 50 }
 *       - in: query
 *         name: offset
 *         schema: { type: integer, default: 0 }
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/', requireAuth, validate({ query: decisionsListQuerySchema }), decisionsController.list.bind(decisionsController));

/**
 * @swagger
 * /decisions:
 *   post:
 *     tags: [Decisions]
 *     summary: Create a decision
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title: { type: string }
 *               context: { type: string }
 *               decisionDate: { type: string, description: ISO date string }
 *               status: { type: string, enum: [open, closed, archived] }
 *               options: { type: array, items: {} }
 *               criteria: { type: array, items: {} }
 *               expectedOutcome: { type: string }
 *               selectedOption: {}
 *               confidence: { type: number, minimum: 0, maximum: 100 }
 *               riskLevel: { type: string }
 *               importance: { type: integer, minimum: 1, maximum: 5 }
 *               timeHorizon: { type: string }
 *               notes: { type: string }
 *     responses:
 *       201:
 *         description: Created
 */
router.post('/', requireAuth, validate({ body: decisionCreateSchema }), decisionsController.create.bind(decisionsController));

/**
 * @swagger
 * /decisions/{decisionId}:
 *   get:
 *     tags: [Decisions]
 *     summary: Get a decision
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
 *       404:
 *         description: Not found
 */
router.get(
  '/:decisionId',
  requireAuth,
  validate({ params: require('zod').z.object({ decisionId: uuid }) }),
  decisionsController.get.bind(decisionsController)
);

/**
 * @swagger
 * /decisions/{decisionId}:
 *   put:
 *     tags: [Decisions]
 *     summary: Update a decision
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
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: OK
 */
router.put(
  '/:decisionId',
  requireAuth,
  validate({
    params: require('zod').z.object({ decisionId: uuid }),
    body: decisionUpdateSchema,
  }),
  decisionsController.update.bind(decisionsController)
);

/**
 * @swagger
 * /decisions/{decisionId}:
 *   delete:
 *     tags: [Decisions]
 *     summary: Delete (soft-delete) a decision
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
router.delete(
  '/:decisionId',
  requireAuth,
  validate({ params: require('zod').z.object({ decisionId: uuid }) }),
  decisionsController.remove.bind(decisionsController)
);

module.exports = router;
