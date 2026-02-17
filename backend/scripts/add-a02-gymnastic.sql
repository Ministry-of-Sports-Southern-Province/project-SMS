-- One-time migration script to add A-02 GYMNASTIC + event gender restrictions + points record format.
-- Run this against an existing database that was created with an older init-db.sql.

-- 1) Schema updates
ALTER TABLE events
  ADD COLUMN gender_restriction ENUM('male', 'female', 'both', 'mixed') NOT NULL DEFAULT 'both';

ALTER TABLE event_record_formats
  MODIFY COLUMN format ENUM('time', 'distance', 'points') NOT NULL;

-- 2) Seed category (if missing)
INSERT INTO sport_categories (code, name)
SELECT 'A-02', 'GYMNASTIC'
WHERE NOT EXISTS (SELECT 1 FROM sport_categories WHERE code = 'A-02');

-- 3) Seed events (if missing)
INSERT INTO events (sport_category_id, name, is_relay, players_per_place, is_mixed, gender_restriction)
SELECT sc.id, e.name, FALSE, 1, FALSE, e.gender_restriction
FROM sport_categories sc
JOIN (
  SELECT 'floor exercise' AS name, 'both' AS gender_restriction
  UNION ALL SELECT 'vaulting table', 'both'
  UNION ALL SELECT 'high bar', 'male'
  UNION ALL SELECT 'parallel bars', 'male'
  UNION ALL SELECT 'pommel horse', 'male'
  UNION ALL SELECT 'still rings', 'male'
  UNION ALL SELECT 'balance beam', 'female'
  UNION ALL SELECT 'uneven bars', 'female'
) e
WHERE sc.code = 'A-02'
  AND NOT EXISTS (
    SELECT 1 FROM events ev
    WHERE ev.sport_category_id = sc.id AND ev.name = e.name
  );

-- 4) Seed record formats for gymnastics events (points)
INSERT INTO event_record_formats (event_id, format)
SELECT ev.id, 'points'
FROM events ev
JOIN sport_categories sc ON ev.sport_category_id = sc.id
LEFT JOIN event_record_formats erf ON erf.event_id = ev.id
WHERE sc.code = 'A-02' AND erf.id IS NULL;

