-- Provincial Sports Event Score Management System
-- Database Schema for A-01 Athletics Category
-- Created: 2026-02-16

-- ============================================
-- CREATE DATABASE
-- ============================================
CREATE DATABASE IF NOT EXISTS provincial_sports_sms;
USE provincial_sports_sms;

-- ============================================
-- TABLE 1: USERS (Authentication)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL COMMENT 'bcrypt hashed password',
  role ENUM('admin', 'data-entry') NOT NULL DEFAULT 'data-entry',
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by INT,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_username (username),
  INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLE 2: SPORT CATEGORIES
-- ============================================
CREATE TABLE IF NOT EXISTS sport_categories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(10) UNIQUE NOT NULL COMMENT 'e.g., A-01, A-02, B-01',
  name VARCHAR(100) NOT NULL COMMENT 'e.g., ATHLETIC, GYMNASTIC',
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_code (code),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLE 3: EVENTS
-- ============================================
CREATE TABLE IF NOT EXISTS events (
  id INT PRIMARY KEY AUTO_INCREMENT,
  sport_category_id INT NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL COMMENT 'e.g., A-01-100M, A-01-100MX4',
  name VARCHAR(100) NOT NULL COMMENT 'e.g., 100m, 100m X 4',
  description TEXT,
  event_type ENUM('individual', 'relay', 'team') NOT NULL DEFAULT 'individual',
  relay_count INT NOT NULL DEFAULT 1 COMMENT '1 for individual, 4 for relays, 11+ for team sports',
  gender ENUM('mixed', 'male_only', 'female_only') NOT NULL DEFAULT 'mixed',
  record_format ENUM('time', 'distance') NOT NULL COMMENT 'Time in HH.MM.SS, Distance in XX.XXm',
  places_count INT NOT NULL DEFAULT 3 COMMENT 'Number of places (1st, 2nd, 3rd usually)',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sport_category_id) REFERENCES sport_categories(id) ON DELETE CASCADE,
  INDEX idx_category (sport_category_id),
  INDEX idx_event_type (event_type),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLE 4: DISTRICTS
-- ============================================
CREATE TABLE IF NOT EXISTS districts (
  id INT PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLE 5: DS OFFICES (Divisional Secretary)
-- ============================================
CREATE TABLE IF NOT EXISTS ds_offices (
  id INT PRIMARY KEY AUTO_INCREMENT,
  district_id INT NOT NULL,
  name VARCHAR(100) NOT NULL COMMENT 'e.g., Akmeemana, Galle, etc.',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (district_id) REFERENCES districts(id) ON DELETE CASCADE,
  UNIQUE KEY unique_office_per_district (district_id, name),
  INDEX idx_district (district_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLE 6: WINNERS (Main Score Data)
-- ============================================
CREATE TABLE IF NOT EXISTS winners (
  id INT PRIMARY KEY AUTO_INCREMENT,

  -- Event Information
  event_id INT NOT NULL,
  district_id INT NOT NULL,
  ds_office_id INT NOT NULL,
  gender ENUM('male', 'female') NOT NULL,

  -- Place/Position
  place INT NOT NULL COMMENT '1=Gold, 2=Silver, 3=Bronze',

  -- Batch Information (for grouping relay athletes)
  batch_id VARCHAR(36) NOT NULL COMMENT 'UUID-like, groups athletes in same relay team/place',
  athlete_position INT COMMENT 'Position in relay: 1-4 for relays, NULL for individual',

  -- Athlete Information
  athlete_name VARCHAR(100) NOT NULL,
  certificate_no VARCHAR(50) NOT NULL COMMENT 'Manually entered, unique per event',

  -- Performance Record
  record_value VARCHAR(50) NOT NULL COMMENT 'Stored as string: "01.23.45s" or "15.50m"',

  -- Audit Trail
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by INT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Foreign Keys
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  FOREIGN KEY (district_id) REFERENCES districts(id) ON DELETE RESTRICT,
  FOREIGN KEY (ds_office_id) REFERENCES ds_offices(id) ON DELETE RESTRICT,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,

  -- Constraints (Validation)
  UNIQUE KEY unique_cert_per_event (event_id, certificate_no) COMMENT 'Prevents same person winning multiple places in an event',

  -- Indexes (Performance)
  INDEX idx_event (event_id),
  INDEX idx_district (district_id),
  INDEX idx_ds_office (ds_office_id),
  INDEX idx_batch_id (batch_id),
  INDEX idx_cert_no (certificate_no),
  INDEX idx_gender (gender),
  INDEX idx_place (place),
  INDEX idx_created_by (created_by),
  INDEX idx_created_date (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- INSERT INITIAL DATA
-- ============================================

-- Insert Districts
INSERT IGNORE INTO districts (id, name) VALUES
(1, 'Galle'),
(2, 'Matara'),
(3, 'Hambantota');

-- Insert Sport Categories (A-01 only for now)
INSERT IGNORE INTO sport_categories (code, name, description, is_active) VALUES
('A-01', 'ATHLETIC', 'Athletics - Track and Field Sports', TRUE);

-- Insert DS Offices for District 1 (Galle)
INSERT IGNORE INTO ds_offices (district_id, name) VALUES
(1, 'Akmeemana'),
(1, 'Ambalangoda'),
(1, 'Baddegama'),
(1, 'Balapitiya'),
(1, 'Benthota'),
(1, 'Bope-Poddala'),
(1, 'Elpitiya'),
(1, 'Galle'),
(1, 'Gonapinuwala'),
(1, 'Habaraduwa'),
(1, 'Hikkaduwa'),
(1, 'Imaduwa'),
(1, 'Karandeniya'),
(1, 'Nagoda'),
(1, 'Neluwa'),
(1, 'Niyagama'),
(1, 'Thawalama'),
(1, 'Welivitiya-Divithura'),
(1, 'Yakkalamulla');

-- Insert DS Offices for District 2 (Matara)
INSERT IGNORE INTO ds_offices (district_id, name) VALUES
(2, 'Akuressa'),
(2, 'Athuraliya'),
(2, 'Devinuwara'),
(2, 'Dickwella'),
(2, 'Hakmana'),
(2, 'Kamburupitiya'),
(2, 'Kirinda Puhulwella'),
(2, 'Kotapola'),
(2, 'Malimbada'),
(2, 'Matara'),
(2, 'Mulatiyana'),
(2, 'Pasgoda'),
(2, 'Pitabeddara'),
(2, 'Thihagoda'),
(2, 'Weligama'),
(2, 'Welipitiya');

-- Insert DS Offices for District 3 (Hambantota)
INSERT IGNORE INTO ds_offices (district_id, name) VALUES
(3, 'Ambalantota'),
(3, 'Angunakolapelessa'),
(3, 'Beliatta'),
(3, 'Hambantota'),
(3, 'Katuwana'),
(3, 'Lunugamwehera'),
(3, 'Okewela'),
(3, 'Sooriyawewa'),
(3, 'Tangalle'),
(3, 'Tissamaharama'),
(3, 'Walasmulla'),
(3, 'Weeraketiya');

-- ============================================
-- INSERT A-01 ATHLETIC EVENTS
-- ============================================

-- Get the sport_category_id for A-01
SET @a01_id = (SELECT id FROM sport_categories WHERE code = 'A-01');

-- INDIVIDUAL TRACK EVENTS (Time format)
INSERT IGNORE INTO events (sport_category_id, code, name, event_type, relay_count, gender, record_format, places_count, is_active) VALUES
(@a01_id, 'A-01-100M', '100m', 'individual', 1, 'mixed', 'time', 3, TRUE),
(@a01_id, 'A-01-200M', '200m', 'individual', 1, 'mixed', 'time', 3, TRUE),
(@a01_id, 'A-01-400M', '400m', 'individual', 1, 'mixed', 'time', 3, TRUE),
(@a01_id, 'A-01-800M', '800m', 'individual', 1, 'mixed', 'time', 3, TRUE),
(@a01_id, 'A-01-1500M', '1500m', 'individual', 1, 'mixed', 'time', 3, TRUE),
(@a01_id, 'A-01-5000M', '5000m', 'individual', 1, 'mixed', 'time', 3, TRUE),
(@a01_id, 'A-01-10000M', '10000m', 'individual', 1, 'mixed', 'time', 3, TRUE),

-- HURDLES (Time format)
(@a01_id, 'A-01-100MH', '100m Hurdles', 'individual', 1, 'mixed', 'time', 3, TRUE),
(@a01_id, 'A-01-110MH', '110m Hurdles', 'individual', 1, 'mixed', 'time', 3, TRUE),
(@a01_id, 'A-01-400MH', '400m Hurdles', 'individual', 1, 'mixed', 'time', 3, TRUE),

-- FIELD EVENTS - JUMPS (Distance format)
(@a01_id, 'A-01-HJ', 'High Jump', 'individual', 1, 'mixed', 'distance', 3, TRUE),
(@a01_id, 'A-01-LJ', 'Long Jump', 'individual', 1, 'mixed', 'distance', 3, TRUE),
(@a01_id, 'A-01-TJ', 'Triple Jump', 'individual', 1, 'mixed', 'distance', 3, TRUE),
(@a01_id, 'A-01-PV', 'Pole Vault', 'individual', 1, 'mixed', 'distance', 3, TRUE),

-- FIELD EVENTS - THROWS (Distance format)
(@a01_id, 'A-01-SP', 'Shot Put', 'individual', 1, 'mixed', 'distance', 3, TRUE),
(@a01_id, 'A-01-DT', 'Discus Throw', 'individual', 1, 'mixed', 'distance', 3, TRUE),
(@a01_id, 'A-01-JT', 'Javelin Throw', 'individual', 1, 'mixed', 'distance', 3, TRUE),
(@a01_id, 'A-01-HT', 'Hammer Throw', 'individual', 1, 'mixed', 'distance', 3, TRUE),

-- RELAY EVENTS (Time format, multiple athletes)
(@a01_id, 'A-01-100MX4', '100m X 4 Relay', 'relay', 4, 'mixed', 'time', 3, TRUE),
(@a01_id, 'A-01-400MX4', '400m X 4 Relay', 'relay', 4, 'mixed', 'time', 3, TRUE),
(@a01_id, 'A-01-400MX4M', '400m X 4 Mixed Relay', 'relay', 4, 'mixed', 'time', 3, TRUE);

-- ============================================
-- SAMPLE USERS (For testing)
-- ============================================

-- Note: Passwords should be hashed with bcrypt in production
-- For development: deepika password hash (changeme), admin password hash (admin123)
-- Use bcrypt to generate these in production
INSERT IGNORE INTO users (username, password, role, status) VALUES
('deepika', '$2b$10$fPQLfNnJ3lR0T4E9YqWKae3tWvBpWlyWqVMNhJ4Jq9A7c6KVZmcXi', 'data-entry', 'active'),
('admin', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86.wzBWUmrm', 'admin', 'active');

-- ============================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_winners_event_cert ON winners(event_id, certificate_no);
CREATE INDEX idx_winners_batch ON winners(batch_id);
CREATE INDEX idx_winners_date_range ON winners(created_at, district_id, gender);

-- ============================================
-- CREATE VIEWS (Optional, for common queries)
-- ============================================

-- View for relay team members (groups 4 athletes per relay placement)
CREATE OR REPLACE VIEW v_relay_teams AS
SELECT
  w.batch_id,
  w.event_id,
  e.name as event_name,
  w.place,
  w.district_id,
  d.name as district_name,
  GROUP_CONCAT(w.athlete_name ORDER BY w.athlete_position) as athlete_names,
  GROUP_CONCAT(w.certificate_no ORDER BY w.athlete_position) as certificate_numbers,
  w.record_value,
  MAX(w.created_at) as created_at
FROM winners w
JOIN events e ON w.event_id = e.id
JOIN districts d ON w.district_id = d.id
WHERE e.event_type = 'relay'
GROUP BY w.batch_id, w.event_id, w.place, w.district_id
ORDER BY e.name, w.place;

-- View for all individual and relay winners with event details
CREATE OR REPLACE VIEW v_winners_detail AS
SELECT
  w.id,
  w.athlete_name,
  w.certificate_no,
  c.name as sport_category,
  e.name as event,
  e.record_format,
  w.gender,
  w.place,
  d.name as district,
  ds.name as ds_office,
  w.record_value,
  u.username as entered_by,
  w.created_at,
  w.batch_id
FROM winners w
JOIN events e ON w.event_id = e.id
JOIN sport_categories c ON e.sport_category_id = c.id
JOIN districts d ON w.district_id = d.id
JOIN ds_offices ds ON w.ds_office_id = ds.id
JOIN users u ON w.created_by = u.id
ORDER BY e.name, w.place, w.athlete_name;

-- ============================================
-- END OF SCHEMA
-- ============================================
