

'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /* ──────────────────────────────────────────────────────────────
       0. Extensions & shared types
       ─────────────────────────────────────────────────────────── */
    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'event_source_enum') THEN
          CREATE TYPE event_source_enum AS ENUM ('system', 'user');
        END IF;
      END$$;
    `);


    /* ──────────────────────────────────────────────────────────────
       1. Users
       ─────────────────────────────────────────────────────────── */
    await queryInterface.createTable('users', {
      uuid:        { type: Sequelize.UUID, primaryKey: true, allowNull: false,
                     defaultValue: Sequelize.literal('uuid_generate_v4()') },
      first_name:  { type: Sequelize.STRING, allowNull: false },
      last_name:   { type: Sequelize.STRING, allowNull: false },
      email:       { type: Sequelize.STRING, allowNull: false },
      password:    { type: Sequelize.STRING, allowNull: false },
      created_at:  { type: Sequelize.DATE,  allowNull: false,
                     defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at:  { type: Sequelize.DATE,  allowNull: false,
                     defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    /* ──────────────────────────────────────────────────────────────
       2. Step-1  (raw user input)
       ─────────────────────────────────────────────────────────── */
    await queryInterface.createTable('date_entry_step_1', {
      uuid:        { type: Sequelize.UUID, primaryKey: true, allowNull: false,
                     defaultValue: Sequelize.literal('uuid_generate_v4()') },
      date:        { type: Sequelize.STRING, allowNull: false },
      type:        { type: Sequelize.ENUM('gregorian', 'hebrew'), allowNull: false },
      name:        { type: Sequelize.STRING, allowNull: false },
      description: { type: Sequelize.STRING, allowNull: false },
      tags:        { type: Sequelize.STRING, allowNull: false },
      processed:   { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      created_by:  { type: Sequelize.UUID, allowNull: false,
                     references: { model: 'users', key: 'uuid' } },
      created_at:  { type: Sequelize.DATE, allowNull: false,
                     defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at:  { type: Sequelize.DATE, allowNull: false,
                     defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    /* ──────────────────────────────────────────────────────────────
       3. Step-2  (validated + linked to hebrew_date)
       ─────────────────────────────────────────────────────────── */
    await queryInterface.createTable('date_entry_step_2', {
      uuid:      { type: Sequelize.UUID, primaryKey: true, allowNull: false,
                   defaultValue: Sequelize.literal('uuid_generate_v4()') },
      date_entry_step_1: { type: Sequelize.UUID, allowNull: false,
                           references: { model: 'date_entry_step_1', key: 'uuid' } },
      hebrew_date:       { type: Sequelize.UUID, allowNull: false,
                           references: { model: 'hebrew_dates', key: 'uuid' } },
      day_index:         { type: Sequelize.BIGINT, allowNull: false },  // denormalised for speed
      processed:         { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      created_at:        { type: Sequelize.DATE, allowNull: false,
                           defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at:        { type: Sequelize.DATE, allowNull: false,
                           defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });
    await queryInterface.addIndex('date_entry_step_2', ['day_index']);

    /* ──────────────────────────────────────────────────────────────
       4. Canonical universe of events
       ─────────────────────────────────────────────────────────── */
    await queryInterface.createTable('events', {
      uuid:        { type: Sequelize.UUID, primaryKey: true, allowNull: false,
                     defaultValue: Sequelize.literal('uuid_generate_v4()') },
      day_index:   { type: Sequelize.BIGINT, allowNull: false },
      source:      { type: 'event_source_enum', allowNull: false },
      source_row:  { type: Sequelize.UUID, allowNull: false },
      created_at:  { type: Sequelize.DATE, allowNull: false,
                     defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.addIndex('events', ['day_index']);
    await queryInterface.addConstraint('events', {
      fields: ['source', 'source_row'],
      type:   'unique',
      name:   'events_source_row_unique',
    });

    /* ──────────────────────────────────────────────────────────────
       5. Pairwise comparisons
       ─────────────────────────────────────────────────────────── */
    await queryInterface.createTable('event_pairs', {
      uuid: { type: Sequelize.UUID, primaryKey: true, allowNull: false,
              defaultValue: Sequelize.literal('uuid_generate_v4()') },
      a:    { type: Sequelize.UUID, allowNull: false,
              references: { model: 'events', key: 'uuid' } },
      b:    { type: Sequelize.UUID, allowNull: false,
              references: { model: 'events', key: 'uuid' } },
      diff: { type: Sequelize.INTEGER, allowNull: false }, // INT4 sufficient (≈ 5 M days range)
    });

    /* 5.1 expression index to prevent (A,B) / (B,A) duplicates */
    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX event_pairs_no_dupes
      ON event_pairs
      (LEAST(a,b), GREATEST(a,b));
    `);

    /* 5.2 helper index for look-ups by either side */
    await queryInterface.addIndex('event_pairs', ['a']);
    await queryInterface.addIndex('event_pairs', ['b']);

    /* ──────────────────────────────────────────────────────────────
       6. Fan-out trigger: insert into event_pairs on every USER event
       ─────────────────────────────────────────────────────────── */
    await queryInterface.sequelize.query(`
      CREATE OR REPLACE FUNCTION fan_out_event_pairs() RETURNS trigger AS $$
      BEGIN
        IF (NEW.source = 'user') THEN
          INSERT INTO event_pairs (a, b, diff)
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
        EXECUTE PROCEDURE fan_out_event_pairs();
    `);

    /* ──────────────────────────────────────────────────────────────
       7. Materialised view for read-heavy workloads
       ─────────────────────────────────────────────────────────── */
    await queryInterface.sequelize.query(`
      DROP MATERIALIZED VIEW IF EXISTS event_comparisons_mv;
      CREATE MATERIALIZED VIEW event_comparisons_mv AS
      WITH details AS (
        SELECT
          e.uuid,
          e.day_index,

          /* ------------ name ------------------------------------- */
          CASE
            WHEN e.source = 'user' THEN s1.name
            ELSE he.name
          END                                     AS name,

          /* ------------ description ------------------------------ */
          CASE
            WHEN e.source = 'user' THEN COALESCE(s1.description, 'N/A')
            ELSE ''
          END                                     AS description,

          /* ------------ created_by ------------------------------- */
          COALESCE(u.first_name || ' ' || u.last_name, 'System')   AS created_by,

          /* ------------ tags ------------------------------------- */
          CASE
            WHEN e.source = 'user' THEN COALESCE(s1.tags, '')
            ELSE ''
          END                                     AS tags,

          /* ------------ gregorian date --------------------------- */
          COALESCE(hd1.gregorian, hd2.gregorian)   AS gdate,

        COALESCE (
          hd1.yy::text || '-' ||
          lpad(hd1.mm::text, 2, '0') || '-' ||
          lpad(hd1.dd::text, 2, '0'),
        
          hd2.yy::text || '-' ||
          lpad(hd2.mm::text, 2, '0') || '-' ||
          lpad(hd2.dd::text, 2, '0')
        ) AS hdate

        FROM events e

        /* user-entered events */
        LEFT JOIN date_entry_step_2 d2  ON (e.source = 'user'   AND e.source_row = d2.uuid)
        LEFT JOIN date_entry_step_1 s1  ON d2.date_entry_step_1 = s1.uuid
        LEFT JOIN "users"        u      ON s1.created_by        = u.uuid
        LEFT JOIN hebrew_dates   hd1    ON d2.hebrew_date       = hd1.uuid

        /* system Hebrew events */
        LEFT JOIN hebrew_event_dates hed ON (e.source <> 'user' AND e.source_row = hed.uuid)
        LEFT JOIN hebrew_events      he  ON hed.hebrew_event    = he.uuid
        LEFT JOIN hebrew_dates       hd2 ON hed.hebrew_date     = hd2.uuid
      )

      SELECT
        p.uuid,
        a.name  AS a_name,
        b.name  AS b_name,
        a.gdate AS a_gdate,
        b.gdate AS b_gdate,
        a.hdate AS a_hdate,
        b.hdate AS b_hdate,
        a.description  AS a_description,
        b.description  AS b_description,
        a.created_by   AS a_created_by,
        b.created_by   AS b_created_by,
        a.tags         AS a_tags,
        b.tags         AS b_tags,
        /* date maths */
        p.diff                       AS days,
        p.diff * 2                   AS half_days,
        round(p.diff::numeric / 7,   6)        AS weeks,
        round(p.diff::numeric / 360, 6)        AS rev_years,
        round(p.diff::numeric / 364, 6)        AS enoch_years,
        (p.diff % 7   = 0)           AS exact_weeks,
        (p.diff % 360 = 0)           AS exact_rev_years,
        (p.diff % 364 = 0)           AS exact_enoch_years
      FROM event_pairs p
      JOIN details a ON p.a = a.uuid
      JOIN details b ON p.b = b.uuid;
    `);

    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX event_comparisons_mv_uuid_idx ON event_comparisons_mv(uuid);
    `);
  },

  down: async (queryInterface) => {
    /* Drop in reverse dependency order */
    await queryInterface.sequelize.query(`
      DROP MATERIALIZED VIEW IF EXISTS event_comparisons_mv;
      DROP TRIGGER IF EXISTS trg_events_fanout ON events;
      DROP FUNCTION  IF EXISTS fan_out_event_pairs();
    `);

    await queryInterface.dropTable('event_pairs');
    await queryInterface.dropTable('events');
    await queryInterface.dropTable('date_entry_step_2');
    await queryInterface.dropTable('date_entry_step_1');
    await queryInterface.dropTable('users');

    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS event_source_enum;
    `);
  },
};
