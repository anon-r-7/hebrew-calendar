'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      return 

      const events = await queryInterface.sequelize.query(
        `SELECT uuid, name, short_name FROM "hebrew_events";`,
        { type: Sequelize.QueryTypes.SELECT }
      );

      const uniqueYears = await queryInterface.sequelize.query(
        `SELECT DISTINCT "yy" FROM "hebrew_dates" WHERE "yy" < 3761 ORDER BY "yy";`,
        { type: Sequelize.QueryTypes.SELECT }
      );

      for (const { yy } of uniqueYears) {
        try {
          console.log('yy', yy)
          const dates = await queryInterface.sequelize.query(
            `SELECT * FROM "hebrew_dates" WHERE "yy" = :yy ORDER BY gregorian;`,
            {
              type: Sequelize.QueryTypes.SELECT,
              replacements: { yy }
            }
          )

          const shabbat = getSabbaths(dates)
          const rosh_chodesh = dates.filter(({ dd }) => dd === 1);
          const pesach = dates.filter(({ mm, dd }) => mm === 1 && dd === 14)
          const matzot = dates.filter(( { mm, dd }) => mm === 1 && [15,16,17,18,19,20,21].includes(dd))
          const yom_bikkurim = [nextDay(dates, matzot[0], 'Sunday')]
          const shavuot = [incrementDays(dates, yom_bikkurim[0], 50)]
          const yom_teruah = dates.filter(({ mm, dd }) => mm === 7 && dd === 1)
          const yom_kippur = dates.filter(({ mm, dd }) => mm === 7 && dd === 10)
          const sukkot = dates.filter(({ mm, dd }) => mm === 7 && [15, 16, 17, 18, 19, 20, 21, 22].includes(dd))

          const chanukkah = [
            ...dates.filter(({ mm, dd }) => mm === 9 && [25,26,27,28,29,30].includes(dd)),
            ...dates.filter(({ mm, dd }) => mm === 10 && [1, 2].includes(dd)),
          ]

          if (!dates.find(({ mm, dd }) => mm === 9 && dd === 30)) chanukkah.push(
            dates.find(({ mm, dd }) => mm === 10 && dd == 3)
          )

          const lastMonth = dates[dates.length - 1].mm
          const purim = dates.filter(({ mm, dd }) => mm == lastMonth && dd === 14)
          const tisha_bav = dates.filter(({ mm, dd }) => mm === 5 && dd === 9)
          const yearEvents = {
            shabbat,
            rosh_chodesh,
            pesach,
            matzot,
            yom_bikkurim,
            shavuot,
            yom_teruah,
            yom_kippur,
            sukkot,
            chanukkah,
            purim,
            tisha_bav
          }

          const yearInserts = []
          Object.keys(yearEvents).map((key) => {
            const hebrew_event = events.find(({ short_name }) => short_name === key).uuid
            const eventDates = yearEvents[key]
            eventDates.map((date) => {
              const hebrew_date = date.uuid
              yearInserts.push({
                hebrew_date,
                hebrew_event,
              })
            })
          })

          await queryInterface.bulkInsert('hebrew_event_dates', yearInserts)
        } catch (error) {
        }
      }
    } catch (error) {
      console.error('db migration error 3', error)
    }

  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('hebrew_event_dates');
  },
};

const incrementDays = (dates, date, incrementDays) => dates.find((x) => parseFloat(x.day_index) === (parseFloat(date.day_index) + incrementDays))

const nextDay = (dates, date, day_of_week) => dates.find((_date) => _date.day_index > date.day_index && _date.day_of_week === day_of_week)

const getSabbaths = (dates) => {
  const sabbaths = [nextDay(dates, dates[0], 'Saturday')]
  let i = 1
  while(i !== null) {
    const nextSabbath = nextDay(dates, sabbaths[i - 1], 'Saturday')

    if (!nextSabbath) {
      i = null
    } else {
      sabbaths.push(nextSabbath)    
      i++    
    }
  }

  return sabbaths;
};
