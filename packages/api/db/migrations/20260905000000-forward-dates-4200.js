'use strict';

const {
  from_gregorian
} = require(`${__dirname}/../../src/services/Fourmilab`)

// Carries hebrew_dates forward from the day after the current frontier
// (2075-09-09, Elul 29 5835 — the last day inserted by 20240407000000)
// through the end of Hebrew year 7960 (Elul 29, ~Sep 4200 AD), then
// generates hebrew_event_dates for the new years. Moon/sun tables and the
// events/events_pairs fan-out are intentionally not touched.

// Hebrew year 5835 ended in Gregorian 2075 (5835 - 2075 = 3760),
// so the last Hebrew year ending within 4200 AD is 4200 + 3760 = 7960.
const END_HEBREW_YY = 7960;

const getNewDates = (frontier) => {
  const [fy, fm, fd] = frontier.gregorian.split('-').map(Number);
  const start = new Date(Date.UTC(fy, fm - 1, fd));
  start.setUTCDate(start.getUTCDate() + 1);

  const dates = [];
  let day_index = Number(frontier.day_index);

  for (
    let date = new Date(start);
    ;
    date.setUTCDate(date.getUTCDate() + 1)
  ) {
    const partial = {
      year: { value: date.getUTCFullYear() },
      month: { selectedIndex: date.getUTCMonth() },
      day: { value: date.getUTCDate() },
      hour: { value: null },
      min: { value: null },
      sec: { value: null },
      leap: { value: null },
      wday: { value: null }
    }

    const { hebrew, gregorian } = from_gregorian({ gregorian: partial })

    if (hebrew.year.value > END_HEBREW_YY) break;

    dates.push({
      gregorian: date.toISOString().split('T')[0],
      day_of_week: gregorian.wday.value,
      day_index: ++day_index,
      dd: hebrew.day.value,
      mm: hebrew.month.selectedIndex + 1,
      yy: hebrew.year.value,
    });
  }

  return dates;
}

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      const [frontier] = await queryInterface.sequelize.query(
        `SELECT gregorian, day_index, yy FROM "hebrew_dates" ORDER BY day_index DESC LIMIT 1;`,
        { type: Sequelize.QueryTypes.SELECT }
      );

      if (!frontier) throw new Error('hebrew_dates is empty — run earlier migrations first');
      if (Number(frontier.yy) >= END_HEBREW_YY) {
        console.log('forward dates already generated, skipping');
        return;
      }

      // Retroactive cleanup: prior migrations tagged purim on Elul 14 (lastMonth
      // bug) instead of Adar 14. Delete any of those rows still present — no-op
      // if they were already removed manually; leaves correct rows untouched.
      await queryInterface.sequelize.query(`
        DELETE FROM hebrew_event_dates hed
        USING hebrew_events he, hebrew_dates hd
        WHERE he.uuid = hed.hebrew_event
          AND hd.uuid = hed.hebrew_date
          AND he.short_name = 'purim'
          AND hd.mm = 6 AND hd.dd = 14;
      `);

      const lastYY = Number(frontier.yy);
      const hDates = getNewDates(frontier);
      console.log(`inserting ${hDates.length} hebrew_dates (${hDates[0].gregorian} → ${hDates[hDates.length - 1].gregorian})`);

      const BATCH = 5000;
      for (let i = 0; i < hDates.length; i += BATCH) {
        await queryInterface.bulkInsert('hebrew_dates', hDates.slice(i, i + BATCH));
      }

      const events = await queryInterface.sequelize.query(
        `SELECT uuid, name, short_name FROM "hebrew_events";`,
        { type: Sequelize.QueryTypes.SELECT }
      );

      const uniqueYears = [...new Set(hDates.map(({ yy }) => yy))].sort((a, b) => a - b);

      for (const yy of uniqueYears) {
        try {
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
          // 50th day counted inclusively from yom_bikkurim, so +49 — lands on a Sunday.
          // The prior migrations used +50 (Monday); that data was corrected manually.
          const shavuot = [incrementDays(dates, yom_bikkurim[0], 49)]
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

          // purim intentionally not generated: the prior migrations' lastMonth logic
          // tagged Elul 14 instead of Adar 14, and those rows were removed manually.
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

          console.log({ yy, events: yearInserts.length })
          await queryInterface.bulkInsert('hebrew_event_dates', yearInserts)
        } catch (error) {
          console.log('db migration error forward event dates', yy, error)
        }
      }

      // Backfill event_day for the new multi-day feasts, mirroring 20250527120000-event-pairs
      await queryInterface.sequelize.query(`
        WITH ranked AS (
          SELECT
            hed.uuid,
            he.short_name,
            hd.yy,
            ROW_NUMBER() OVER (
              PARTITION BY he.short_name, hd.yy
              ORDER BY hd.day_index
            ) AS rn
          FROM hebrew_event_dates hed
          JOIN hebrew_events he ON he.uuid = hed.hebrew_event
          JOIN hebrew_dates  hd ON hd.uuid = hed.hebrew_date
          WHERE he.short_name IN ('sukkot', 'matzot', 'chanukkah')
            AND hd.yy > :lastYY
        )
        UPDATE hebrew_event_dates hed
        SET    event_day = r.rn
        FROM   ranked r
        WHERE  hed.uuid = r.uuid
          AND (
            (r.short_name IN ('sukkot','chanukkah') AND r.rn <= 8) OR
            (r.short_name =  'matzot'               AND r.rn <= 7)
          );
      `, { replacements: { lastYY } });
    } catch (error) {
      console.error('db migration error forward dates', error)
    }
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      DELETE FROM hebrew_event_dates
      WHERE hebrew_date IN (
        SELECT uuid FROM hebrew_dates WHERE gregorian > '2075-09-09'
      );
    `);
    await queryInterface.sequelize.query(`
      DELETE FROM hebrew_dates WHERE gregorian > '2075-09-09';
    `);
  },
};

const incrementDays = (dates, date, incrementDays) => dates.find((x) => Number(x.day_index) === (Number(date.day_index) + incrementDays))

const nextDay = (dates, date, day_of_week) => {
  return dates.find((_date) => {
    return (Number(_date.day_index) > Number(date.day_index)) && (_date.day_of_week === day_of_week)
  })
}

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
