const express = require('express');
const adminController = require('../controllers/admin');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { auditQuerySchema } = require('../schemas');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Admin
 *     description: Administrative endpoints (requires admin role)
 */

/**
 * @swagger
 * /admin/users:
 *   get:
 *     tags: [Admin]
 *     summary: List users (admin only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/users', requireAuth, requireAdmin, adminController.listUsers.bind(adminController));

/**
 * @swagger
 * /admin/audit:
 *   get:
 *     tags: [Admin]
 *     summary: View audit logs (admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 100, minimum: 1, maximum: 500 }
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/audit', requireAuth, requireAdmin, validate({ query: auditQuerySchema }), adminController.auditLogs.bind(adminController));

module.exports = router;
