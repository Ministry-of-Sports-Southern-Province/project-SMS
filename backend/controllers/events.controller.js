import pool from '../config/db.config.js';
import { asyncHandler } from '../middleware/errorHandler.js';

// ============================================
// SPORT CATEGORIES & EVENTS CONTROLLERS
// ============================================

/**
 * Get all sport categories
 * GET /api/events/categories
 */
export const getAllCategories = asyncHandler(async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const [categories] = await connection.query(
      `SELECT id, code, name, description, is_active
       FROM sport_categories
       WHERE is_active = TRUE
       ORDER BY code ASC`
    );

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Categories retrieved successfully',
      data: {
        total: categories.length,
        categories
      }
    });

  } finally {
    connection.release();
  }
});

/**
 * Get events by category
 * GET /api/events/categories/:categoryId
 */
export const getEventsByCategory = asyncHandler(async (req, res) => {
  const { categoryId } = req.params;

  const connection = await pool.getConnection();

  try {
    // Verify category exists
    const [category] = await connection.query(
      'SELECT id, code, name FROM sport_categories WHERE id = ? AND is_active = TRUE',
      [categoryId]
    );

    if (category.length === 0) {
      const error = new Error('Sport category not found');
      error.status = 404;
      throw error;
    }

    // Get events for this category
    const [events] = await connection.query(
      `SELECT id, code, name, event_type, relay_count, gender, record_format, places_count
       FROM events
       WHERE sport_category_id = ? AND is_active = TRUE
       ORDER BY name ASC`,
      [categoryId]
    );

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Events retrieved successfully',
      data: {
        category: category[0],
        total: events.length,
        events
      }
    });

  } finally {
    connection.release();
  }
});

/**
 * Get single event details
 * GET /api/events/:eventId
 */
export const getEventDetails = asyncHandler(async (req, res) => {
  const { eventId } = req.params;

  const connection = await pool.getConnection();

  try {
    const [events] = await connection.query(
      `SELECT e.id, e.code, e.name, e.description, e.event_type, e.relay_count, e.gender,
              e.record_format, e.places_count, sc.code as category_code, sc.name as category_name
       FROM events e
       JOIN sport_categories sc ON e.sport_category_id = sc.id
       WHERE e.id = ? AND e.is_active = TRUE`,
      [eventId]
    );

    if (events.length === 0) {
      const error = new Error('Event not found');
      error.status = 404;
      throw error;
    }

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Event details retrieved successfully',
      data: events[0]
    });

  } finally {
    connection.release();
  }
});

/**
 * Get all events (with optional category filter)
 * GET /api/events?categoryId=1
 */
export const getAllEvents = asyncHandler(async (req, res) => {
  const { categoryId } = req.query;

  const connection = await pool.getConnection();

  try {
    let query = `SELECT e.id, e.code, e.name, e.event_type, e.relay_count, e.gender,
                        e.record_format, e.places_count, sc.code as category_code, sc.name as category_name
                 FROM events e
                 JOIN sport_categories sc ON e.sport_category_id = sc.id
                 WHERE e.is_active = TRUE AND sc.is_active = TRUE`;

    let params = [];

    if (categoryId) {
      query += ' AND sc.id = ?';
      params.push(categoryId);
    }

    query += ' ORDER BY sc.code ASC, e.name ASC';

    const [events] = await connection.query(query, params);

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Events retrieved successfully',
      data: {
        total: events.length,
        events
      }
    });

  } finally {
    connection.release();
  }
});

export default {
  getAllCategories,
  getEventsByCategory,
  getEventDetails,
  getAllEvents
};
