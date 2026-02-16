import pool from '../config/db.config.js';
import { asyncHandler } from '../middleware/errorHandler.js';

// ============================================
// DS OFFICES CONTROLLERS
// ============================================

/**
 * Get DS offices by district
 * GET /api/ds-offices?districtId=1
 */
export const getDSOfficesByDistrict = asyncHandler(async (req, res) => {
  const { districtId } = req.query;

  const connection = await pool.getConnection();

  try {
    if (!districtId) {
      const error = new Error('District ID is required');
      error.status = 400;
      throw error;
    }

    // Verify district exists
    const [districts] = await connection.query(
      'SELECT id, name FROM districts WHERE id = ?',
      [districtId]
    );

    if (districts.length === 0) {
      const error = new Error('District not found');
      error.status = 404;
      throw error;
    }

    // Get DS offices for this district
    const [offices] = await connection.query(
      `SELECT id, district_id, name
       FROM ds_offices
       WHERE district_id = ?
       ORDER BY name ASC`,
      [districtId]
    );

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'DS offices retrieved successfully',
      data: {
        district: districts[0],
        total: offices.length,
        offices
      }
    });

  } finally {
    connection.release();
  }
});

/**
 * Get all districts
 * GET /api/districts
 */
export const getAllDistricts = asyncHandler(async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const [districts] = await connection.query(
      'SELECT id, name FROM districts ORDER BY id ASC'
    );

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Districts retrieved successfully',
      data: {
        total: districts.length,
        districts
      }
    });

  } finally {
    connection.release();
  }
});

/**
 * Get all DS offices (with optional district filter)
 * GET /api/ds-offices
 */
export const getAllDSOffices = asyncHandler(async (req, res) => {
  const { districtId } = req.query;

  const connection = await pool.getConnection();

  try {
    let query = `SELECT d.id as district_id, d.name as district_name,
                        dso.id, dso.name
                 FROM ds_offices dso
                 JOIN districts d ON dso.district_id = d.id`;

    let params = [];

    if (districtId) {
      query += ' WHERE dso.district_id = ?';
      params.push(districtId);
    }

    query += ' ORDER BY d.id ASC, dso.name ASC';

    const [offices] = await connection.query(query, params);

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'DS offices retrieved successfully',
      data: {
        total: offices.length,
        offices
      }
    });

  } finally {
    connection.release();
  }
});

/**
 * Get DS office details
 * GET /api/ds-offices/:officeId
 */
export const getDSOfficeDetails = asyncHandler(async (req, res) => {
  const { officeId } = req.params;

  const connection = await pool.getConnection();

  try {
    const [offices] = await connection.query(
      `SELECT dso.id, dso.name, d.id as district_id, d.name as district_name
       FROM ds_offices dso
       JOIN districts d ON dso.district_id = d.id
       WHERE dso.id = ?`,
      [officeId]
    );

    if (offices.length === 0) {
      const error = new Error('DS office not found');
      error.status = 404;
      throw error;
    }

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'DS office details retrieved successfully',
      data: offices[0]
    });

  } finally {
    connection.release();
  }
});

export default {
  getDSOfficesByDistrict,
  getAllDistricts,
  getAllDSOffices,
  getDSOfficeDetails
};
