const express = require('express');
const healthController = require('../controllers/health');

const authRoutes = require('./auth');
const decisionsRoutes = require('./decisions');
const outcomesRoutes = require('./outcomes');
const analyticsRoutes = require('./analytics');
const similarityRoutes = require('./similarity');
const adminRoutes = require('./admin');

const router = express.Router();

/**
 * @swagger
 * /:
 *   get:
 *     summary: Health endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service health check passed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 message:
 *                   type: string
 *                   example: Service is healthy
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 environment:
 *                   type: string
 *                   example: development
 */
router.get('/', healthController.check.bind(healthController));

// Feature routers
router.use('/auth', authRoutes);
router.use('/decisions', decisionsRoutes);
router.use('/', outcomesRoutes); // contains /decisions/:id/outcomes + /outcomes/:id
router.use('/analytics', analyticsRoutes);
router.use('/similarity', similarityRoutes);
router.use('/admin', adminRoutes);

module.exports = router;
