-- One-time migration script to add B TEAM GAMES category and B-01 through B-18 events.
-- Run this against an existing database. For fresh installs, also add these to init-db.sql.

-- 1) Schema update: Add places_count column (2 or 3 places per event) - only if it doesn't exist
SET @db_name = DATABASE();
SET @col_exists = (
  SELECT COUNT(*) 
  FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = @db_name 
    AND TABLE_NAME = 'events' 
    AND COLUMN_NAME = 'places_count'
);

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE events ADD COLUMN places_count INT NOT NULL DEFAULT 3',
  'SELECT "Column places_count already exists, skipping..." AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2) Seed category B TEAM_GAMES (if missing)
INSERT INTO sport_categories (code, name)
SELECT 'B', 'TEAM_GAMES'
WHERE NOT EXISTS (SELECT 1 FROM sport_categories WHERE code = 'B');

-- 3) Seed all 25 events B-01 through B-18 (if missing)
INSERT INTO events (sport_category_id, name, is_relay, players_per_place, is_mixed, gender_restriction, places_count)
SELECT sc.id, e.name, e.is_relay, e.players_per_place, e.is_mixed, e.gender_restriction, e.places_count
FROM sport_categories sc
CROSS JOIN (
  SELECT 'B-01' AS name, FALSE AS is_relay, 1 AS players_per_place, FALSE AS is_mixed, 'both' AS gender_restriction, 3 AS places_count
  UNION ALL SELECT 'B-02', FALSE, 1, FALSE, 'both', 3
  UNION ALL SELECT 'B-03', FALSE, 10, FALSE, 'both', 2
  UNION ALL SELECT 'B-04-1', FALSE, 7, FALSE, 'both', 2
  UNION ALL SELECT 'B-04-2', FALSE, 1, FALSE, 'both', 2
  UNION ALL SELECT 'B-04-3', FALSE, 2, FALSE, 'both', 2
  UNION ALL SELECT 'B-04-4', FALSE, 2, TRUE, 'mixed', 2
  UNION ALL SELECT 'B-05', FALSE, 12, FALSE, 'both', 2
  UNION ALL SELECT 'B-06', FALSE, 6, FALSE, 'both', 2
  UNION ALL SELECT 'B-07', FALSE, 2, FALSE, 'both', 2
  UNION ALL SELECT 'B-08', FALSE, 13, FALSE, 'both', 2
  UNION ALL SELECT 'B-09', FALSE, 20, FALSE, 'both', 2
  UNION ALL SELECT 'B-10', FALSE, 20, FALSE, 'both', 2
  UNION ALL SELECT 'B-11', FALSE, 16, FALSE, 'both', 2
  UNION ALL SELECT 'B-12', FALSE, 18, FALSE, 'both', 2
  UNION ALL SELECT 'B-13', FALSE, 12, FALSE, 'both', 2
  UNION ALL SELECT 'B-14', FALSE, 12, FALSE, 'female', 2
  UNION ALL SELECT 'B-15', FALSE, 12, FALSE, 'both', 2
  UNION ALL SELECT 'B-16', FALSE, 15, FALSE, 'both', 2
  UNION ALL SELECT 'B-17-1', FALSE, 5, FALSE, 'both', 2
  UNION ALL SELECT 'B-17-2', FALSE, 1, FALSE, 'both', 2
  UNION ALL SELECT 'B-17-3', FALSE, 2, FALSE, 'both', 2
  UNION ALL SELECT 'B-17-4', FALSE, 2, TRUE, 'mixed', 2
  UNION ALL SELECT 'B-18', FALSE, 14, FALSE, 'both', 2
) e
WHERE sc.code = 'B'
  AND NOT EXISTS (
    SELECT 1 FROM events ev
    WHERE ev.sport_category_id = sc.id AND ev.name = e.name
  );

-- Note: Team games do NOT have record formats (no time/distance/points records)
