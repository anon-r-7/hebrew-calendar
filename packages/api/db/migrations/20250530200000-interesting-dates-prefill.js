'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
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
    // Intentionally Left Blank
  },
};
