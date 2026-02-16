import * as dotenv from 'dotenv';
import * as bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';

dotenv.config();

async function seedUsers() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'project_sms',
  });

  const passwordHash = await bcrypt.hash('1234', 10);

  await connection.execute(
    `INSERT INTO users (username, password_hash, display_name, role) VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)`,
    ['admin', passwordHash, 'Admin', 'admin']
  );

  await connection.execute(
    `INSERT INTO users (username, password_hash, display_name, role) VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)`,
    ['user', passwordHash, 'Deepika', 'user']
  );

  console.log('Users seeded: admin, user (password: 1234)');
  await connection.end();
}

seedUsers().catch(console.error);
