import { isDevelopment } from '../config/environment.js';

// Global error handling middleware
export const errorHandler = (err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // Log error details in development
  if (isDevelopment) {
    console.error('Error:', {
      status,
      message,
      stack: err.stack,
      body: req.body,
      params: req.params,
      query: req.query
    });
  }

  // Send response based on error type
  if (err.isJoi) {
    // Validation error from Joi
    const details = err.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: 'Validation Error',
      errors: details
    });
  }

  // Database errors
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      success: false,
      statusCode: 409,
      message: 'Certificate number already exists in this event',
      error: message
    });
  }

  if (err.code === 'ER_NO_REFERENCED_ROW') {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: 'Invalid reference: selected district or DS office does not exist',
      error: message
    });
  }

  // Authentication errors
  if (status === 401) {
    return res.status(401).json({
      success: false,
      statusCode: 401,
      message: 'Unauthorized. Please login again'
    });
  }

  // Authorization errors
  if (status === 403) {
    return res.status(403).json({
      success: false,
      statusCode: 403,
      message: 'Forbidden. You do not have permission to perform this action'
    });
  }

  // Not found
  if (status === 404) {
    return res.status(404).json({
      success: false,
      statusCode: 404,
      message: 'Resource not found'
    });
  }

  // Generic error response
  res.status(status).json({
    success: false,
    statusCode: status,
    message: message,
    ...(isDevelopment && { stack: err.stack })
  });
};

// 404 handler (should be last middleware)
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    statusCode: 404,
    message: 'Route not found',
    path: req.originalUrl
  });
};

// Async handler wrapper for route handlers
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default errorHandler;
