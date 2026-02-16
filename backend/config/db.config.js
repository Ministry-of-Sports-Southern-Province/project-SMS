import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Create connection pool for better performance
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'provincial_sports_sms',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelayMs: 0,
  charset: 'utf8mb4',
  collation: 'utf8mb4_unicode_ci'
});

// Test the connection
pool.getConnection()
  .then(connection => {
    console.log('✓ Database connected successfully');
    connection.release();
  })
  .catch(error => {
    if (error.code === 'PROTOCOL_CONNECTION_LOST') {
      console.error('Database connection was closed.');
    }
    if (error.code === 'ER_CON_COUNT_ERROR') {
      console.error('Database has too many connections.');
    }
    if (error.code === 'ER_AUTHENTICATION_PLUGIN_ERROR') {
      console.error('Database authentication failed.');
    }
    console.error('✗ Database connection failed:', error.message);
  });

export default pool;
