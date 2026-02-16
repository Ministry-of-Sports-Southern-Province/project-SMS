-- Southern Province Sports Score Management System
-- Database initialization script

CREATE DATABASE IF NOT EXISTS project_sms;
USE project_sms;

-- Users
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100),
    email VARCHAR(255),
    role ENUM('admin', 'user') NOT NULL DEFAULT 'user',
    preferred_lang VARCHAR(10) DEFAULT 'si',
    dark_mode BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Sport categories
CREATE TABLE sport_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(20) NOT NULL,
    name VARCHAR(100) NOT NULL
);

-- Events (with is_relay, players_per_place, is_mixed for scaling)
CREATE TABLE events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sport_category_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    is_relay BOOLEAN DEFAULT FALSE,
    players_per_place INT DEFAULT 1,
    is_mixed BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (sport_category_id) REFERENCES sport_categories(id)
);

-- Event record format (time vs distance for validation)
CREATE TABLE event_record_formats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL,
    format ENUM('time', 'distance') NOT NULL,
    FOREIGN KEY (event_id) REFERENCES events(id)
);

-- Districts
CREATE TABLE districts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

-- DS Offices (mapped to districts)
CREATE TABLE ds_offices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    district_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    FOREIGN KEY (district_id) REFERENCES districts(id)
);

-- Score entries (one per event+gender)
CREATE TABLE score_entries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL,
    gender ENUM('male', 'female', 'mixed') NOT NULL,
    entered_by INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id),
    FOREIGN KEY (entered_by) REFERENCES users(id)
);

-- Score entry players (individual winners per place)
CREATE TABLE score_entry_players (
    id INT AUTO_INCREMENT PRIMARY KEY,
    score_entry_id INT NOT NULL,
    place INT NOT NULL,
    player_name VARCHAR(200) NOT NULL,
    certificate_no VARCHAR(50) NOT NULL UNIQUE,
    ds_office_id INT NOT NULL,
    record VARCHAR(50),
    FOREIGN KEY (score_entry_id) REFERENCES score_entries(id) ON DELETE CASCADE,
    FOREIGN KEY (ds_office_id) REFERENCES ds_offices(id),
    UNIQUE KEY unique_person_per_entry (score_entry_id, player_name),
    CHECK (place IN (1, 2, 3))
);

-- Seed sport categories (A-01 only for now)
INSERT INTO sport_categories (code, name) VALUES
('A-01', 'ATHLETIC');

-- Seed events - A-01 ATHLETIC (22 events)
-- Running (time)
INSERT INTO events (sport_category_id, name, is_relay, players_per_place, is_mixed) VALUES
(1, '100m', FALSE, 1, FALSE),
(1, '200m', FALSE, 1, FALSE),
(1, '400m', FALSE, 1, FALSE),
(1, '800m', FALSE, 1, FALSE),
(1, '1500m', FALSE, 1, FALSE),
(1, '5000m', FALSE, 1, FALSE),
(1, '10000m', FALSE, 1, FALSE),
(1, '100m hurdles', FALSE, 1, FALSE),
(1, '110m hurdles', FALSE, 1, FALSE),
(1, '400m hurdles', FALSE, 1, FALSE),
-- Relay
(1, '100m X 4', TRUE, 4, FALSE),
(1, '400m X 4', TRUE, 4, FALSE),
(1, '400m X 4 mixed', TRUE, 4, TRUE),
-- Jumps (distance)
(1, 'high jump', FALSE, 1, FALSE),
(1, 'long jump', FALSE, 1, FALSE),
(1, 'triple jump', FALSE, 1, FALSE),
(1, 'pole vault', FALSE, 1, FALSE),
-- Throws (distance)
(1, 'shot put', FALSE, 1, FALSE),
(1, 'discus throw', FALSE, 1, FALSE),
(1, 'javelin throw', FALSE, 1, FALSE),
(1, 'hammer throw', FALSE, 1, FALSE);

-- Event record formats (time for running/relay, distance for jumps/throws)
INSERT INTO event_record_formats (event_id, format)
SELECT id, 'time' FROM events WHERE name IN (
    '100m', '200m', '400m', '800m', '1500m', '5000m', '10000m',
    '100m hurdles', '110m hurdles', '400m hurdles',
    '100m X 4', '400m X 4', '400m X 4 mixed'
);
INSERT INTO event_record_formats (event_id, format)
SELECT id, 'distance' FROM events WHERE name IN (
    'high jump', 'long jump', 'triple jump', 'pole vault',
    'shot put', 'discus throw', 'javelin throw', 'hammer throw'
);

-- Seed districts
INSERT INTO districts (id, name) VALUES
(1, 'Galle'),
(2, 'Matara'),
(3, 'Hambantota');

-- Seed DS offices (district 1 = Galle)
INSERT INTO ds_offices (district_id, name) VALUES
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

-- DS offices (district 2 = Matara)
INSERT INTO ds_offices (district_id, name) VALUES
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

-- DS offices (district 3 = Hambantota)
INSERT INTO ds_offices (district_id, name) VALUES
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
