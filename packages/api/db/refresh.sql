-- --------------------------------------------------------------------
-- 0.  Safety guard: run as a superuser or owner of the objects
-- --------------------------------------------------------------------
\echo **** Starting swap-refresh of events_pair_view ****

\set ON_ERROR_STOP on
BEGIN;  -- Just to keep psql from bailing half-way if an error occurs
COMMIT;

-- --------------------------------------------------------------------
-- 1.  Set Local Performance Improvements
-- --------------------------------------------------------------------
SET LOCAL work_mem = '512MB';
SET LOCAL maintenance_work_mem = '4GB';
SET LOCAL parallel_setup_cost = 100;
SET LOCAL parallel_tuple_cost = 0.01;
SET LOCAL max_parallel_workers = 8;
SET LOCAL max_parallel_workers_per_gather = 4;
SET LOCAL jit = off;


-- --------------------------------------------------------------------
-- 2.  Get current definition of the materialized view
-- --------------------------------------------------------------------
WITH def AS (
  SELECT pg_get_viewdef('public.events_pair_view'::regclass, true) AS sql
)
SELECT '-- View Definition -------------------------------------------------'
       || CHR(10) || sql AS ddl
INTO TEMP view_def
FROM def;

-- --------------------------------------------------------------------
-- 3.  Capture every CREATE INDEX statement on the view
-- --------------------------------------------------------------------
CREATE TEMP TABLE idx_def(create_index_sql text);

INSERT INTO idx_def(create_index_sql)
SELECT pg_get_indexdef(i.indexrelid) || ';'
FROM   pg_index      i
JOIN   pg_class      t   ON t.oid  = i.indrelid
WHERE  t.relname = 'events_pair_view';

-- --------------------------------------------------------------------
-- 4.  Build a staging materialized view with NO indexes
-- --------------------------------------------------------------------
DO
$$
DECLARE
    v_sql text;
BEGIN
    SELECT 'CREATE MATERIALIZED VIEW public.events_pair_view__staging AS '
           || sql
    INTO   v_sql
    FROM   view_def;

    EXECUTE v_sql;
END;
$$;

-- --------------------------------------------------------------------
-- 5.  Build all indexes CONCURRENTLY on the staging view
--     (fastest possible + keeps original view fully usable)
-- --------------------------------------------------------------------
DO
$$
DECLARE
    rec record;
BEGIN
    FOR rec IN SELECT * FROM idx_def LOOP
        EXECUTE replace(
                   replace(
                      rec.create_index_sql,
                      'CREATE INDEX ',
                      'CREATE INDEX CONCURRENTLY '),
                   'CREATE UNIQUE INDEX ',
                   'CREATE UNIQUE INDEX CONCURRENTLY ');
    END LOOP;
END;
$$;

-- --------------------------------------------------------------------
-- 6.  Swap staging → live (one quick catalog rename)
-- --------------------------------------------------------------------
BEGIN;

-- Old view becomes _old  (safety copy)
ALTER MATERIALIZED VIEW public.events_pair_view
  RENAME TO events_pair_view__old;

-- Staging view becomes the live one
ALTER MATERIALIZED VIEW public.events_pair_view__staging
  RENAME TO events_pair_view;

COMMIT;

-- --------------------------------------------------------------------
-- 7.  Drop the old copy (or keep for rollback)
-- --------------------------------------------------------------------
DROP MATERIALIZED VIEW public.events_pair_view__old;
DROP TABLE IF EXISTS view_def;
DROP TABLE IF EXISTS idx_def;

\echo **** Swap-refresh completed successfully ****
