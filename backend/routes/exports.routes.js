import express from 'express';
import { verifyToken } from '../middleware/auth.middleware.js';
import * as exportsController from '../controllers/exports.controller.js';

const router = express.Router();

// All export endpoints require authentication
router.use(verifyToken);

/**
 * POST /api/export/excel
 * Export scores to Excel with filters
 */
router.post('/excel', exportsController.exportToExcel);

/**
 * POST /api/export/excel-summary
 * Export summary statistics to Excel
 */
router.post('/excel-summary', exportsController.exportSummaryToExcel);

/**
 * POST /api/export/pdf
 * Export scores to PDF with filters
 */
router.post('/pdf', exportsController.exportToPDF);

/**
 * POST /api/export/pdf-summary
 * Export summary statistics to PDF
 */
router.post('/pdf-summary', exportsController.exportSummaryToPDF);

export default router;
