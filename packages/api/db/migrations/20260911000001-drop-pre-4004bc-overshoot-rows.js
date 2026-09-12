'use strict';

/**
 * The BC generator (20240929200000-bc-dates.js) ran six days past its "first day of
 * 4004 BC" stop, leaving rows for 4005-12-26 .. 4005-12-31 BC. They are index-consistent,
 * but five of them carry a Hebrew date one day ahead (0-09-29 appears twice), and the
 * table is meant to start at 4004-01-01 BC. This removes them.
 *
 * No renumbering: since 20260911000000 day_index is a function of the label, so the
 * sequence simply begins at 4004-01-01 BC = -1462472 afterwards.
 */

const FIRST_DAY = `DATE '4004-01-01 BC'`
const WHERE = `gregorian < ${FIRST_DAY}`
const EXPECTED = ['4005-12-26 BC', '4005-12-27 BC', '4005-12-28 BC', '4005-12-29 BC', '4005-12-30 BC', '4005-12-31 BC']

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const sequelize = queryInterface.sequelize
    const t = await sequelize.transaction()
    const select = (sql) => sequelize.query(sql, { type: Sequelize.QueryTypes.SELECT, transaction: t })
    const run = (sql) => sequelize.query(sql, { transaction: t })
    const assert = (cond, msg) => { if (!cond) throw new Error(`[overshoot migration] assertion failed: ${msg}`) }
    const log = (...a) => console.log('[overshoot migration]', ...a)

    try {
      const rows = await select(`SELECT to_char(gregorian, 'YYYY-MM-DD BC') AS g, day_index, day_of_week, yy, mm, dd
                                   FROM hebrew_dates WHERE ${WHERE} ORDER BY gregorian;`)
      if (rows.length === 0) { log('nothing before 4004-01-01 BC; no-op'); await t.commit(); return }
      assert(rows.length === EXPECTED.length && rows.every((r, i) => r.g === EXPECTED[i]),
        `expected exactly ${EXPECTED.join(', ')}; found ${rows.map((r) => r.g).join(', ')}`)

      const [ref] = await select(`
        SELECT (SELECT count(*)::int FROM events_entry ee JOIN hebrew_dates hd ON hd.uuid = ee.hebrew_date WHERE ${WHERE.replace('gregorian', 'hd.gregorian')}) AS entries,
               (SELECT count(*)::int FROM hebrew_event_dates hed JOIN hebrew_dates hd ON hd.uuid = hed.hebrew_date WHERE ${WHERE.replace('gregorian', 'hd.gregorian')}) AS event_dates;`)
      assert(ref.entries === 0, `${ref.entries} events_entry rows reference these dates; remove them first`)
      if (ref.event_dates) await run(`DELETE FROM hebrew_event_dates hed USING hebrew_dates hd WHERE hed.hebrew_date = hd.uuid AND hd.${WHERE};`)

      const [, meta] = await run(`DELETE FROM hebrew_dates WHERE ${WHERE};`)
      const deleted = typeof meta === 'number' ? meta : Number((meta && meta.rowCount) || 0)
      assert(deleted === EXPECTED.length, `deleted ${deleted} rows, expected ${EXPECTED.length}`)

      const [first] = await select(`SELECT to_char(min(gregorian), 'YYYY-MM-DD BC') AS g,
                                           (SELECT day_index FROM hebrew_dates WHERE gregorian = ${FIRST_DAY}) AS idx
                                      FROM hebrew_dates;`)
      assert(first.g === '4004-01-01 BC' && Number(first.idx) === -1462472, `first row is ${first.g} @ ${first.idx}`)

      await t.commit()
      log(`removed ${deleted} rows (${rows.map((r) => `${r.g} ${r.yy}-${r.mm}-${r.dd}`).join('; ')}); table now starts at 4004-01-01 BC = -1462472`)
    } catch (err) {
      if (!t.finished) await t.rollback().catch((e) => console.error('[overshoot migration] rollback failed:', e.message))
      console.error('[overshoot migration] rolled back:', err.message)
      throw err
    }
  },

  down: async (queryInterface) => {
    // Re-create the six rows, this time with the correct Hebrew dates and JDN-based indices.
    const { fourmilabJulian, jdnJulian, JDN_OFFSET, WEEKDAYS } =
      require(`${__dirname}/20260911000000-julian-leap-day-rows-and-day-index.js`).__helpers
    const rows = [26, 27, 28, 29, 30, 31].map((d) => {
      const doc = fourmilabJulian(4005, 12, d)
      const jdn = jdnJulian(1 - 4005, 12, d)
      return {
        gregorian: `4005-12-${d} BC`,
        day_of_week: WEEKDAYS[(jdn + 1) % 7],
        day_index: jdn - JDN_OFFSET,
        dd: doc.hebrew.day.value,
        mm: doc.hebrew.month.selectedIndex + 1,
        yy: doc.hebrew.year.value + 243
      }
    })
    await queryInterface.bulkInsert('hebrew_dates', rows)
  }
}
