'use strict';

/**
 * The events and pairs listings look up each date's holidays with a correlated subquery on
 * hebrew_event_dates (≈766k rows). Without an index on hebrew_date that is a full sequential
 * scan per event / per pair side (~16 ms each), which is what made /events/pairs crawl as
 * pairs accumulated. Both lookups now hit an index.
 */
module.exports = {
  up: async (queryInterface) => {
    await queryInterface.sequelize.query(
      'CREATE INDEX IF NOT EXISTS hebrew_event_dates_hebrew_date_idx ON hebrew_event_dates (hebrew_date);'
    )
    await queryInterface.sequelize.query(
      'CREATE INDEX IF NOT EXISTS hebrew_event_dates_hebrew_event_idx ON hebrew_event_dates (hebrew_event);'
    )
  },
  down: async (queryInterface) => {
    await queryInterface.sequelize.query('DROP INDEX IF EXISTS hebrew_event_dates_hebrew_date_idx;')
    await queryInterface.sequelize.query('DROP INDEX IF EXISTS hebrew_event_dates_hebrew_event_idx;')
  }
}
