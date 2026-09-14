'use strict';

/**
 * Repurpose the admin "events" backend for the in-app admin page.
 *
 * Before: events_entry (user rows) -> events (user + every system feast since creation,
 * with before/after rows) -> events_pairs (every event paired with every other, ~millions)
 * -> events_pair_view. Interesting, but overkill.
 *
 * After: two small tables.
 *   events        a named date (name, description, hebrew_date -> hebrew_dates, created_by)
 *   events_pairs  a chosen comparison of two events (+ include_first_day). The date maths
 *                 (days, weeks, new moons, ...) is computed on read from hebrew_dates, so
 *                 nothing here goes stale when day_index / month_index change.
 *
 * Also resets the two admin users' passwords to their e-mail addresses.
 */

const bcrypt = require('bcrypt')

const USERS = ['brandon@mbmcgee.com', 'rpostrom@gmail.com']

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const q = (sql, replacements = {}) => queryInterface.sequelize.query(sql, { replacements })

    // old structures, dependents first
    await q('DROP MATERIALIZED VIEW IF EXISTS events_pair_view;')
    await q('DROP TRIGGER IF EXISTS trg_events_fanout ON events;')
    await q('DROP FUNCTION IF EXISTS fan_out_events_pairs();')
    await q('DROP TABLE IF EXISTS events_pairs;')
    await q('DROP TABLE IF EXISTS events;')
    await q('DROP TABLE IF EXISTS events_entry;')
    for (const t of ['enum_events_source', 'enum_events_system_meta', 'enum_events_entry_type']) {
      await q(`DROP TYPE IF EXISTS ${t};`)
    }

    await queryInterface.createTable('events', {
      uuid: { type: Sequelize.UUID, primaryKey: true, allowNull: false, defaultValue: Sequelize.literal('uuid_generate_v4()') },
      name: { type: Sequelize.STRING, allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      hebrew_date: { type: Sequelize.UUID, allowNull: false, references: { model: 'hebrew_dates', key: 'uuid' } },
      created_by: { type: Sequelize.UUID, allowNull: true, references: { model: 'users', key: 'uuid' } },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    })
    await queryInterface.addIndex('events', ['hebrew_date'], { name: 'events_hebrew_date_idx' })

    await queryInterface.createTable('events_pairs', {
      uuid: { type: Sequelize.UUID, primaryKey: true, allowNull: false, defaultValue: Sequelize.literal('uuid_generate_v4()') },
      a: { type: Sequelize.UUID, allowNull: false, references: { model: 'events', key: 'uuid' }, onDelete: 'CASCADE' },
      b: { type: Sequelize.UUID, allowNull: false, references: { model: 'events', key: 'uuid' }, onDelete: 'CASCADE' },
      include_first_day: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      created_by: { type: Sequelize.UUID, allowNull: true, references: { model: 'users', key: 'uuid' } },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    })
    await q('CREATE UNIQUE INDEX events_pairs_unique_idx ON events_pairs (LEAST(a, b), GREATEST(a, b), include_first_day);')

    // the two admin logins: password = e-mail
    for (const email of USERS) {
      const hash = await bcrypt.hash(email, 10)
      await q('UPDATE users SET password = :hash, updated_at = now() WHERE lower(email) = :email;', { hash, email })
    }
  },

  down: async (queryInterface) => {
    // the previous structures (events_entry, the fan-out trigger, the materialized view) are
    // not recreated; this only removes the new tables
    await queryInterface.dropTable('events_pairs')
    await queryInterface.dropTable('events')
  }
}
