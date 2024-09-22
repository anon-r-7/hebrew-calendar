'use strict';

const { getAstronomyEvents } = require(`${__dirname}/../../src/services/Astronomy`);

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Fetch the date range of interest from the database
      const [rows] = await queryInterface.sequelize.query(`
        SELECT
          hd.gregorian,
          hd.day_index
        FROM
          hebrew_dates hd
        LEFT JOIN
          sun s ON hd.gregorian = s.gregorian
        LEFT JOIN
          moon m ON hd.gregorian = m.gregorian
        WHERE
          hd.gregorian BETWEEN cast('0001-01-01' as date) AND cast('2075-12-31' as date)
          AND s.gregorian IS NULL
          AND m.gregorian IS NULL
        ORDER BY
          hd.gregorian;
      `);

      const insertToDb = async ({ sun_events, moon_events }) => {
        await queryInterface.bulkInsert('sun', sun_events);
        await queryInterface.bulkInsert('moon', moon_events);
      };

      // Create an array of objects with start and end dates for each month
      let periods = [];
      let currentMonth = rows[0].gregorian.slice(0, 7); // 'YYYY-MM'
      let startDate = rows[0].gregorian;

      rows.forEach((row, index) => {
        const date = row.gregorian;
        const month = date.slice(0, 7);

        // Check if the month has changed or if it's the last row
        if (month !== currentMonth || index === rows.length - 1) {
          const endDate = rows[index - 1].gregorian;
          periods.push({ start: startDate, end: endDate });
          startDate = date;
          currentMonth = month;
        }

        // Handle the last row
        if (index === rows.length - 1 && month === currentMonth) {
          periods.push({ start: startDate, end: date });
        }
      });

      console.log('Begin api calls', {
        start_time: new Date(),
        number_months: periods.length,
        month_start: periods[0].start,
        month_end: periods[periods.length - 1].start,
      })
 
      for (const period of periods) {
        console.log(`API Call | start: ${period.start} | end: ${period.end}`);
        const events = await getAstronomyEvents(period.start, period.end);

        const has_sun_events = !!events?.sun_events?.length
        const has_moon_events = !!events?.moon_events?.length

        if (!has_sun_events || !has_moon_events) {
          throw new Error('API Limitation Error')
        }
        insertToDb(events);
      }

      console.log("Astronomical events successfully persisted to database.");
    } catch (error) {
      console.error('DB migration error', error);
      throw new Error('Rollback');
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Add logic to revert the changes made in the up method
  },
};
