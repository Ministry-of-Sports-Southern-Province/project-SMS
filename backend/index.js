import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

import { config } from './config/environment.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

// Import routes
import authRoutes from './routes/auth.routes.js';
import eventsRoutes from './routes/events.routes.js';
import dsOfficesRoutes from './routes/ds-offices.routes.js';
import scoresRoutes from './routes/scores.routes.js';
import exportsRoutes from './routes/exports.routes.js';

dotenv.config();

const app = express();
const PORT = config.PORT;

// ============================================
// MIDDLEWARE
// ============================================

// Body parser middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Cookie parser
app.use(cookieParser());

// CORS configuration
app.use(cors({
  origin: config.CORS_ORIGIN,
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ============================================
// ROUTES
// ============================================

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/ds-offices', dsOfficesRoutes);
app.use('/api/scores', scoresRoutes);
app.use('/api/export', exportsRoutes);

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler for undefined routes
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// ============================================
// START SERVER
// ============================================

const server = app.listen(PORT, () => {
  console.log('');
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║  Provincial Sports Event Score Management System      ║');
  console.log('║  Backend API Server                                  ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`✓ Server running on port: ${PORT}`);
  console.log(`✓ Environment: ${config.NODE_ENV}`);
  console.log(`✓ CORS origins: ${config.CORS_ORIGIN.join(', ')}`);
  console.log('');
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log('');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // In production, you might want to log this to a service like Sentry
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export default app;
