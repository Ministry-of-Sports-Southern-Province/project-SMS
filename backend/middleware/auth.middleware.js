import jwt from 'jsonwebtoken';
import { config } from '../config/environment.js';

// Verify JWT token
export const verifyToken = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1] || req.cookies.token;

    if (!token) {
      const error = new Error('No token provided');
      error.status = 401;
      throw error;
    }

    const decoded = jwt.verify(token, config.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      error.message = 'Token has expired';
      error.status = 401;
    } else if (error.name === 'JsonWebTokenError') {
      error.message = 'Invalid token';
      error.status = 401;
    }
    next(error);
  }
};

// Check if user is admin
export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    const error = new Error('User not authenticated');
    error.status = 401;
    return next(error);
  }

  if (req.user.role !== 'admin') {
    const error = new Error('Admin access required');
    error.status = 403;
    return next(error);
  }

  next();
};

// Check if user is authenticated (admin or data-entry)
export const requireAuth = (req, res, next) => {
  if (!req.user) {
    const error = new Error('User not authenticated');
    error.status = 401;
    return next(error);
  }

  next();
};

// Check if user is active
export const requireActiveUser = (req, res, next) => {
  if (!req.user || !req.user.active) {
    const error = new Error('User account is inactive');
    error.status = 403;
    return next(error);
  }

  next();
};

export default verifyToken;
