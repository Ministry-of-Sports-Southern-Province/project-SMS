import express from 'express';
import { verifyToken } from '../middleware/auth.middleware.js';
import * as eventsController from '../controllers/events.controller.js';

const router = express.Router();

/**
 * GET /api/events/categories
 * Get all sport categories
 */
router.get('/categories', eventsController.getAllCategories);

/**
 * GET /api/events/categories/:categoryId
 * Get events by category
 */
router.get('/categories/:categoryId', eventsController.getEventsByCategory);

/**
 * GET /api/events/:eventId
 * Get single event details
 */
router.get('/:eventId', eventsController.getEventDetails);

/**
 * GET /api/events
 * Get all events (with optional category filter)
 */
router.get('/', eventsController.getAllEvents);

export default router;
