-- One-time migration script to add A-03 SWIMMING category and events.
-- Run this against an existing database. For fresh installs, also add A-03 and these events to init-db.sql.

-- 1) Seed category (if missing)
INSERT INTO sport_categories (code, name)
SELECT 'A-03', 'SWIMMING'
WHERE NOT EXISTS (SELECT 1 FROM sport_categories WHERE code = 'A-03');

-- 2) Seed events (if missing)
INSERT INTO events (sport_category_id, name, is_relay, players_per_place, is_mixed, gender_restriction)
SELECT sc.id, e.name, e.is_relay, e.players_per_place, FALSE, e.gender_restriction
FROM sport_categories sc
JOIN (
  SELECT '50m freestyle' AS name, FALSE AS is_relay, 1 AS players_per_place, 'both' AS gender_restriction
  UNION ALL SELECT '50m breaststroke', FALSE, 1, 'both'
  UNION ALL SELECT '50m backstroke', FALSE, 1, 'both'
  UNION ALL SELECT '50m butterfly', FALSE, 1, 'both'
  UNION ALL SELECT '100m freestyle', FALSE, 1, 'both'
  UNION ALL SELECT '100m breaststroke', FALSE, 1, 'both'
  UNION ALL SELECT '100m backstroke', FALSE, 1, 'both'
  UNION ALL SELECT '100m butterfly', FALSE, 1, 'both'
  UNION ALL SELECT '200m freestyle', FALSE, 1, 'both'
  UNION ALL SELECT '200m breaststroke', FALSE, 1, 'both'
  UNION ALL SELECT '200m backstroke', FALSE, 1, 'both'
  UNION ALL SELECT '200m butterfly', FALSE, 1, 'both'
  UNION ALL SELECT '400m freestyle', FALSE, 1, 'both'
  UNION ALL SELECT '800m freestyle', FALSE, 1, 'female'
  UNION ALL SELECT '1500m freestyle', FALSE, 1, 'male'
  UNION ALL SELECT '200m individual medley', FALSE, 1, 'both'
  UNION ALL SELECT '50x4 freestyle relay', TRUE, 4, 'both'
  UNION ALL SELECT '50x4 medley relay', TRUE, 4, 'both'
) e
WHERE sc.code = 'A-03'
  AND NOT EXISTS (
    SELECT 1 FROM events ev
    WHERE ev.sport_category_id = sc.id AND ev.name = e.name
  );

-- 3) Seed record formats for swimming events (time: e.g. 12.13, 3.05.53)
INSERT INTO event_record_formats (event_id, format)
SELECT ev.id, 'time'
FROM events ev
JOIN sport_categories sc ON ev.sport_category_id = sc.id
LEFT JOIN event_record_formats erf ON erf.event_id = ev.id
WHERE sc.code = 'A-03' AND erf.id IS NULL;
