

'use strict';

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
      first_name:  {
        type: Sequelize.STRING,
        allowNull: false
      },
      last_name:   {
        type: Sequelize.STRING,
        allowNull: false
      },
      email:       {
        type: Sequelize.STRING,
        allowNull: false
      },
      password:    {
        type: Sequelize.STRING,
        allowNull: false
      },
      created_at:  {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at:  {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
    });

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
      hebrew_date:       {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'hebrew_dates',
          key: 'uuid'
        }
      },
      day_index:  {
        type: Sequelize.BIGINT,
        allowNull: false
      }, 
      processed:   {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      created_by:  {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'uuid'
        }
      },
      created_at:  {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at:  {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
    });

    await queryInterface.addIndex('events_entry', ['day_index']);

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

    await queryInterface.addIndex('events', ['day_index']);

    await queryInterface.addConstraint('events', {
      fields: ['source', 'source_row'],
      type:   'unique',
      name:   'events_source_row_unique',
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
    });

    /* Expression index to prevent (A,B) / (B,A) duplicates */
    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX events_pairs_no_dupes
      ON events_pairs
      (LEAST(a,b), GREATEST(a,b));
    `);

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
      CREATE MATERIALIZED VIEW events_pair_view AS
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
          ) as hdate

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

    await queryInterface.sequelize.query(`
      INSERT INTO events (day_index, source, source_row)
      SELECT
        hd.day_index,
        'system',
        hed.uuid
      FROM hebrew_event_dates hed
      JOIN hebrew_dates hd ON hed.hebrew_date = hd.uuid
      JOIN hebrew_events he ON hed.hebrew_event = he.uuid
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
    `);
  },

  down: async (queryInterface) => {
    /* Drop in reverse dependency order */
    await queryInterface.sequelize.query(`
      DROP MATERIALIZED VIEW IF EXISTS events_pair_view;
      DROP TRIGGER IF EXISTS trg_events_fanout ON events;
      DROP FUNCTION  IF EXISTS fan_out_events_pairs();
    `);

    await queryInterface.dropTable('events_pairs');
    await queryInterface.dropTable('events');
    await queryInterface.dropTable('events_entry');
    await queryInterface.dropTable('users');

    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS events_source_enum;
    `);
  },
};
