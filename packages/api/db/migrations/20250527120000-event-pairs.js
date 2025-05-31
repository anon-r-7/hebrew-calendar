'use strict';

const safe = async (label, fn) => {
  try {
    await fn();
  } catch (err) {
    console.warn(`[skip] ${label}: ${err.message}`);
  }
};

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /* ──────────────────────────────────────────────────────────────
       1. Users
       ─────────────────────────────────────────────────────────── */
    await queryInterface.createTable('users', {
      uuid: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.literal('uuid_generate_v4()')
      },
      first_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      last_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
    });

    /* ──────────────────────────────────────────────────────────────
       Seed two users
       ─────────────────────────────────────────────────────────── */
    await queryInterface.sequelize.query(`
      INSERT INTO users (first_name, last_name, email, password)
      VALUES
        ('Brandon', 'McGee', 'brandon@mbmcgee.com', '$2b$10$T10PZSGCEYR6gI2iopopfeV8xFOYW3fsP6X1.dnEmhDcFaZAtPILa'),
        ('Ryan', 'Ostrom', 'rpostrom@gmail.com','$2b$10$f.v8V9xSzWVJ4.teD2KT1.OOgDnXDXG5iV8fC/x6mAMH0QDmVSAg.');
    `);

    /* ──────────────────────────────────────────────────────────────
       2. Events Entry
       ─────────────────────────────────────────────────────────── */
    await queryInterface.createTable('events_entry', {
      uuid: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.literal('uuid_generate_v4()')
      },
      date: {
        type: Sequelize.STRING,
        allowNull: false
      },
      type: {
        type: Sequelize.ENUM('gregorian', 'hebrew'),
        allowNull: false
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.STRING,
        allowNull: false
      },
      tags: {
        type: Sequelize.STRING,
        allowNull: false
      },
      hebrew_date: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'hebrew_dates',
          key: 'uuid'
        }
      },
      day_index: {
        type: Sequelize.BIGINT,
        allowNull: false
      }, 
      processed: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'uuid'
        }
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
    });

    await queryInterface.removeIndex('events_entry', 'events_entry_day_index')
      .catch(() => {});                        // ignore “doesn’t exist”

    await queryInterface.addIndex('events_entry', ['day_index'], {
      name: 'events_entry_day_index',
    });

    /* ──────────────────────────────────────────────────────────────
       3. Canonical events
       ─────────────────────────────────────────────────────────── */
    await queryInterface.createTable('events', {
      uuid: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.literal('uuid_generate_v4()')
      },
      day_index: {
        type: Sequelize.BIGINT,
        allowNull: false
      },
      source: {
        type: Sequelize.ENUM('system', 'user'),
        allowNull: false
      },
      system_meta: {
        type: Sequelize.ENUM('before', 'after'),
        allowNull: true
      },
      source_row:  {
        type: Sequelize.UUID,
        allowNull: false
      },
      created_at:  {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
    });

    await safe('unique constraint', () =>
      queryInterface.sequelize.query(`
        ALTER TABLE events
          ADD CONSTRAINT events_source_row_meta_unique
          UNIQUE (source, source_row, system_meta);
      `)
    );

    await queryInterface.removeIndex('events', 'events_day_index')
      .catch(() => {});           // ignore “doesn’t exist”

    await queryInterface.addIndex('events', ['day_index'], {
      name: 'events_day_index',
    });

    /* ──────────────────────────────────────────────────────────────
       4. Pairwise comparisons
       ─────────────────────────────────────────────────────────── */
    await queryInterface.createTable('events_pairs', {
      uuid: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.literal('uuid_generate_v4()')
      },
      a: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'events',
          key: 'uuid'
        }
      },
      b: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'events',
          key: 'uuid'
        }
      },
      diff: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      favorite: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
    });

    await queryInterface.removeIndex('events_pairs', 'events_pairs_no_dupes')
      .catch(() => {});           // ignore “doesn’t exist”

    /* Expression index to prevent (A,B) / (B,A) duplicates */
    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX events_pairs_no_dupes
      ON events_pairs
      (LEAST(a,b), GREATEST(a,b));
    `);

    await queryInterface.removeIndex('events_pairs', 'events_pairs_a')
      .catch(() => {});           // ignore “doesn’t exist”
    await queryInterface.removeIndex('events_pairs', 'events_pairs_b')
      .catch(() => {});           // ignore “doesn’t exist”


    /* Helper index for look-ups by either side */
    await queryInterface.addIndex('events_pairs', ['a']);
    await queryInterface.addIndex('events_pairs', ['b']);

    /* ──────────────────────────────────────────────────────────────
       5. Fan-out trigger: insert into events_pairs on every USER event
       ─────────────────────────────────────────────────────────── */
    await queryInterface.sequelize.query(`
      CREATE OR REPLACE FUNCTION fan_out_events_pairs() RETURNS trigger as $$
      BEGIN
        IF (NEW.source = 'user') THEN
          INSERT INTO events_pairs (a, b, diff)
          SELECT
            LEAST(NEW.uuid, e.uuid),
            GREATEST(NEW.uuid, e.uuid),
            ABS(NEW.day_index - e.day_index) + 1
          FROM events e
          WHERE e.uuid <> NEW.uuid;
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      DROP TRIGGER IF EXISTS trg_events_fanout ON events;
      CREATE TRIGGER trg_events_fanout
        AFTER INSERT ON events
        FOR EACH ROW
        EXECUTE PROCEDURE fan_out_events_pairs();
    `);

    /* ──────────────────────────────────────────────────────────────
       6. Materialised view for read-heavy workloads
       ─────────────────────────────────────────────────────────── */
    await queryInterface.sequelize.query(`
      DROP MATERIALIZED VIEW IF EXISTS events_pair_view;
      CREATE MATERIALIZED VIEW events_pair_view as
      WITH details as (
        SELECT
          e.uuid,
          e.day_index,

          /* ------------ Name ------------------------------------- */
          CASE
            WHEN e.source = 'user' THEN ee.name
            ELSE he.name
          END as name,

          /* ------------ Description ------------------------------ */
          CASE
            WHEN e.source = 'user' THEN COALESCE(ee.description, 'N/A')
            ELSE ''
          END as description,

          /* ------------ Created By ------------------------------- */
          COALESCE(u.first_name || ' ' || u.last_name, 'System') as created_by,

          /* ------------ Tags ------------------------------------- */
          CASE
            WHEN e.source = 'user' THEN COALESCE(ee.tags, '')
            ELSE ''
          END as tags,

          /* ------------ Gregorian date --------------------------- */
          COALESCE(hd1.gregorian, hd2.gregorian) as gdate,

          /* ------------ Hebrew date --------------------------- */
          COALESCE (
            hd1.yy::text || '-' ||
            lpad(hd1.mm::text, 2, '0') || '-' ||
            lpad(hd1.dd::text, 2, '0'),
          
            hd2.yy::text || '-' ||
            lpad(hd2.mm::text, 2, '0') || '-' ||
            lpad(hd2.dd::text, 2, '0')
          ) as hdate,

          /* ------------ Day of week------------------------------- */          
          COALESCE(hd1.day_of_week, hd2.day_of_week) as day_of_week

        FROM events e

        /* User-entered events */
        LEFT JOIN events_entry ee
          ON (e.source = 'user'
          AND e.source_row = ee.uuid)
        LEFT JOIN "users" u
          ON ee.created_by = u.uuid
        LEFT JOIN hebrew_dates hd1
          ON ee.hebrew_date = hd1.uuid

        /* System Hebrew events */
        LEFT JOIN hebrew_event_dates hed
          ON (e.source <> 'user' AND e.source_row = hed.uuid)
        LEFT JOIN hebrew_events he
          ON hed.hebrew_event = he.uuid
        LEFT JOIN hebrew_dates
          hd2 ON hed.hebrew_date = hd2.uuid
      )

      SELECT
        p.uuid,
        a.name as a_name,
        b.name as b_name,
        a.gdate as a_gdate,
        b.gdate as b_gdate,
        a.hdate as a_hdate,
        b.hdate as b_hdate,
        a.description as a_description,
        b.description as b_description,
        a.created_by as a_created_by,
        b.created_by as b_created_by,
        a.tags as a_tags,
        b.tags as b_tags,
        /* date maths */
        p.diff as days,
        p.diff * 2 as half_days,
        round(p.diff::numeric / 7,   6) as weeks,
        round(p.diff::numeric / 360, 6) as rev_years,
        round(p.diff::numeric / 364, 6) as enoch_years,
        (p.diff % 7   = 0) as exact_weeks,
        (p.diff % 360 = 0) as exact_rev_years,
        (p.diff % 364 = 0) as exact_enoch_years
      FROM events_pairs p
      JOIN details a ON p.a = a.uuid
      JOIN details b ON p.b = b.uuid;
    `);

    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX events_pair_view_uuid_idx ON events_pair_view(uuid);
    `);

    /* ──────────────────────────────────────────────────────────────
       6. Add "event_day" for sukkot, matzot, and chanukkah
       ─────────────────────────────────────────────────────────── */
    await queryInterface.removeColumn('hebrew_event_dates', 'event_day') .catch(() => {});

    await queryInterface.addColumn('hebrew_event_dates', 'event_day', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    await queryInterface.sequelize.query(`
      WITH ranked AS (
        SELECT
          hed.uuid,
          he.short_name,
          hd.yy,                        -- Hebrew year (partition key)
          ROW_NUMBER() OVER (
            PARTITION BY he.short_name, hd.yy
            ORDER BY hd.day_index       -- <── absolute ordering
          ) AS rn
        FROM hebrew_event_dates hed
        JOIN hebrew_events he ON he.uuid = hed.hebrew_event
        JOIN hebrew_dates  hd ON hd.uuid = hed.hebrew_date
        WHERE he.short_name IN ('sukkot', 'matzot', 'chanukkah')
      )
      UPDATE hebrew_event_dates hed
      SET    event_day = r.rn
      FROM   ranked r
      WHERE  hed.uuid = r.uuid
        AND (
          (r.short_name IN ('sukkot','chanukkah') AND r.rn <= 8) OR
          (r.short_name =  'matzot'               AND r.rn <= 7)
        );
    `);

    await queryInterface.sequelize.query(`
      /* -----------------------------------------------------------------
         1. Pick the feast rows we care about
         ----------------------------------------------------------------- */
      WITH selected_hebrew_event_dates AS (
        SELECT
          hed.uuid as hed_id,
          hd.day_index as target_day_index,
          he.short_name,
          hed.event_day
        FROM hebrew_event_dates hed
        JOIN hebrew_dates  hd ON hd.uuid  = hed.hebrew_date
        JOIN hebrew_events he ON he.uuid  = hed.hebrew_event
        WHERE he.short_name IN (
          'tisha_bav',
          'matzot',
          'pesach',
          'yom_kippur',
          'yom_teruah',
          'sukkot',
          'shavuot',
          'yom_bikkurim',
          'rosh_chodesh',
          'chanukkah'
        )
      )

      /* -----------------------------------------------------------------
         2. insert BEFORE / TARGET / AFTER rows with the new rules
         ----------------------------------------------------------------- */
      INSERT INTO events (day_index, source, system_meta, source_row)

      /* ---- BEFORE (only first day of multi-day feasts) ---------------- */
      SELECT
        target_day_index - 1,
        'system'::enum_events_source,          -- ← cast here
        'before'::enum_events_system_meta,     -- ← and here
        hed_id
      FROM selected_hebrew_event_dates
      WHERE
        event_day IS NULL                -- single-day feasts
        OR event_day = 1                 -- first day of matzot/sukkot/chanukkah

      UNION ALL

      /* ---- TARGET (always) -------------------------------------------- */
      SELECT
        target_day_index,
        'system'::enum_events_source,
        NULL,
        hed_id
      FROM selected_hebrew_event_dates

      UNION ALL

      /* ---- AFTER (only last day of multi-day feasts) ------------------ */
      SELECT
        target_day_index + 1,
        'system'::enum_events_source,
        'after'::enum_events_system_meta,
        hed_id
      FROM selected_hebrew_event_dates
      WHERE
        event_day IS NULL                                -- single-day feasts
        OR (
           (short_name = 'matzot'    AND event_day = 7)  OR
           (short_name IN ('sukkot','chanukkah') AND event_day = 8)
         )

      ON CONFLICT ON CONSTRAINT events_source_row_meta_unique DO NOTHING;
    `);
  },

  down: async (queryInterface) => {
    /* 1. objects that are independent of tables */
    await safe('materialized view',  () =>
      queryInterface.sequelize.query(`DROP MATERIALIZED VIEW IF EXISTS events_pair_view`)
    );
    await safe('trigger', () =>
      queryInterface.sequelize.query(`DROP TRIGGER IF EXISTS trg_events_fanout ON events`)
    );
    await safe('trigger function', () =>
      queryInterface.sequelize.query(`DROP FUNCTION IF EXISTS fan_out_events_pairs`)
    );

    /* 2. tables (reverse dependency order) */
    for (const tbl of ['events_pairs', 'events', 'events_entry', 'users']) {
      await safe(`table ${tbl}`, () => queryInterface.dropTable(tbl));
    }

    /* 3. enum types created earlier */
    for (const typ of [
      'events_source_enum',
      'events_system_meta_enum',
      'events_entry_type_enum'
    ]) {
      await safe(`enum ${typ}`, () =>
        queryInterface.sequelize.query(`DROP TYPE IF EXISTS ${typ}`)
      );
    }
  }
};
