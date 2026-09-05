'use strict';

// Shmita (sabbatical) and Yovel (jubilee) event dates.
//
// Anchor year: Hebrew 5796.
//  - shabbat_shmita: every year where (yy - 5796) is divisible by 7,
//    marked on Tishrei 1 (mm=7, dd=1).
//  - shabbat_yovel (new hebrew_events row): every year where (yy - 5796)
//    is divisible by 49, marked on Yom Kippur (mm=7, dd=10).
//
// Applies across all years present in hebrew_dates (BC through 7960).

const ANCHOR_YY = 5796;

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      INSERT INTO hebrew_events (name, short_name)
      SELECT 'Shabbat Yovel', 'shabbat_yovel'
      WHERE NOT EXISTS (
        SELECT 1 FROM hebrew_events WHERE short_name = 'shabbat_yovel'
      );
    `);

    await queryInterface.sequelize.query(`
      INSERT INTO hebrew_event_dates (hebrew_event, hebrew_date)
      SELECT he.uuid, hd.uuid
      FROM hebrew_dates hd
      JOIN hebrew_events he ON he.short_name = 'shabbat_shmita'
      WHERE hd.mm = 7 AND hd.dd = 1
        AND (hd.yy - :anchor) % 7 = 0
        AND NOT EXISTS (
          SELECT 1 FROM hebrew_event_dates hed
          WHERE hed.hebrew_event = he.uuid AND hed.hebrew_date = hd.uuid
        );
    `, { replacements: { anchor: ANCHOR_YY } });

    await queryInterface.sequelize.query(`
      INSERT INTO hebrew_event_dates (hebrew_event, hebrew_date)
      SELECT he.uuid, hd.uuid
      FROM hebrew_dates hd
      JOIN hebrew_events he ON he.short_name = 'shabbat_yovel'
      WHERE hd.mm = 7 AND hd.dd = 10
        AND (hd.yy - :anchor) % 49 = 0
        AND NOT EXISTS (
          SELECT 1 FROM hebrew_event_dates hed
          WHERE hed.hebrew_event = he.uuid AND hed.hebrew_date = hd.uuid
        );
    `, { replacements: { anchor: ANCHOR_YY } });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      DELETE FROM hebrew_event_dates hed
      USING hebrew_events he
      WHERE he.uuid = hed.hebrew_event
        AND he.short_name IN ('shabbat_shmita', 'shabbat_yovel');
    `);
    await queryInterface.sequelize.query(`
      DELETE FROM hebrew_events WHERE short_name = 'shabbat_yovel';
    `);
  },
};
