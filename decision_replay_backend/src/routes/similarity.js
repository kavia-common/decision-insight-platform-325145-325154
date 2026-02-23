const express = require('express');
const similarityController = require('../controllers/similarity');
const { requireAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { similaritySearchSchema } = require('../schemas');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Similarity
 *     description: Similarity search endpoints (safe default using text search)
 */

/**
 * @swagger
 * /similarity/search:
 *   post:
 *     tags: [Similarity]
 *     summary: Search for similar decisions
 *     description: Uses a safe default text search. Vector embeddings integration can be added later.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [query]
 *             properties:
 *               query: { type: string }
 *               limit: { type: integer, default: 10, minimum: 1, maximum: 50 }
 *     responses:
 *       200:
 *         description: OK
 */
router.post('/search', requireAuth, validate({ body: similaritySearchSchema }), similarityController.search.bind(similarityController));

module.exports = router;
