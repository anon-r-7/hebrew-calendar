'use strict';

const fs = require('fs');
const path = require('path');
const { getAstronomyEvents } = require(`${__dirname}/../../src/services/Astronomy`);

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Fetch the date range of interest from the database
      const [rows] = await queryInterface.sequelize.query(`
        SELECT gregorian, day_index
        FROM hebrew_dates
        WHERE gregorian BETWEEN cast('0001-01-01' as date) AND cast('2075-12-31' as date)
        ORDER BY gregorian;
      `);

      // Create a local JSON file to store events
      const sun_output = path.join(__dirname, 'sun_events.json');
      fs.writeFileSync(sun_output, JSON.stringify([]));

      const moon_output = path.join(__dirname, 'moon_events.json');
      fs.writeFileSync(moon_output, JSON.stringify([]));

      const readFile = (output) => JSON.parse(fs.readFileSync(output))

      const appendToFile = ({ sun_events, moon_events }) => {
        const current_sun_data = readFile(sun_output)
        current_sun_data.push(...sun_events);
        fs.writeFileSync(sun_output, JSON.stringify(current_sun_data, null, 2));

        const current_moon_data = readFile(moon_output)
        current_moon_data.push(...moon_events);
        fs.writeFileSync(moon_output, JSON.stringify(current_moon_data, null, 2));
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

      let counter = 1;
      const denominator = 24900;
      let progress = (1 / denominator) * 100;
      let startTime = Date.now(); // Start time for the entire loop

      for (const period of periods) {
        const events = await getAstronomyEvents(period.start, period.end);
        appendToFile(events);

        // Calculate elapsed time and estimate remaining time
        let elapsedTime = (Date.now() - startTime) / 1000; // Elapsed time in seconds
        let avgTimePerCount = elapsedTime / counter; // Average time per iteration
        let remainingTime = avgTimePerCount * (denominator - counter); // Estimated remaining time in seconds

        let remainingMinutes = Math.floor(remainingTime / 60); // Convert remaining time to minutes
        let remainingSeconds = Math.floor(remainingTime % 60); // Remaining seconds

        console.log(`${progress.toFixed(4)}% | ETA ${remainingMinutes} min ${remainingSeconds} sec. (start: ${period.start} | end: ${period.end})`);
        counter++;
        progress = (counter / denominator) * 100;
      }

      await queryInterface.sequelize.query(`
        TRUNCATE sun;
        TRUNCATE moon;
      `);

      console.log("Astronomical events successfully fetched and saved locally.");

      const sun_insert = readFile(sun_output)
      const moon_insert = readFile(moon_output)

      await queryInterface.bulkInsert('sun', sun_insert);
      await queryInterface.bulkInsert('moon', moon_insert);

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
