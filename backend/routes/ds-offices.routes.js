import express from 'express';
import { validateQuery } from '../middleware/validation.middleware.js';
import { dsOfficeFilterSchema } from '../validators/schemas.js';
import * as dsOfficesController from '../controllers/ds-offices.controller.js';

const router = express.Router();

/**
 * GET /api/ds-offices
 * Get all DS offices (with optional district filter)
 */
router.get('/', dsOfficesController.getAllDSOffices);

/**
 * GET /api/ds-offices/by-district
 * Get DS offices by district (required districtId query param)
 */
router.get('/by-district', validateQuery(dsOfficeFilterSchema), dsOfficesController.getDSOfficesByDistrict);

/**
 * GET /api/districts
 * Get all districts
 */
router.get('/districts', dsOfficesController.getAllDistricts);

/**
 * GET /api/ds-offices/:officeId
 * Get single DS office details
 */
router.get('/:officeId', dsOfficesController.getDSOfficeDetails);

export default router;
