import { v4 as uuidv4 } from 'uuid';
import pool from '../config/db.config.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { formatRecord } from '../utils/recordFormatter.js';

// ============================================
// SCORES CONTROLLERS (Main CRUD Operations)
// ============================================

/**
 * Get all scores with filters and sorting
 * GET /api/scores?eventId=1&districtId=1&gender=male&page=1&limit=20
 */
export const getAllScores = asyncHandler(async (req, res) => {
  const {
    event_id,
    district_id,
    ds_office_id,
    gender,
    place,
    dateFrom,
    dateTo,
    search,
    page = 1,
    limit = 20,
    sortBy = 'created_at',
    sortOrder = 'desc'
  } = req.query;

  const connection = await pool.getConnection();

  try {
    // Build dynamic query
    let query = `SELECT w.id, w.athlete_name, w.certificate_no, w.gender, w.place,
                        e.name as event_name, e.code as event_code, e.record_format,
                        d.name as district_name, dso.name as ds_office_name,
                        w.record_value, u.username as entered_by,
                        w.created_at, w.updated_at, w.batch_id, w.athlete_position
                 FROM winners w
                 JOIN events e ON w.event_id = e.id
                 JOIN districts d ON w.district_id = d.id
                 JOIN ds_offices dso ON w.ds_office_id = dso.id
                 JOIN users u ON w.created_by = u.id
                 WHERE 1=1`;

    let params = [];

    // Apply filters
    if (event_id) {
      query += ' AND w.event_id = ?';
      params.push(event_id);
    }

    if (district_id) {
      query += ' AND w.district_id = ?';
      params.push(district_id);
    }

    if (ds_office_id) {
      query += ' AND w.ds_office_id = ?';
      params.push(ds_office_id);
    }

    if (gender) {
      query += ' AND w.gender = ?';
      params.push(gender);
    }

    if (place) {
      query += ' AND w.place = ?';
      params.push(place);
    }

    if (dateFrom) {
      query += ' AND w.created_at >= ?';
      params.push(new Date(dateFrom));
    }

    if (dateTo) {
      query += ' AND w.created_at <= ?';
      params.push(new Date(dateTo));
    }

    if (search) {
      query += ' AND (w.athlete_name LIKE ? OR w.certificate_no LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    // Apply sorting
    const validSortBy = ['created_at', 'athlete_name', 'record_value', 'place'];
    const validSortOrder = ['asc', 'desc'];
    const sortByField = validSortBy.includes(sortBy) ? sortBy : 'created_at';
    const sortOrderVal = validSortOrder.includes(sortOrder.toLowerCase()) ? sortOrder : 'desc';

    query += ` ORDER BY w.${sortByField} ${sortOrderVal}`;

    // Apply pagination
    const offset = (page - 1) * limit;
    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [scores] = await connection.query(query, params);

    // Get total count for pagination
    let countQuery = `SELECT COUNT(*) as total FROM winners w
                      JOIN events e ON w.event_id = e.id
                      WHERE 1=1`;
    let countParams = [];

    if (event_id) {
      countQuery += ' AND w.event_id = ?';
      countParams.push(event_id);
    }

    if (district_id) {
      countQuery += ' AND w.district_id = ?';
      countParams.push(district_id);
    }

    if (ds_office_id) {
      countQuery += ' AND w.ds_office_id = ?';
      countParams.push(ds_office_id);
    }

    if (gender) {
      countQuery += ' AND w.gender = ?';
      countParams.push(gender);
    }

    if (place) {
      countQuery += ' AND w.place = ?';
      countParams.push(place);
    }

    const [countResult] = await connection.query(countQuery, countParams);
    const total = countResult[0].total;

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Scores retrieved successfully',
      data: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
        scores
      }
    });

  } finally {
    connection.release();
  }
});

/**
 * Get single score record
 * GET /api/scores/:id
 */
export const getScore = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const connection = await pool.getConnection();

  try {
    const [scores] = await connection.query(
      `SELECT w.id, w.athlete_name, w.certificate_no, w.gender, w.place,
              e.id as event_id, e.name as event_name, e.code as event_code, e.record_format,
              d.id as district_id, d.name as district_name,
              dso.id as ds_office_id, dso.name as ds_office_name,
              w.record_value, w.created_by, w.created_at, w.updated_at, w.batch_id
       FROM winners w
       JOIN events e ON w.event_id = e.id
       JOIN districts d ON w.district_id = d.id
       JOIN ds_offices dso ON w.ds_office_id = dso.id
       WHERE w.id = ?`,
      [id]
    );

    if (scores.length === 0) {
      const error = new Error('Score record not found');
      error.status = 404;
      throw error;
    }

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Score record retrieved successfully',
      data: scores[0]
    });

  } finally {
    connection.release();
  }
});

/**
 * Create new score record(s)
 * POST /api/scores/submit
 * Handles both individual and relay entries
 */
export const createScores = asyncHandler(async (req, res) => {
  const { event_id, gender, athletes } = req.body;
  const userId = req.user.id;

  const connection = await pool.getConnection();

  try {
    // Start transaction
    await connection.beginTransaction();

    // Get event details
    const [events] = await connection.query(
      'SELECT id, event_type, relay_count, record_format FROM events WHERE id = ?',
      [event_id]
    );

    if (events.length === 0) {
      throw new Error('Event not found');
    }

    const event = events[0];
    const isRelay = event.event_type === 'relay';
    const athleteCountPerPlace = isRelay ? event.relay_count : 1;

    // Validate athlete count
    const expectedCount = athleteCountPerPlace * 3; // 3 places
    if (athletes.length !== expectedCount) {
      throw new Error(`Expected ${expectedCount} athletes for this event, received ${athletes.length}`);
    }

    const createdScores = [];

    // Process each athlete
    for (const athlete of athletes) {
      // Format record value
      const formatResult = formatRecord(athlete.record_value, event.record_format);
      if (!formatResult.success) {
        throw new Error(`Invalid record format: ${formatResult.error}`);
      }

      // Check if certificate already exists for this event
      const [existingCerts] = await connection.query(
        'SELECT id FROM winners WHERE event_id = ? AND certificate_no = ?',
        [event_id, athlete.certificate_no]
      );

      if (existingCerts.length > 0) {
        throw new Error(`Certificate number "${athlete.certificate_no}" already exists for this event`);
      }

      // Generate batch_id for relay athletes in same place
      let batchId = uuidv4();
      if (isRelay) {
        // If this is a relay, use same batch_id for athletes in the same place
        const athleteIndex = athletes.indexOf(athlete);
        const placeIndex = Math.floor(athleteIndex / athleteCountPerPlace);
        const positionInPlace = (athleteIndex % athleteCountPerPlace);

        // Look for existing batch_id for this place
        const existingBatch = createdScores.find(score =>
          score.place === athlete.place && score.batch_id
        );

        if (existingBatch) {
          batchId = existingBatch.batch_id;
        }
      }

      // Insert score record
      const [result] = await connection.query(
        `INSERT INTO winners (
          event_id, district_id, ds_office_id, gender, place,
          batch_id, athlete_position, athlete_name, certificate_no,
          record_value, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          event_id,
          athlete.district_id,
          athlete.ds_office_id,
          gender,
          athlete.place,
          batchId,
          isRelay ? (athletes.indexOf(athlete) % athleteCountPerPlace) + 1 : null,
          athlete.athlete_name,
          athlete.certificate_no,
          formatResult.value,
          userId
        ]
      );

      createdScores.push({
        id: result.insertId,
        athlete_name: athlete.athlete_name,
        certificate_no: athlete.certificate_no,
        place: athlete.place,
        batch_id: batchId
      });
    }

    // Commit transaction
    await connection.commit();

    res.status(201).json({
      success: true,
      statusCode: 201,
      message: `${createdScores.length} score record(s) created successfully`,
      data: {
        count: createdScores.length,
        scores: createdScores
      }
    });

  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
});

/**
 * Update score record
 * PUT /api/scores/:id
 */
export const updateScore = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { athlete_name, certificate_no, record_value, district_id, ds_office_id, gender } = req.body;

  const connection = await pool.getConnection();

  try {
    // Get current score record
    const [scores] = await connection.query(
      'SELECT event_id, certificate_no FROM winners WHERE id = ?',
      [id]
    );

    if (scores.length === 0) {
      const error = new Error('Score record not found');
      error.status = 404;
      throw error;
    }

    const currentScore = scores[0];

    // If certificate number is being changed, check for duplicates
    if (certificate_no && certificate_no !== currentScore.certificate_no) {
      const [duplicates] = await connection.query(
        'SELECT id FROM winners WHERE event_id = ? AND certificate_no = ? AND id != ?',
        [currentScore.event_id, certificate_no, id]
      );

      if (duplicates.length > 0) {
        throw new Error('Certificate number already exists for this event');
      }
    }

    // Format record if being updated
    let updateData = {
      athlete_name,
      certificate_no,
      record_value,
      district_id,
      ds_office_id,
      gender,
      updated_by: req.user.id,
      updated_at: new Date()
    };

    // Remove undefined values
    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

    if (record_value) {
      const [events] = await connection.query(
        'SELECT record_format FROM events WHERE id = (SELECT event_id FROM winners WHERE id = ?)',
        [id]
      );

      if (events.length > 0) {
        const formatResult = formatRecord(record_value, events[0].record_format);
        if (!formatResult.success) {
          throw new Error(`Invalid record format: ${formatResult.error}`);
        }
        updateData.record_value = formatResult.value;
      }
    }

    // Build update query
    let updateQuery = 'UPDATE winners SET ';
    const updateValues = [];
    const keys = Object.keys(updateData);

    keys.forEach((key, index) => {
      updateQuery += `${key} = ?`;
      if (index < keys.length - 1) updateQuery += ', ';
      updateValues.push(updateData[key]);
    });

    updateQuery += ' WHERE id = ?';
    updateValues.push(id);

    await connection.query(updateQuery, updateValues);

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Score record updated successfully',
      data: {
        id,
        updated: updateData
      }
    });

  } finally {
    connection.release();
  }
});

/**
 * Delete score record
 * DELETE /api/scores/:id
 */
export const deleteScore = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const connection = await pool.getConnection();

  try {
    // Check if record exists
    const [scores] = await connection.query(
      'SELECT id, batch_id FROM winners WHERE id = ?',
      [id]
    );

    if (scores.length === 0) {
      const error = new Error('Score record not found');
      error.status = 404;
      throw error;
    }

    const score = scores[0];

    // Check if this is part of a relay team
    if (score.batch_id) {
      const [teamMembers] = await connection.query(
        'SELECT COUNT(*) as count FROM winners WHERE batch_id = ?',
        [score.batch_id]
      );

      if (teamMembers[0].count > 1) {
        // Delete entire relay team
        await connection.query('DELETE FROM winners WHERE batch_id = ?', [score.batch_id]);
      } else {
        // Delete single record
        await connection.query('DELETE FROM winners WHERE id = ?', [id]);
      }
    } else {
      // Delete single record
      await connection.query('DELETE FROM winners WHERE id = ?', [id]);
    }

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Score record(s) deleted successfully',
      data: {
        id
      }
    });

  } finally {
    connection.release();
  }
});

/**
 * Get relay team members by batch ID
 * GET /api/scores/batch/:batchId
 */
export const getRelayTeam = asyncHandler(async (req, res) => {
  const { batchId } = req.params;

  const connection = await pool.getConnection();

  try {
    const [team] = await connection.query(
      `SELECT id, athlete_name, certificate_no, athlete_position, gender, place
       FROM winners
       WHERE batch_id = ?
       ORDER BY athlete_position ASC`,
      [batchId]
    );

    if (team.length === 0) {
      const error = new Error('Relay team not found');
      error.status = 404;
      throw error;
    }

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Relay team retrieved successfully',
      data: {
        batch_id: batchId,
        members: team.length,
        team
      }
    });

  } finally {
    connection.release();
  }
});

export default {
  getAllScores,
  getScore,
  createScores,
  updateScore,
  deleteScore,
  getRelayTeam
};
