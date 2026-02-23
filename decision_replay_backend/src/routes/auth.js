const express = require('express');
const authController = require('../controllers/auth');
const { validate } = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const { authSignupSchema, authLoginSchema } = require('../schemas');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Auth
 *     description: Authentication and session endpoints
 */

/**
 * @swagger
 * /auth/signup:
 *   post:
 *     tags: [Auth]
 *     summary: Sign up with email and password
 *     description: Creates a new user and issues an access token (opaque bearer token stored hashed in DB).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               username: { type: string }
 *               displayName: { type: string }
 *               password: { type: string, format: password, minLength: 8 }
 *     responses:
 *       201:
 *         description: Created
 */
router.post('/signup', validate({ body: authSignupSchema }), authController.signup.bind(authController));

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Log in
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string, format: password }
 *     responses:
 *       200:
 *         description: OK
 */
router.post('/login', validate({ body: authLoginSchema }), authController.login.bind(authController));

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Log out (revoke current access token)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OK
 */
router.post('/logout', requireAuth, authController.logout.bind(authController));

/**
 * @swagger
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get current user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/me', requireAuth, authController.me.bind(authController));

module.exports = router;
