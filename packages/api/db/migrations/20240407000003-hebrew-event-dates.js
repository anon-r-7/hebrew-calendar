'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('hebrew_event_dates', {
      uuid: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('uuid_generate_v4()'),
      },
      hebrewDateUuid: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'hebrew_dates', 
          key: 'uuid',
        },
      },
      hebrewEventUuid: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'hebrew_events',
          key: 'uuid',
        },
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    const uniqueYears = await queryInterface.sequelize.query(
      `SELECT DISTINCT "yy" FROM "hebrew_dates" ORDER BY "yy";`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    const events = getEvents(years)
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('hebrew_event_dates');
  },
};

const getEvents = (years) => {
  const events = []
  years.map(({ yy }) => {

    const dates = await queryInterface.sequelize.query(
      `SELECT * FROM "hebrew_dates" WHERE "yy" = :yy;`
      {
        type: Sequelize.QueryTypes.SELECT,
        replacements: { yy }
      }
    )

    const sabbath1 = dates.findByGregorian(
      dates,
      getNextSaturday(dates[0].gregorian)
    )

    const passover = dates.find(
      (date) => mm === 1 && dd === 14
    )
    const unleavened1 = dates.find(
      (date) => mm === 1 && dd === 15
    )
    const unleavened2 = dates.find(
      (date) => mm === 1 && dd === 16
    )
    const unleavened3 = dates.find(
      (date) => mm === 1 && dd === 17
    )
    const unleavened4 = dates.find(
      (date) => mm === 1 && dd === 18
    )
    const unleavened5 = dates.find(
      (date) => mm === 1 && dd === 19
    )
    const unleavened6 = dates.find(
      (date) => mm === 1 && dd === 20
    )
    const unleavened7 = dates.find(
      (date) => mm === 1 && dd === 21
    )
    const firstFruits = findByGregorian(
      dates,
      getNextSunday(unleavened1.gregorian)
    )
    const pentecost = findByGregorian(
      dates,
      incrementDays(firstFruits.gregorian, 50)
    )

    const roshTeruah = dates.find(
      (date) => mm === 7 && dd === 1
    )
    const yomKipur = dates.find(
      (date) => mm === 7 && dd === 10
    )
    const sukkot1 = dates.find(
      (date) => mm === 7 && dd === 15
    )
    const sukkot2 = dates.find(
      (date) => mm === 7 && dd === 16
    )
    const sukkot3 = dates.find(
      (date) => mm === 7 && dd === 17
    )
    const sukkot4 = dates.find(
      (date) => mm === 7 && dd === 18
    )
    const sukkot5 = dates.find(
      (date) => mm === 7 && dd === 19
    )
    const sukkot6 = dates.find(
      (date) => mm === 7 && dd === 20
    )
    const sukkot7 = dates.find(
      (date) => mm === 7 && dd === 21
    )
    const sukkot8 = dates.find(
      (date) => mm === 7 && dd === 22
    )

    const roshChodesh1 = dates.find(
      (date) => mm === 1 && dd === 1
    )
    const roshChodesh2 = dates.find(
      (date) => mm === 2 && dd === 1
    )
    const roshChodesh3 = dates.find(
      (date) => mm === 3 && dd === 1
    )
    const roshChodesh4 = dates.find(
      (date) => mm === 4 && dd === 1
    )
    const roshChodesh5 = dates.find(
      (date) => mm === 5 && dd === 1
    )
    const roshChodesh6 = dates.find(
      (date) => mm === 6 && dd === 1
    )
    const roshChodesh7 = dates.find(
      (date) => mm === 7 && dd === 1
    )
    const roshChodesh8 = dates.find(
      (date) => mm === 8 && dd === 1
    )
    const roshChodesh9 = dates.find(
      (date) => mm === 9 && dd === 1
    )
    const roshChodesh10 = dates.find(
      (date) => mm === 10 && dd === 1
    )
    const roshChodesh11 = dates.find(
      (date) => mm === 11 && dd === 1
    )
    const roshChodesh12 = dates.find(
      (date) => mm === 12 && dd === 1
    )
    const roshChodesh13 = dates.find(
      (date) => mm === 13 && dd === 1
    )

    // get sabbaths
    // const sabbath1 = dates.find((date) => mm === 13 && dd === 1)

    if (year === 5784) {
      console.log({
        passover,
        unleavened1,
        unleavened2,
        unleavened3,
        unleavened4,
        unleavened5,
        unleavened6,
        unleavened7,
        firstFruits,
        pentecost,
        roshTeruah,
        yomKipur,
        sukkot1,
        sukkot2,
        sukkot3,
        sukkot4,
        sukkot5,
        sukkot6,
        sukkot7,
        sukkot8,
        roshChodesh1,
        roshChodesh2,
        roshChodesh3,
        roshChodesh4,
        roshChodesh5,
        roshChodesh6,
        roshChodesh7,
        roshChodesh8,
        roshChodesh9,
        roshChodesh10,
        roshChodesh11,
        roshChodesh12,
        roshChodesh13
      })
    }
  })
  return events
}

const findByGregorian = (dates, targetDate) => {
  const [y, m, d] = targetDate.split('-')

  return dates.find((date) => {
    const [gYear, gMonth, gDate] = date.gregorian
    return m === gMonth && d === gDate && y === gYear
  })
}

const incrementDays = (date, incrementDays) => {
  const [y, m, d] = date.split('-')
  const dt = new Date(2000, m - 1, d)
  dt.setFullYear(y)
  dt.setDate(dt.getDate() + incrementDays)
  return `${dt.getFullYear()}-${dt.getMonth() + 1}-${dt.getDate()}`
}

const getNextSunday = (date) => {
  const [y, m, d] = date.split('-')
  const dt = new Date(2000, m - 1, d)
  dt.setFullYear(y)

  let daysToAdd = (7 - dt.getDay()) % 7
  daysToAdd = daysToAdd === 0 ? 7 : daysToAdd
  dt.setDate(dt.getDate() + daysToAdd)

  return `${dt.getFullYear()}-${dt.getMonth() + 1}-${dt.getDate()}`
}

const getNextSaturday = (date) => {
  const [y, m, d] = date.split('-');
  const dt = new Date(2000, m - 1, d);
  dt.setFullYear(y);

  let daysToAdd = 6 - dt.getDay();
  daysToAdd = daysToAdd < 0 ? 6 : daysToAdd === 0 ? 7 : daysToAdd;
  dt.setDate(dt.getDate() + daysToAdd);

  return `${dt.getFullYear()}-${dt.getMonth() + 1}-${dt.getDate()}`;
};
