const { HDate } = require('@hebcal/core');

const getGregorian = () => {
  // Hebrew Year 3790, Month 7, Day 1
  // The beginning of the Hebrew year in which Jesus died
  const start = new Date('2024-09-25')
  start.setFullYear(29)

  // Hebrew Year 5835 Month 6 Day 29 (last day of year 5835)
  const end = new Date('2075-09-09')
  const dates = []

  for (
    let date = new Date(start);
    date <= end;
    date.setDate(date.getDate() + 1)
  ) {
    dates.push(new Date(date))
  }

  return dates
}

const getHebrew = (gDates) => {
  const hDates = [];
  gDates.forEach((date) => {
    const gdate = new Date(date);
    const hdate = new HDate(gdate);

    const gregorian = gdate.toISOString().split('T')[0];

    hDates.push({
      gregorian,
      dd: hdate.dd,
      mm: hdate.mm,
      yy: hdate.yy,
      rd: hdate.rd,
    });
  });

  return hDates;
};

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const gDates = getGregorian()
    const hDates = getHebrew(gDates)
    await queryInterface.bulkInsert('hebrew_dates', hDates)
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query('TRUNCATE TABLE "hebrew_dates" RESTART IDENTITY CASCADE;');
  },
}
