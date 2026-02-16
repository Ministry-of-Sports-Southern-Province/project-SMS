import express from 'express';
import { validateRequest } from '../middleware/validation.middleware.js';
import { verifyToken, requireAdmin } from '../middleware/auth.middleware.js';
import { loginSchema, createUserSchema, updateUserStatusSchema } from '../validators/schemas.js';
import * as authController from '../controllers/auth.controller.js';

const router = express.Router();

/**
 * POST /api/auth/login
 * Login user
 */
router.post('/login', validateRequest(loginSchema), authController.login);

/**
 * GET /api/auth/me
 * Get current user info (requires authentication)
 */
router.get('/me', verifyToken, authController.getCurrentUser);

/**
 * POST /api/auth/logout
 * Logout (requires authentication)
 */
router.post('/logout', verifyToken, authController.logout);

/**
 * POST /api/auth/users
 * Create new user (admin only)
 */
router.post(
  '/users',
  verifyToken,
  requireAdmin,
  validateRequest(createUserSchema),
  authController.createUser
);

/**
 * GET /api/auth/users
 * Get all users (admin only)
 */
router.get('/users', verifyToken, requireAdmin, authController.getAllUsers);

/**
 * PUT /api/auth/users/:id
 * Update user status (admin only)
 */
router.put(
  '/users/:id',
  verifyToken,
  requireAdmin,
  validateRequest(updateUserStatusSchema),
  authController.updateUserStatus
);

/**
 * DELETE /api/auth/users/:id
 * Delete user (soft delete - admin only)
 */
router.delete('/users/:id', verifyToken, requireAdmin, authController.deleteUser);

export default router;
