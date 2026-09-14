'use strict';

/** A global (all users) favorite flag on a pair, filterable in the pairs list. */
module.exports = {
  up: async (queryInterface) => {
    await queryInterface.sequelize.query('ALTER TABLE events_pairs ADD COLUMN IF NOT EXISTS favorite BOOLEAN NOT NULL DEFAULT false;')
    await queryInterface.sequelize.query('CREATE INDEX IF NOT EXISTS events_pairs_favorite_idx ON events_pairs (favorite) WHERE favorite;')
  },
  down: async (queryInterface) => {
    await queryInterface.sequelize.query('ALTER TABLE events_pairs DROP COLUMN IF EXISTS favorite;')
  }
}
