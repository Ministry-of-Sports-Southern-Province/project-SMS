import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',

  // Database
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_USER: process.env.DB_USER || 'root',
  DB_PASSWORD: process.env.DB_PASSWORD || '',
  DB_NAME: process.env.DB_NAME || 'provincial_sports_sms',
  DB_PORT: process.env.DB_PORT || 3306,

  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-key-change-in-production',
  JWT_EXPIRE: process.env.JWT_EXPIRE || '24h',

  // CORS
  CORS_ORIGIN: (process.env.CORS_ORIGIN || 'http://localhost:5173').split(','),

  // Validation
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE) || 5242880, // 5MB
  ALLOWED_FILE_TYPES: (process.env.ALLOWED_FILE_TYPES || 'pdf,jpg,jpeg,png,doc,docx').split(','),

  // Business Logic
  MAX_RELAY_ATHLETES: 4,
  MAX_RECORD_LENGTH: 50,
  MAX_ATHLETE_NAME_LENGTH: 100,
  MAX_CERT_NUMBER_LENGTH: 50,
  BATCH_ID_LENGTH: 36
};

export const isDevelopment = config.NODE_ENV === 'development';
export const isProduction = config.NODE_ENV === 'production';

export default config;
