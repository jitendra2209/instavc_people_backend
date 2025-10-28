import express from 'express';
import { googleAuth } from '../controllers/googleAuth.controller.js';

const router = express.Router();

/**
 * @swagger
 * /auth/google:
 *   post:
 *     tags: [Auth]
 *     summary: Google OAuth login/signup
 *     description: Authenticate or create account using Google ID token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - idToken
 *             properties:
 *               idToken:
 *                 type: string
 *                 description: Google ID token from client
 *                 example: eyJhbGciOiJSUzI1NiIs...
 *     responses:
 *       200:
 *         description: Successfully authenticated with Google
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Google login successful
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         email:
 *                           type: string
 *                         profilePicture:
 *                           type: string
 *                         authProvider:
 *                           type: string
 *                     token:
 *                       type: string
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 */
router.post('/google', googleAuth);

export default router;

