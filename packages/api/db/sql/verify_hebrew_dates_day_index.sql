-- Verification for 20260911000000-julian-leap-day-rows-and-day-index.
-- Run against any database (before or after the migration). Every query says what
-- a correct table returns. All are read-only.

-- 0. PRE-FLIGHT — run on production BEFORE migrating.
--    The server's statement_timeout (the migration overrides it with SET LOCAL, shown for
--    awareness), free space, and — there must be NO unique index on hebrew_dates.day_index
--    (drop it first, recreate after; the single-statement renumber passes through transient
--    duplicates).
SHOW statement_timeout;
SELECT pg_size_pretty(pg_database_size(current_database())) AS db_size;
SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'hebrew_dates';

-- 1. Consecutive rows must have consecutive weekdays. Before the migration this
--    returns 1,013 rows (1,001 BC + 12 AD, all Feb 28 -> Mar 1). After it, exactly
--    42 rows: the Julian century leap days a DATE column cannot hold (Feb 29 of
--    100, 200, 300, 500, 600, 700, 900, 1000, 1100, 1300, 1400, 1500 AD and of
--    101, 201, 301, 501, ... 3901 BC), each with index_step = 2 (counted, no row).
WITH s AS (
  SELECT gregorian, day_of_week, day_index,
         lag(gregorian)   OVER (ORDER BY day_index) AS prev_gregorian,
         lag(day_of_week) OVER (ORDER BY day_index) AS prev_dow,
         day_index - lag(day_index) OVER (ORDER BY day_index) AS index_step
  FROM hebrew_dates
), dow AS (
  SELECT *, array_position(ARRAY['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'], day_of_week)
           - array_position(ARRAY['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'], prev_dow) AS dow_step
  FROM s WHERE prev_dow IS NOT NULL
)
SELECT prev_gregorian, prev_dow, gregorian, day_of_week, index_step, ((dow_step + 7) % 7) AS weekday_step
FROM dow
WHERE ((dow_step + 7) % 7) <> 1 OR index_step <> 1
ORDER BY day_index;

-- 2. After the migration: 0 rows (every weekday agrees with the row's Julian Day Number).
--    Before it: ~577k rows (every row before 1500-03-01).
SELECT count(*) AS weekday_disagrees_with_index
FROM hebrew_dates
WHERE day_of_week <> (ARRAY['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'])
                     [((day_index + 1721435 + 1) % 7) + 1];

-- 3. Known spans, inclusive of the first day (after: 728012, 325, 599, 2201349; before: 728000, 325, 599, 2200336).
SELECT
  (SELECT day_index FROM hebrew_dates WHERE gregorian = DATE '2063-10-24') - (SELECT day_index FROM hebrew_dates WHERE gregorian = DATE '0070-08-04') + 1 AS temple_destruction_to_rapture_2063,
  (SELECT day_index FROM hebrew_dates WHERE gregorian = DATE '1004-09-16 BC') - (SELECT day_index FROM hebrew_dates WHERE gregorian = DATE '1005-10-27 BC') + 1 AS first_temple_to_jubilee,
  (SELECT day_index FROM hebrew_dates WHERE gregorian = DATE '0514-09-30 BC') - (SELECT day_index FROM hebrew_dates WHERE gregorian = DATE '0515-02-09 BC') + 1 AS second_temple_to_jubilee,
  (SELECT day_index FROM hebrew_dates WHERE gregorian = DATE '2024-01-01') - (SELECT day_index FROM hebrew_dates WHERE gregorian = DATE '4004-01-01 BC') + 1 AS creation_to_2024;

-- 4. Anchor: unchanged by the migration (577726), and the modern side never moves.
SELECT gregorian, day_index FROM hebrew_dates WHERE gregorian IN (DATE '1582-10-04', DATE '1582-10-15', DATE '2024-01-01') ORDER BY gregorian;

-- 5. Row counts per year: after the migration 1 BC has 366 rows, 4 BC 365, 101 BC 365 (hole), 401 BC 366; 100 AD 365 (hole), 400 AD 366, 1582 355.
SELECT to_char(gregorian, 'YYYY BC') AS year, count(*) AS rows
FROM hebrew_dates
WHERE gregorian IN (DATE '0001-06-01 BC', DATE '0004-06-01 BC', DATE '0101-06-01 BC', DATE '0401-06-01 BC')
   OR (gregorian >= DATE '0001-01-01 BC' AND gregorian <= DATE '0001-12-31 BC')
   OR (gregorian >= DATE '0004-01-01 BC' AND gregorian <= DATE '0004-12-31 BC')
   OR (gregorian >= DATE '0101-01-01 BC' AND gregorian <= DATE '0101-12-31 BC')
   OR (gregorian >= DATE '0401-01-01 BC' AND gregorian <= DATE '0401-12-31 BC')
   OR (gregorian >= DATE '0100-01-01' AND gregorian <= DATE '0100-12-31')
   OR (gregorian >= DATE '0400-01-01' AND gregorian <= DATE '0400-12-31')
   OR (gregorian >= DATE '1582-01-01' AND gregorian <= DATE '1582-12-31')
GROUP BY 1 ORDER BY min(gregorian);

-- 6. INFORMATIONAL — the migration deliberately does not touch events / events_entry /
--    events_pairs, so these counts are NON-ZERO after it until you resync (./resync-prod.sh).
--    They show how many copied day_index values / pair diffs still carry the old numbering.
SELECT
  (SELECT count(*) FROM events_entry ee JOIN hebrew_dates hd ON hd.uuid = ee.hebrew_date WHERE ee.day_index <> hd.day_index) AS stale_events_entry,
  (SELECT count(*) FROM events e JOIN events_entry ee ON e.source = 'user' AND e.source_row = ee.uuid WHERE e.day_index <> ee.day_index) AS stale_user_events,
  (SELECT count(*) FROM events e JOIN hebrew_event_dates hed ON e.source = 'system' AND e.source_row = hed.uuid
     JOIN hebrew_dates hd ON hd.uuid = hed.hebrew_date
    WHERE e.day_index <> hd.day_index + CASE e.system_meta WHEN 'before' THEN -1 WHEN 'after' THEN 1 ELSE 0 END) AS stale_system_events,
  (SELECT count(*) FROM events_pairs p JOIN events a ON a.uuid = p.a JOIN events b ON b.uuid = p.b
    WHERE p.diff <> ABS(a.day_index - b.day_index) + 1) AS stale_pair_diffs;
