import express from 'express';
import { validateRequest, validateQuery } from '../middleware/validation.middleware.js';
import { verifyToken } from '../middleware/auth.middleware.js';
import { createScoreSchema, scoresFilterSchema } from '../validators/schemas.js';
import * as scoresController from '../controllers/scores.controller.js';

const router = express.Router();

// All score endpoints require authentication
router.use(verifyToken);

/**
 * GET /api/scores
 * Get all scores with filters, sorting, and pagination
 */
router.get('/', validateQuery(scoresFilterSchema), scoresController.getAllScores);

/**
 * POST /api/scores/submit
 * Create new score record(s)
 */
router.post('/submit', validateRequest(createScoreSchema), scoresController.createScores);

/**
 * GET /api/scores/batch/:batchId
 * Get relay team members by batch ID
 */
router.get('/batch/:batchId', scoresController.getRelayTeam);

/**
 * GET /api/scores/:id
 * Get single score record
 */
router.get('/:id', scoresController.getScore);

/**
 * PUT /api/scores/:id
 * Update score record
 */
router.put('/:id', scoresController.updateScore);

/**
 * DELETE /api/scores/:id
 * Delete score record
 */
router.delete('/:id', scoresController.deleteScore);

export default router;
