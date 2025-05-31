'use strict';

const fs = require('fs');
const path = require('path');

const {
  from_julian_calendar,
  from_gregorian
} = require(`${__dirname}/../../src/services/Fourmilab`)

const getGregorian = () => {
  // Start with the last day of 1 BC
  const start = new Date('2024-12-31');
  start.setFullYear(-1);

  // Go to the first day of 4004 BC
  const end = new Date('2024-01-01');
  end.setFullYear(-4004);

  const dates = [];
  let day_index = 1;

  console.log('\n\nGet gregorian\n\n')

  for (
    let date = new Date(start);
    date >= end;
    date.setDate(date.getDate() - 1)
  ) {
    // Skip leap year dates as these do not belong in BC years for gregorian proleptic or hebrew
    if (date.getDate() === 29 && (date.getMonth() + 1) === 2) continue

    console.log('year', Math.ceil((day_index + 1) / 364))
    dates.push({
      date: new Date(date),
      day_index: --day_index
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

  console.log('\n\nGet hebrew\n\n')

  gDates.forEach((entry) => {
    const { date, day_index } = entry;

    console.log('year', Math.ceil((day_index + 1) / 364))

    const partial = {
      year: { value: date.getFullYear() },
      month: { selectedIndex: date.getMonth() },
      day: { value: date.getDate() },
      leap: { value: null },
      wday: { value: null }
    }

    try {
      const { hebrew, gregorian } = calendar_methods.from_julian_calendar({ juliancalendar: partial })    

      hDates.push({
        gregorian: `${Math.abs(date.getFullYear()).toString().padStart(4,'0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} BC`,
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
      const filePath = path.join(__dirname, 'hebrew_dates.json');
    
      let hDates;
      if (fs.existsSync(filePath)) {
        hDates = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      } else {
        const gDates = getGregorian();
        hDates = getHebrew(gDates);
        fs.writeFileSync(filePath, JSON.stringify(hDates, null, 2));
      }
    
      const BATCH = 5000;
      for (let i = 0; i < hDates.length; i += BATCH) {
        await queryInterface.bulkInsert(
          'hebrew_dates',
          hDates.slice(i, i + BATCH)
        );
      }
    } catch (error) { 
      console.error('db migration error 1', error)
    }
  },
  down: async (queryInterface, Sequelize) => {
    //
  },
}