'use strict';

/**
 * month_index ("new moons") and a creation-anchored day_index.
 *
 *   month_index — a running count of Hebrew months. 1 = Cheshvan AM 1 (yy 1, mm 8), the
 *   month of 1-08-01 (Julian 4004-10-24 BC); every day of a month carries its month's
 *   value; consecutive months differ by exactly 1; the months before creation count
 *   down (Tishri AM 1 = 0, Elul AM 0 = -1, ... Kislev AM 0 = -10 at the table's start).
 *   month_index never equals mm (Cheshvan is mm 8 but month 1); the rule that pins the
 *   numbering is Tishri AM 2 = 12 (AM 1 is a common year; it would be 13 after a leap one).
 *
 *   day_index — shifted by one constant so that 1-08-01 = 1 (it was -1462176). It stays
 *   a pure function of the label:  day_index = hebrew_dates_jdn(gregorian) - 259258.
 *   events.day_index / events_entry.day_index move by the same constant; spans are
 *   identical; 4004-01-01 BC becomes -295. Also adds indexes on day_index and month_index.
 *
 * Any later row generator must set both: day_index as above, and month_index = the
 * previous month's + 1 whenever (yy, mm) changes.
 *
 * Run with the API stopped. Idempotent: a second run is a no-op.
 */

const OLD_CREATION_INDEX = -1462176          // day_index of 1-08-01 before this migration
const SHIFT = 1 - OLD_CREATION_INDEX          // 1462177
const OLD_JDN_OFFSET = 1721435                // day_index = JDN - OLD_JDN_OFFSET before
const NEW_JDN_OFFSET = OLD_JDN_OFFSET - SHIFT // 259258
const WEEKDAYS_SQL = `(ARRAY['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'])`

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const sequelize = queryInterface.sequelize
    const t = await sequelize.transaction()
    const select = (sql, replacements = {}) =>
      sequelize.query(sql, { replacements, type: Sequelize.QueryTypes.SELECT, transaction: t })
    const run = (sql, replacements = {}) => sequelize.query(sql, { replacements, transaction: t })
    const one = async (sql, replacements) => (await select(sql, replacements))[0]
    const assert = (cond, msg) => { if (!cond) throw new Error(`[month-index migration] assertion failed: ${msg}`) }
    const log = (...a) => console.log('[month-index migration]', ...a)
    const idx = async (where) => Number((await one(`SELECT day_index FROM hebrew_dates WHERE ${where};`)).day_index)

    try {
      await run('SET LOCAL statement_timeout = 0;')
      await run(`SET LOCAL lock_timeout = '30s';`)
      await run(`SET LOCAL work_mem = '128MB';`)

      /* ── 0. where are we? ─────────────────────────────────────────── */
      const creation = await idx(`yy = 1 AND mm = 8 AND dd = 1`)
      const hasColumn = (await select(`SELECT 1 FROM information_schema.columns WHERE table_name = 'hebrew_dates' AND column_name = 'month_index';`)).length > 0
      if (creation === 1 && hasColumn) {
        const nulls = await one(`SELECT count(*)::int AS n FROM hebrew_dates WHERE month_index IS NULL;`)
        if (nulls.n === 0) { log('already applied; no-op'); await t.commit(); return }
      }
      assert(creation === OLD_CREATION_INDEX || creation === 1,
        `1-08-01 has day_index ${creation}; expected ${OLD_CREATION_INDEX} (pre) or 1 (post)`)
      const before = await one(`
        SELECT count(*)::bigint AS rows,
               (SELECT day_index FROM hebrew_dates WHERE gregorian = DATE '1582-10-15') AS anchor1582,
               (SELECT day_index FROM hebrew_dates WHERE gregorian = DATE '2024-01-01') AS modern,
               (SELECT day_index FROM hebrew_dates WHERE gregorian = DATE '2063-10-24')
             - (SELECT day_index FROM hebrew_dates WHERE gregorian = DATE '0070-08-04') + 1 AS span_70_2063
        FROM hebrew_dates;`)
      assert(Number(before.span_70_2063) === 728012, `70 AD -> 2063 span is ${before.span_70_2063}, expected 728012 — run 20260911000000 first`)
      log(`rows: ${before.rows}; 1-08-01 = ${creation}; 1582-10-15 = ${before.anchor1582}; 2024-01-01 = ${before.modern}`)

      /* ── 1. creation = day 1 ──────────────────────────────────────── */
      if (creation !== 1) {
        await run(`UPDATE hebrew_dates SET day_index = day_index + ${SHIFT};`)
        // events.day_index / events_entry.day_index are absolute copies of hebrew_dates.day_index;
        // move them by the same constant (no-ops when those tables are empty). The events
        // fan-out trigger is AFTER INSERT only, so these UPDATEs do not fan out.
        await run(`UPDATE events SET day_index = day_index + ${SHIFT};`)
        await run(`UPDATE events_entry SET day_index = day_index + ${SHIFT};`)
        log(`day_index shifted by +${SHIFT} (hebrew_dates, events, events_entry)`)
      }

      /* ── 2. month_index ───────────────────────────────────────────── */
      if (!hasColumn) await run(`ALTER TABLE hebrew_dates ADD COLUMN month_index BIGINT;`)
      await run(`
        WITH m AS (SELECT yy, mm, min(day_index) AS first_day FROM hebrew_dates GROUP BY yy, mm),
             r AS (SELECT yy, mm, DENSE_RANK() OVER (ORDER BY first_day) AS rk FROM m),
             a AS (SELECT rk AS creation_rk FROM r WHERE yy = 1 AND mm = 8)
        UPDATE hebrew_dates hd
           SET month_index = r.rk - a.creation_rk + 1
          FROM r, a
         WHERE r.yy = hd.yy AND r.mm = hd.mm
           AND hd.month_index IS DISTINCT FROM r.rk - a.creation_rk + 1;`)
      await run(`ALTER TABLE hebrew_dates ALTER COLUMN month_index SET NOT NULL;`)
      await run(`CREATE INDEX IF NOT EXISTS hebrew_dates_day_index_idx ON hebrew_dates (day_index);`)
      await run(`CREATE INDEX IF NOT EXISTS hebrew_dates_month_index_idx ON hebrew_dates (month_index);`)

      /* ── 3. prove it ──────────────────────────────────────────────── */
      // 3a. day_index: creation = 1, everything a constant away from where it was, still the calendar
      assert(await idx(`yy = 1 AND mm = 8 AND dd = 1`) === 1, '1-08-01 is not day 1')
      assert(await idx(`gregorian = DATE '4004-01-01 BC'`) === -295, '4004-01-01 BC is not -295')
      assert(await idx(`gregorian = DATE '1582-10-15'`) === Number(before.anchor1582) + (creation === 1 ? 0 : SHIFT), '1582-10-15 moved by the wrong amount')
      const after = await one(`
        SELECT count(*)::bigint AS rows,
               count(*) FILTER (WHERE day_index <> hebrew_dates_jdn(gregorian) - ${NEW_JDN_OFFSET})::int AS not_from_label,
               count(*) FILTER (WHERE day_of_week <> ${WEEKDAYS_SQL}[((day_index + ${NEW_JDN_OFFSET} + 1) % 7) + 1])::int AS weekday_wrong,
               (SELECT day_index FROM hebrew_dates WHERE gregorian = DATE '2063-10-24')
             - (SELECT day_index FROM hebrew_dates WHERE gregorian = DATE '0070-08-04') + 1 AS span_70_2063,
               (SELECT day_index FROM hebrew_dates WHERE gregorian = DATE '2024-01-01')
             - (SELECT day_index FROM hebrew_dates WHERE gregorian = DATE '4004-01-01 BC') + 1 AS span_creation_2024
        FROM hebrew_dates;`)
      assert(String(after.rows) === String(before.rows), 'row count changed')
      assert(after.not_from_label === 0, `${after.not_from_label} rows whose day_index is not JDN - ${NEW_JDN_OFFSET}`)
      assert(after.weekday_wrong === 0, `${after.weekday_wrong} rows whose weekday disagrees with day_index`)
      assert(Number(after.span_70_2063) === 728012 && Number(after.span_creation_2024) === 2201349, `spans changed: ${JSON.stringify(after)}`)

      // 3b. month_index: anchored, one value per month, consecutive, and it starts where the table starts
      const mi = await one(`
        SELECT
          (SELECT count(DISTINCT month_index)::int FROM hebrew_dates WHERE yy = 1 AND mm = 8) AS creation_values,
          (SELECT min(month_index) FROM hebrew_dates WHERE yy = 1 AND mm = 8) AS creation,
          (SELECT min(month_index) FROM hebrew_dates WHERE yy = 1 AND mm = 7) AS tishri_am1,
          (SELECT min(month_index) FROM hebrew_dates WHERE yy = 2 AND mm = 7) AS tishri_am2,
          (SELECT min(month_index) FROM hebrew_dates) AS first_month,
          (SELECT max(month_index) FROM hebrew_dates) AS last_month,
          (SELECT count(*)::int FROM (SELECT DISTINCT yy, mm FROM hebrew_dates) x) AS months,
          (SELECT count(DISTINCT month_index)::int FROM hebrew_dates) AS month_values,
          (SELECT count(*)::int FROM (SELECT yy, mm, count(DISTINCT month_index) AS c FROM hebrew_dates GROUP BY yy, mm HAVING count(DISTINCT month_index) <> 1) y) AS split_months,
          (SELECT count(*)::int FROM (SELECT month_index, count(DISTINCT (yy, mm)) AS c FROM hebrew_dates GROUP BY month_index HAVING count(DISTINCT (yy, mm)) <> 1) z) AS merged_months;`)
      assert(mi.creation_values === 1 && Number(mi.creation) === 1, `Cheshvan AM 1 is month ${mi.creation} (${mi.creation_values} values)`)
      assert(Number(mi.tishri_am1) === 0, `Tishri AM 1 is month ${mi.tishri_am1}, expected 0`)
      assert(Number(mi.tishri_am2) === 12, `Tishri AM 2 is month ${mi.tishri_am2}, expected 12 (AM 1 has 12 months)`)
      assert(Number(mi.first_month) === -10, `first month is ${mi.first_month}, expected -10 (Kislev AM 0)`)
      assert(mi.split_months === 0 && mi.merged_months === 0, `month_index does not map 1:1 onto (yy, mm): ${JSON.stringify(mi)}`)
      assert(mi.months === mi.month_values && Number(mi.last_month) - Number(mi.first_month) + 1 === mi.months,
        `months are not consecutive: ${JSON.stringify(mi)}`)
      const steps = await one(`
        WITH s AS (SELECT dd, month_index - lag(month_index) OVER (ORDER BY day_index) AS ms,
                          day_index - lag(day_index) OVER (ORDER BY day_index) AS ds
                   FROM hebrew_dates)
        SELECT count(*) FILTER (WHERE ms NOT IN (0, 1))::int AS bad,
               count(*) FILTER (WHERE ms = 1 AND dd <> 1 AND NOT (dd = 2 AND ds = 2))::int AS not_at_first_day
        FROM s;`)
      assert(steps.bad === 0, `${steps.bad} places where month_index does not step by 0 or 1`)
      assert(steps.not_at_first_day === 0, `${steps.not_at_first_day} months that do not begin on dd = 1 (or dd = 2 after a hole)`)

      await t.commit()
      log(`committed: day 1 = 1-08-01; months ${mi.first_month}..${mi.last_month} (${mi.months}); day_index = hebrew_dates_jdn(gregorian) - ${NEW_JDN_OFFSET}`)
    } catch (err) {
      if (!t.finished) await t.rollback().catch((e) => console.error('[month-index migration] rollback failed:', e.message))
      console.error('[month-index migration] rolled back:', err.message)
      throw err
    }
  },

  down: async (queryInterface, Sequelize) => {
    const sequelize = queryInterface.sequelize
    const t = await sequelize.transaction()
    const run = (sql) => sequelize.query(sql, { transaction: t })
    try {
      await run('SET LOCAL statement_timeout = 0;')
      const [row] = await sequelize.query(`SELECT day_index FROM hebrew_dates WHERE yy = 1 AND mm = 8 AND dd = 1;`,
        { type: Sequelize.QueryTypes.SELECT, transaction: t })
      if (Number(row.day_index) !== 1) throw new Error(`[month-index migration] down: 1-08-01 is ${row.day_index}, expected 1; refusing to un-shift`)
      await run('DROP INDEX IF EXISTS hebrew_dates_month_index_idx;')
      await run('DROP INDEX IF EXISTS hebrew_dates_day_index_idx;')
      await run('ALTER TABLE hebrew_dates DROP COLUMN IF EXISTS month_index;')
      await run(`UPDATE hebrew_dates SET day_index = day_index - ${SHIFT};`)
      await run(`UPDATE events SET day_index = day_index - ${SHIFT};`)
      await run(`UPDATE events_entry SET day_index = day_index - ${SHIFT};`)
      await t.commit()
    } catch (err) {
      if (!t.finished) await t.rollback().catch(() => {})
      throw err
    }
  }
}
