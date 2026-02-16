import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import pool from '../config/db.config.js';
import { config } from '../config/environment.js';
import { asyncHandler } from '../middleware/errorHandler.js';

// ============================================
// AUTHENTICATION CONTROLLERS
// ============================================

/**
 * Login user and return JWT token
 * POST /api/auth/login
 */
export const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  const connection = await pool.getConnection();

  try {
    // Find user by username
    const [users] = await connection.query(
      'SELECT id, username, password, role, status FROM users WHERE username = ?',
      [username]
    );

    if (users.length === 0) {
      const error = new Error('Invalid username or password');
      error.status = 401;
      throw error;
    }

    const user = users[0];

    // Check if user is active
    if (user.status !== 'active') {
      const error = new Error('User account is inactive');
      error.status = 403;
      throw error;
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      const error = new Error('Invalid username or password');
      error.status = 401;
      throw error;
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
        active: true
      },
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRE }
    );

    // Return success response
    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role
        }
      }
    });

  } finally {
    connection.release();
  }
});

/**
 * Get current user info
 * GET /api/auth/me
 */
export const getCurrentUser = asyncHandler(async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const [users] = await connection.query(
      'SELECT id, username, role, status, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      const error = new Error('User not found');
      error.status = 404;
      throw error;
    }

    const user = users[0];

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'User info retrieved',
      data: {
        id: user.id,
        username: user.username,
        role: user.role,
        status: user.status,
        created_at: user.created_at
      }
    });

  } finally {
    connection.release();
  }
});

/**
 * Create new user (Admin only)
 * POST /api/auth/users
 */
export const createUser = asyncHandler(async (req, res) => {
  const { username, password, role } = req.body;
  const adminId = req.user.id;

  const connection = await pool.getConnection();

  try {
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    const [result] = await connection.query(
      'INSERT INTO users (username, password, role, status, created_by) VALUES (?, ?, ?, ?, ?)',
      [username, hashedPassword, role || 'data-entry', 'active', adminId]
    );

    res.status(201).json({
      success: true,
      statusCode: 201,
      message: 'User created successfully',
      data: {
        id: result.insertId,
        username,
        role: role || 'data-entry',
        status: 'active'
      }
    });

  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      error.message = 'Username already exists';
      error.status = 409;
    }
    throw error;
  } finally {
    connection.release();
  }
});

/**
 * Get all users (Admin only)
 * GET /api/auth/users
 */
export const getAllUsers = asyncHandler(async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const [users] = await connection.query(
      `SELECT id, username, role, status, created_at, updated_at
       FROM users
       ORDER BY created_at DESC`
    );

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Users retrieved successfully',
      data: {
        total: users.length,
        users
      }
    });

  } finally {
    connection.release();
  }
});

/**
 * Update user status (Admin only)
 * PUT /api/auth/users/:id
 */
export const updateUserStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const connection = await pool.getConnection();

  try {
    // Check if user exists
    const [users] = await connection.query(
      'SELECT id FROM users WHERE id = ?',
      [id]
    );

    if (users.length === 0) {
      const error = new Error('User not found');
      error.status = 404;
      throw error;
    }

    // Prevent deactivating self
    if (req.user.id === parseInt(id) && status === 'inactive') {
      const error = new Error('Cannot deactivate your own account');
      error.status = 400;
      throw error;
    }

    // Update status
    await connection.query(
      'UPDATE users SET status = ?, updated_at = NOW() WHERE id = ?',
      [status, id]
    );

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: `User ${status === 'active' ? 'activated' : 'deactivated'} successfully`,
      data: {
        id,
        status
      }
    });

  } finally {
    connection.release();
  }
});

/**
 * Delete user (Soft delete - deactivate)
 * DELETE /api/auth/users/:id
 */
export const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const connection = await pool.getConnection();

  try {
    // Check if user exists
    const [users] = await connection.query(
      'SELECT id FROM users WHERE id = ?',
      [id]
    );

    if (users.length === 0) {
      const error = new Error('User not found');
      error.status = 404;
      throw error;
    }

    // Prevent deleting self
    if (req.user.id === parseInt(id)) {
      const error = new Error('Cannot delete your own account');
      error.status = 400;
      throw error;
    }

    // Soft delete by setting status to inactive
    await connection.query(
      'UPDATE users SET status = "inactive", updated_at = NOW() WHERE id = ?',
      [id]
    );

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'User deleted successfully (soft delete)',
      data: {
        id,
        status: 'inactive'
      }
    });

  } finally {
    connection.release();
  }
});

/**
 * Logout (Client-side handling, mainly for token cleanup)
 * POST /api/auth/logout
 */
export const logout = asyncHandler(async (req, res) => {
  // Token cleanup typically happens on client side
  // Server just confirms the logout
  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'Logout successful'
  });
});

export default {
  login,
  getCurrentUser,
  createUser,
  getAllUsers,
  updateUserStatus,
  deleteUser,
  logout
};
