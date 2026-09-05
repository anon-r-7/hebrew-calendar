'use strict';

// Teach the events_pairs fan-out trigger about system events.
//
// Previously only 'user' rows inserted into `events` fanned out into
// events_pairs, so system events added after the initial backfill (new
// event types like shabbat_shmita / shabbat_yovel, or forward years) never
// got paired. Now:
//   - a new 'user' event pairs with every other event (unchanged), and
//   - a new 'system' event pairs with every existing 'user' event.
//
// Populating the missing system rows is deliberately NOT done here: it is
// handled by the event sync (EventSync.syncSystemEvents), which can be run
// against the database from anywhere (see resync-prod.sh at the repo root).

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.sequelize.query(`
      CREATE OR REPLACE FUNCTION fan_out_events_pairs() RETURNS trigger AS $$
      BEGIN
        IF (NEW.source = 'user') THEN
          INSERT INTO events_pairs (a, b, diff, favorite)
          SELECT
            LEAST(NEW.uuid, e.uuid),
            GREATEST(NEW.uuid, e.uuid),
            ABS(NEW.day_index - e.day_index) + 1,
            false
          FROM events e
          WHERE e.uuid <> NEW.uuid
          ON CONFLICT DO NOTHING;
        ELSE
          INSERT INTO events_pairs (a, b, diff, favorite)
          SELECT
            LEAST(NEW.uuid, e.uuid),
            GREATEST(NEW.uuid, e.uuid),
            ABS(NEW.day_index - e.day_index) + 1,
            false
          FROM events e
          WHERE e.uuid <> NEW.uuid
            AND e.source = 'user'
          ON CONFLICT DO NOTHING;
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
  },

  down: async (queryInterface) => {
    await queryInterface.sequelize.query(`
      CREATE OR REPLACE FUNCTION fan_out_events_pairs() RETURNS trigger AS $$
      BEGIN
        IF (NEW.source = 'user') THEN
          INSERT INTO events_pairs (a, b, diff, favorite)
          SELECT
            LEAST(NEW.uuid, e.uuid),
            GREATEST(NEW.uuid, e.uuid),
            ABS(NEW.day_index - e.day_index) + 1,
            false
          FROM events e
          WHERE e.uuid <> NEW.uuid;
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
  },
};
