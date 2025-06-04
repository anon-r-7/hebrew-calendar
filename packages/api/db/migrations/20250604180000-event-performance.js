'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.sequelize.query(`
        -- ───────────────────────────────────────────────────────────────────────────
        -- 1) Trigram extension for tag searches (only once)
        -- ───────────────────────────────────────────────────────────────────────────
        CREATE EXTENSION IF NOT EXISTS pg_trgm;


        -- ───────────────────────────────────────────────────────────────────────────
        -- 2) PRIMARY / housekeeping
        -- ───────────────────────────────────────────────────────────────────────────
        DROP INDEX IF EXISTS epv_uuid_idx;
        CREATE UNIQUE INDEX IF NOT EXISTS epv_uuid_idx
          ON events_pair_view (uuid);

        -- Keep ORDER BY diff cheap when no other predicate
        CREATE INDEX IF NOT EXISTS epv_diff_idx
          ON events_pair_view (diff);


        -- ───────────────────────────────────────────────────────────────────────────
        -- 3) “exact_…” partial indexes
        --    (filter by exact_* = true, then quickly ORDER BY diff DESC)
        -- ───────────────────────────────────────────────────────────────────────────
        DROP INDEX IF EXISTS epv_exact_rev_years_true;
        CREATE INDEX epv_exact_rev_years_true
          ON events_pair_view (rev_years, diff DESC)
          WHERE exact_rev_years;

        DROP INDEX IF EXISTS epv_exact_enoch_years_true;
        CREATE INDEX epv_exact_enoch_years_true
          ON events_pair_view (enoch_years, diff DESC)
          WHERE exact_enoch_years;

        DROP INDEX IF EXISTS epv_exact_weeks_true;
        CREATE INDEX epv_exact_weeks_true
          ON events_pair_view (weeks, diff DESC)
          WHERE exact_weeks;


        -- ───────────────────────────────────────────────────────────────────────────
        -- 4) Numeric‐equality + ordering
        --    (enoch_years = X, rev_years = Y, weeks = Z; plus ORDER BY diff)
        -- ───────────────────────────────────────────────────────────────────────────
        CREATE INDEX IF NOT EXISTS epv_enoch_idx
          ON events_pair_view (enoch_years, diff DESC);

        CREATE INDEX IF NOT EXISTS epv_rev_idx
          ON events_pair_view (rev_years, diff DESC);

        CREATE INDEX IF NOT EXISTS epv_weeks_idx
          ON events_pair_view (weeks, diff DESC);


        -- ───────────────────────────────────────────────────────────────────────────
        -- 5) Date‐range + source filters
        --    ( (a_source=‘user’ AND a_gdate BETWEEN … AND …) OR same on b_… )
        -- ───────────────────────────────────────────────────────────────────────────
        CREATE INDEX IF NOT EXISTS epv_a_src_gdate_idx
          ON events_pair_view (a_source, a_gdate);

        CREATE INDEX IF NOT EXISTS epv_b_src_gdate_idx
          ON events_pair_view (b_source, b_gdate);


        -- ───────────────────────────────────────────────────────────────────────────
        -- 6) UUID look-ups (one‐at-a-time)
        --    (a_events_entry_uuid = X OR b_events_entry_uuid = X)
        --    (same for hebrew_events_uuid, created_by_uuid)
        -- ───────────────────────────────────────────────────────────────────────────
        CREATE INDEX IF NOT EXISTS epv_a_events_entry_idx
          ON events_pair_view (a_events_entry_uuid);

        CREATE INDEX IF NOT EXISTS epv_b_events_entry_idx
          ON events_pair_view (b_events_entry_uuid);

        CREATE INDEX IF NOT EXISTS epv_a_hebrew_events_idx
          ON events_pair_view (a_hebrew_events_uuid);

        CREATE INDEX IF NOT EXISTS epv_b_hebrew_events_idx
          ON events_pair_view (b_hebrew_events_uuid);

        CREATE INDEX IF NOT EXISTS epv_a_created_by_idx
          ON events_pair_view (a_created_by_uuid);

        CREATE INDEX IF NOT EXISTS epv_b_created_by_idx
          ON events_pair_view (b_created_by_uuid);


        -- ───────────────────────────────────────────────────────────────────────────
        -- 7) Trigram GIN on tags (for “tags ILIKE ‘%foo%’ OR …”)
        -- ───────────────────────────────────────────────────────────────────────────
        CREATE INDEX IF NOT EXISTS epv_a_tags_trgm
          ON events_pair_view USING gin (a_tags gin_trgm_ops);

        CREATE INDEX IF NOT EXISTS epv_b_tags_trgm
          ON events_pair_view USING gin (b_tags gin_trgm_ops);

      `);


      await queryInterface.sequelize.query(`
        VACUUM ANALYZE events_pair_view;
      `)

      await queryInterface.sequelize.query(`
        ANALYZE events_pair_view;
      `)
    } catch (error) {
      console.error('db migration error 3', error)
    }

  },
  down: async (queryInterface, Sequelize) => {
    // Intentionally left blank
  },
};









