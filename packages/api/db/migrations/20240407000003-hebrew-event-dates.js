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

    // const events = getEvents(years, hDates)
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('hebrew_event_dates');
  },
};



const getNextSunday = (date) => {
  const nextSunday = new Date(date)

  let daysToAdd = (7 - nextSunday.getDay()) % 7
  daysToAdd = daysToAdd === 0 ? 7 : daysToAdd
  nextSunday.setDate(nextSunday.getDate() + daysToAdd)

  return nextSunday
}

function incrementDays(date, incrementDays) {
  const nextDate = new Date(date)
  nextDate.setDate(nextDate.getDate() + incrementDays)
  return nextDate
}

const findByGregorian = (dates, date) => {
  const m = date.getMonth()
  const d = date.getDate()
  const y = date.getFullYear()

  return dates.find((_date) => {
    const dt = new Date(_date.gdate)
    return m === dt.getMonth() && d === dt.getDate() && y === dt.getFullYear()
  })
}

const getEvents = (years, allDates) => {
  const events = []
  years.map((year) => {
    const dates = allDates.filter((date) => date.hdate.yy === year)

    const passover = dates.find(
      (date) => date.hdate.mm === 1 && date.hdate.dd === 14
    )
    const unleavened1 = dates.find(
      (date) => date.hdate.mm === 1 && date.hdate.dd === 15
    )
    const unleavened2 = dates.find(
      (date) => date.hdate.mm === 1 && date.hdate.dd === 16
    )
    const unleavened3 = dates.find(
      (date) => date.hdate.mm === 1 && date.hdate.dd === 17
    )
    const unleavened4 = dates.find(
      (date) => date.hdate.mm === 1 && date.hdate.dd === 18
    )
    const unleavened5 = dates.find(
      (date) => date.hdate.mm === 1 && date.hdate.dd === 19
    )
    const unleavened6 = dates.find(
      (date) => date.hdate.mm === 1 && date.hdate.dd === 20
    )
    const unleavened7 = dates.find(
      (date) => date.hdate.mm === 1 && date.hdate.dd === 21
    )
    const firstFruits = findByGregorian(
      allDates,
      getNextSunday(unleavened1.gdate)
    )
    const pentecost = findByGregorian(
      allDates,
      incrementDays(firstFruits.gdate, 50)
    )

    const roshTeruah = dates.find(
      (date) => date.hdate.mm === 7 && date.hdate.dd === 1
    )
    const yomKipur = dates.find(
      (date) => date.hdate.mm === 7 && date.hdate.dd === 10
    )
    const sukkot1 = dates.find(
      (date) => date.hdate.mm === 7 && date.hdate.dd === 15
    )
    const sukkot2 = dates.find(
      (date) => date.hdate.mm === 7 && date.hdate.dd === 16
    )
    const sukkot3 = dates.find(
      (date) => date.hdate.mm === 7 && date.hdate.dd === 17
    )
    const sukkot4 = dates.find(
      (date) => date.hdate.mm === 7 && date.hdate.dd === 18
    )
    const sukkot5 = dates.find(
      (date) => date.hdate.mm === 7 && date.hdate.dd === 19
    )
    const sukkot6 = dates.find(
      (date) => date.hdate.mm === 7 && date.hdate.dd === 20
    )
    const sukkot7 = dates.find(
      (date) => date.hdate.mm === 7 && date.hdate.dd === 21
    )
    const sukkot8 = dates.find(
      (date) => date.hdate.mm === 7 && date.hdate.dd === 22
    )

    const roshChodesh1 = dates.find(
      (date) => date.hdate.mm === 1 && date.hdate.dd === 1
    )
    const roshChodesh2 = dates.find(
      (date) => date.hdate.mm === 2 && date.hdate.dd === 1
    )
    const roshChodesh3 = dates.find(
      (date) => date.hdate.mm === 3 && date.hdate.dd === 1
    )
    const roshChodesh4 = dates.find(
      (date) => date.hdate.mm === 4 && date.hdate.dd === 1
    )
    const roshChodesh5 = dates.find(
      (date) => date.hdate.mm === 5 && date.hdate.dd === 1
    )
    const roshChodesh6 = dates.find(
      (date) => date.hdate.mm === 6 && date.hdate.dd === 1
    )
    const roshChodesh7 = dates.find(
      (date) => date.hdate.mm === 7 && date.hdate.dd === 1
    )
    const roshChodesh8 = dates.find(
      (date) => date.hdate.mm === 8 && date.hdate.dd === 1
    )
    const roshChodesh9 = dates.find(
      (date) => date.hdate.mm === 9 && date.hdate.dd === 1
    )
    const roshChodesh10 = dates.find(
      (date) => date.hdate.mm === 10 && date.hdate.dd === 1
    )
    const roshChodesh11 = dates.find(
      (date) => date.hdate.mm === 11 && date.hdate.dd === 1
    )
    const roshChodesh12 = dates.find(
      (date) => date.hdate.mm === 12 && date.hdate.dd === 1
    )
    const roshChodesh13 = dates.find(
      (date) => date.hdate.mm === 13 && date.hdate.dd === 1
    )

    // get sabbaths
    // const sabbath1 = dates.find((date) => date.hdate.mm === 13 && date.hdate.dd === 1)

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

