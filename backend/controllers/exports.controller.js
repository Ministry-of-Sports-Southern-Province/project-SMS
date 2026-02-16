import pool from '../config/db.config.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { generateExcelReport, generateSummaryReport } from '../utils/generateExcel.js';
import { generatePDFReport, generatePDFSummary } from '../utils/generatePDF.js';

// ============================================
// EXPORT CONTROLLERS
// ============================================

/**
 * Build query based on filters (used in both GET and export)
 */
const buildScoresQuery = (filters = {}) => {
  let query = `SELECT w.id, w.athlete_name, w.certificate_no, w.gender, w.place,
                      e.name as event_name, e.code as event_code, e.record_format,
                      d.name as district_name, dso.name as ds_office_name,
                      w.record_value, u.username as entered_by,
                      w.created_at, w.updated_at
               FROM winners w
               JOIN events e ON w.event_id = e.id
               JOIN districts d ON w.district_id = d.id
               JOIN ds_offices dso ON w.ds_office_id = dso.id
               JOIN users u ON w.created_by = u.id
               WHERE 1=1`;

  let params = [];

  if (filters.event_id) {
    query += ' AND w.event_id = ?';
    params.push(filters.event_id);
  }

  if (filters.district_id) {
    query += ' AND w.district_id = ?';
    params.push(filters.district_id);
  }

  if (filters.ds_office_id) {
    query += ' AND w.ds_office_id = ?';
    params.push(filters.ds_office_id);
  }

  if (filters.gender) {
    query += ' AND w.gender = ?';
    params.push(filters.gender);
  }

  if (filters.place) {
    query += ' AND w.place = ?';
    params.push(filters.place);
  }

  if (filters.dateFrom) {
    query += ' AND w.created_at >= ?';
    params.push(new Date(filters.dateFrom));
  }

  if (filters.dateTo) {
    query += ' AND w.created_at <= ?';
    params.push(new Date(filters.dateTo));
  }

  if (filters.search) {
    query += ' AND (w.athlete_name LIKE ? OR w.certificate_no LIKE ?)';
    const searchTerm = `%${filters.search}%`;
    params.push(searchTerm, searchTerm);
  }

  query += ' ORDER BY e.name ASC, w.place ASC, w.created_at DESC';

  return { query, params };
};

/**
 * Export scores to Excel
 * POST /api/export/excel
 */
export const exportToExcel = asyncHandler(async (req, res) => {
  const filters = req.body;

  const connection = await pool.getConnection();

  try {
    const { query, params } = buildScoresQuery(filters);

    const [scores] = await connection.query(query, params);

    if (scores.length === 0) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'No records found matching the filters'
      });
    }

    const buffer = await generateExcelReport(scores);

    // Set response headers
    const filename = `sports-scores-${new Date().getTime()}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);

    res.send(buffer);

  } finally {
    connection.release();
  }
});

/**
 * Export summary statistics to Excel
 * POST /api/export/excel-summary
 */
export const exportSummaryToExcel = asyncHandler(async (req, res) => {
  const filters = req.body;

  const connection = await pool.getConnection();

  try {
    // Get total records
    const totalQuery = 'SELECT COUNT(*) as total FROM winners';
    const [[{ total }]] = await connection.query(totalQuery);

    // Get unique athletes
    const uniqueQuery = 'SELECT COUNT(DISTINCT certificate_no) as unique_athletes FROM winners';
    const [[{ unique_athletes }]] = await connection.query(uniqueQuery);

    // Get events covered
    const eventsQuery = 'SELECT COUNT(DISTINCT event_id) as events_count FROM winners';
    const [[{ events_count }]] = await connection.query(eventsQuery);

    // Get records by district
    const districtQuery = `
      SELECT d.name as district_name, COUNT(*) as count
      FROM winners w
      JOIN districts d ON w.district_id = d.id
      GROUP BY d.id, d.name
      ORDER BY count DESC
    `;
    const [byDistrict] = await connection.query(districtQuery);

    // Get records by event
    const eventQuery = `
      SELECT e.name as event_name, COUNT(*) as count
      FROM winners w
      JOIN events e ON w.event_id = e.id
      GROUP BY e.id, e.name
      ORDER BY count DESC
    `;
    const [byEvent] = await connection.query(eventQuery);

    const summaryData = {
      totalRecords: total,
      uniqueAthletes: unique_athletes,
      eventsCovered: events_count,
      byDistrict,
      byEvent
    };

    const buffer = await generateSummaryReport(summaryData);

    const filename = `sports-summary-${new Date().getTime()}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);

    res.send(buffer);

  } finally {
    connection.release();
  }
});

/**
 * Export scores to PDF
 * POST /api/export/pdf
 */
export const exportToPDF = asyncHandler(async (req, res) => {
  const filters = req.body;

  const connection = await pool.getConnection();

  try {
    const { query, params } = buildScoresQuery(filters);

    const [scores] = await connection.query(query, params);

    if (scores.length === 0) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'No records found matching the filters'
      });
    }

    const buffer = await generatePDFReport(scores);

    const filename = `sports-scores-${new Date().getTime()}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);

    res.send(buffer);

  } finally {
    connection.release();
  }
});

/**
 * Export summary statistics to PDF
 * POST /api/export/pdf-summary
 */
export const exportSummaryToPDF = asyncHandler(async (req, res) => {
  const connection = await pool.getConnection();

  try {
    // Get total records
    const totalQuery = 'SELECT COUNT(*) as total FROM winners';
    const [[{ total }]] = await connection.query(totalQuery);

    // Get unique athletes
    const uniqueQuery = 'SELECT COUNT(DISTINCT certificate_no) as unique_athletes FROM winners';
    const [[{ unique_athletes }]] = await connection.query(uniqueQuery);

    // Get events covered
    const eventsQuery = 'SELECT COUNT(DISTINCT event_id) as events_count FROM winners';
    const [[{ events_count }]] = await connection.query(eventsQuery);

    // Get records by district
    const districtQuery = `
      SELECT d.name as district_name, COUNT(*) as count
      FROM winners w
      JOIN districts d ON w.district_id = d.id
      GROUP BY d.id, d.name
      ORDER BY count DESC
    `;
    const [byDistrict] = await connection.query(districtQuery);

    // Get records by event
    const eventQuery = `
      SELECT e.name as event_name, COUNT(*) as count
      FROM winners w
      JOIN events e ON w.event_id = e.id
      GROUP BY e.id, e.name
      ORDER BY count DESC
    `;
    const [byEvent] = await connection.query(eventQuery);

    const summaryData = {
      totalRecords: total,
      uniqueAthletes: unique_athletes,
      eventsCovered: events_count,
      byDistrict,
      byEvent
    };

    const buffer = await generatePDFSummary(summaryData);

    const filename = `sports-summary-${new Date().getTime()}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);

    res.send(buffer);

  } finally {
    connection.release();
  }
});

export default {
  exportToExcel,
  exportSummaryToExcel,
  exportToPDF,
  exportSummaryToPDF
};
