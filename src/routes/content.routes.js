import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { generateContent, getContentById, getUserContent } from '../controllers/content.controller.js';

const router = express.Router();

/**
 * @swagger
 * /content/generate:
 *   post:
 *     summary: Generate content using Gemini AI
 *     tags: [Content]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - query
 *             properties:
 *               query:
 *                 type: string
 *                 description: The query to generate content for
 *     responses:
 *       201:
 *         description: Content generated successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/generate', authenticateToken, generateContent);

/**
 * @swagger
 * /content/user/all:
 *   get:
 *     summary: Get all content for the authenticated user
 *     tags: [Content]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Content retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/user/all', authenticateToken, getUserContent);

/**
 * @swagger
 * /content/{id}:
 *   get:
 *     summary: Get content by ID
 *     tags: [Content]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Content ID
 *     responses:
 *       200:
 *         description: Content retrieved successfully
 *       404:
 *         description: Content not found
 *       500:
 *         description: Server error
 */
router.get('/:id', authenticateToken, getContentById);

export default router;