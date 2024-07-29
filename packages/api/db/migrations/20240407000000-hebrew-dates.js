'use strict';

const {
  from_julian_calendar,
  from_gregorian
} = require(`${__dirname}/../../src/services/Fourmilab`)

// Gregorian Transition Notes:
// Pope: 1582 oct 4->15
// Brit: 1752 sep 2->14

const getGregorian = () => {
  const start = new Date('2024-01-01');
  start.setFullYear(1);

  // Hebrew Year 5835 Month 6 Day 29 (last day of year 5835)
  const end = new Date('2075-09-09');

  const dates = [];
  let day_index = 0;

  for (
    let date = new Date(start);
    date <= end;
    date.setDate(date.getDate() + 1)
  ) {
    // Skip the dates from Oct 5 to Oct 14, 1582 so that we can apply gregorian back in time
    const skipJulianDates = date >= new Date(1582, 9, 5) && date <= new Date(1582, 9, 14) 

    if (!skipJulianDates) dates.push({
      date: new Date(date),
      day_index: ++day_index
    });      
  }

  return dates;
}

const calendar_methods = {
  from_gregorian,
  from_julian_calendar
};

const getHebrew = (gDates) => {
  const hDates = [];
  gDates.forEach((entry) => {
    const { date, day_index } = entry;

    const isGregorian = date >= new Date(1582,9,15) 
    const key = isGregorian ? 'gregorian' : 'juliancalendar'
    const method = isGregorian ? 'from_gregorian' : 'from_julian_calendar'

    const partial = {
      year: { value: date.getFullYear() },
      month: { selectedIndex: date.getMonth() },
      day: { value: date.getDate() },
      leap: { value: null },
      wday: { value: null }
    }

    if (isGregorian) {
      partial.hour = { value: null }
      partial.min = { value: null }
      partial.sec = { value: null }
    }

    try {
      const { hebrew, gregorian } = calendar_methods[method]({ [key]: partial })

      hDates.push({
          gregorian: date.toISOString().split('T')[0],
          day_of_week: gregorian.wday.value,
          day_index,
          dd: hebrew.day.value,
          mm: hebrew.month.selectedIndex + 1,
          yy: hebrew.year.value,
      });
    } catch(error) {
      console.log(error)
    }
  });

  return hDates;
};

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');

      await queryInterface.createTable('hebrew_dates', {
        uuid: {
          allowNull: false,
          primaryKey: true,
          type: Sequelize.UUID,
          defaultValue: Sequelize.literal('uuid_generate_v4()'),
        },
        gregorian: {
          type: Sequelize.DATEONLY
        },
        day_of_week: {
          type: Sequelize.STRING
        },
        day_index: {
          type: Sequelize.BIGINT
        },
        dd: {
          type: Sequelize.INTEGER
        },
        mm: {
          type: Sequelize.INTEGER
        },
        yy: {
          type: Sequelize.INTEGER
        },
        created_at: {
          allowNull: false,
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
        updated_at: {
          allowNull: false,
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        }
      });

      const gDates = getGregorian()
      const hDates = getHebrew(gDates)
      await queryInterface.bulkInsert('hebrew_dates', hDates)
    } catch (error) {
      console.error('db migration error 1', error)
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('hebrew_dates');
  },
}