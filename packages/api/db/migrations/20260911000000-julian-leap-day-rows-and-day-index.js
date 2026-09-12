'use strict';

/**
 * hebrew_dates has no row for the Julian-calendar leap days its generators never
 * emitted, and day_index (a plain row counter) therefore undercounts elapsed days
 * across every one of them.
 *
 *   - 20240407000000-hebrew-dates.js walks a JS Date (proleptic Gregorian) but hands
 *     every label before 1582-10-15 to from_julian_calendar, i.e. reads it as a
 *     JULIAN date. JS Date never emits Feb 29 of 100, 200, 300, 500, 600, 700, 900,
 *     1000, 1100, 1300, 1400, 1500 — days that exist in the Julian calendar.
 *     12 missing rows.
 *   - 20240929200000-bc-dates.js skips every Feb 29. In the (proleptic) Julian
 *     calendar 1 BC, 5 BC, 9 BC ... 4001 BC are leap years. 1,001 missing rows.
 *
 * Straight from the table: 0100-02-28 Friday idx 36218 -> 0100-03-01 Sunday idx
 * 36219. Weekday and Hebrew date skip a day, day_index doesn't. Net effect:
 * days-between-dates(0070-08-04, 2063-10-24) = 728,000 instead of 728,012.
 *
 * Scope: hebrew_dates (+ shabbat / rosh_chodesh rows in hebrew_event_dates for the
 * new days). events, events_entry, events_pairs and events_pair_view are NOT touched
 * — their day_index copies and pair diffs keep the old numbering until you resync.
 *
 * Run with the API stopped:  pm2 stop <api> -> yarn db:migrate -> pm2 start <api>
 * then db/sql/verify_hebrew_dates_day_index.sql (section 0 is a pre-flight to run
 * BEFORE migrating). Everything is idempotent: re-running is a no-op.
 *
 * In one transaction:
 *   1. Inserts the missing Feb 29 rows a Postgres DATE can hold: the 971 BC leap days
 *      whose astronomical year is also a Gregorian leap year. (DATE is proleptic
 *      Gregorian: Feb 29 of 100 AD or 101 BC is not storable. Those 42 days stay
 *      holes; step 2 still counts them.) Weekday and Hebrew date come from Fourmilab
 *      from_julian_calendar exactly like the neighbouring rows, with the +243 epoch
 *      shift on yy (shifted AM 1 begins Tishri 1 in autumn 4004 BC; 4004-01-01 BC is yy 0).
 *   2. Recomputes day_index for EVERY row from its Julian Day Number:
 *          day_index = JDN(label) - 1721435
 *      reading the label as Julian through 1582-10-04 and Gregorian from 1582-10-15
 *      — the convention the table already uses. The constant keeps 1582-10-15 at
 *      day_index 577726, so no row from 1500-03-01 onward changes; earlier rows shift
 *      by -1 .. -1013. Leaves hebrew_dates_jdn(date) in the DB: any later row
 *      generator must set day_index = hebrew_dates_jdn(gregorian) - 1721435.
 *   3. Asserts before committing: every row's weekday agrees with its JDN; indices
 *      step by 1 everywhere except the 42 unstorable holes (step 2); the anchor is
 *      unchanged; known spans are exact; the new rows' Feb 28 neighbours prove the
 *      label convention and the +243 shift.
 *   4. Adds hebrew_event_dates for the new rows (a Julian Feb 29 BC always falls in
 *      Shevat / Adar / Adar II, so only shabbat and rosh_chodesh can apply).
 */

const { from_julian_calendar } = require(`${__dirname}/../../src/services/Fourmilab`)

const HEBREW_EPOCH_SHIFT = 243          // hebrew_dates.yy = Fourmilab (standard AM) + 243
const JDN_1582_10_15 = 2299161          // Julian Day Number of Gregorian 1582-10-15
const DAY_INDEX_1582_10_15 = 577726     // its day_index today — kept fixed
const JDN_OFFSET = JDN_1582_10_15 - DAY_INDEX_1582_10_15   // 1721435
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const AD_HOLES = [100, 200, 300, 500, 600, 700, 900, 1000, 1100, 1300, 1400, 1500]

const isJulianLeap = (astro) => astro % 4 === 0
const isGregorianLeap = (astro) => (astro % 4 === 0 && astro % 100 !== 0) || astro % 400 === 0

/** Julian Day Number of a (proleptic) Julian-calendar date; astro year (1 BC = 0). */
const jdnJulian = (astro, month, day) => {
  const a = Math.floor((14 - month) / 12)
  const y = astro + 4800 - a
  const m = month + 12 * a - 3
  return day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - 32083
}

/** BC years (as positive numbers) whose Feb 29 is missing AND storable in a DATE. */
const missingStorableBcLeapYears = () => {
  const out = []
  for (let bc = 1; bc <= 4004; bc++) {
    const astro = 1 - bc
    if (isJulianLeap(astro) && isGregorianLeap(astro)) out.push(bc)
  }
  return out
}

/** BC years whose Julian Feb 29 cannot be stored (astronomical year -100, -200, ... not /400). */
const unstorableBcLeapYears = () => {
  const out = []
  for (let bc = 1; bc <= 4004; bc++) {
    const astro = 1 - bc
    if (isJulianLeap(astro) && !isGregorianLeap(astro)) out.push(bc)
  }
  return out
}

/** Fourmilab, reading (bc BC, month, day) as a Julian date — the BC generator's convention (JS year -N). */
const fourmilabJulian = (bc, month, day) =>
  from_julian_calendar({
    juliancalendar: {
      year: { value: -bc },                 // julian_to_jd does `if (year < 1) year++` -> astronomical 1-bc
      month: { selectedIndex: month - 1 },
      day: { value: day },
      leap: { value: null },
      wday: { value: null }
    }
  })

/** Build the hebrew_dates row for Julian Feb 29 of `bc` BC, the way the BC generator would have. */
const buildBcLeapRow = (bc) => {
  const doc = fourmilabJulian(bc, 2, 29)
  const jdn = jdnJulian(1 - bc, 2, 29)
  // Fourmilab exposes the Julian day as julianday.day.value (= JDN - 0.5, midnight-based)
  const fourmilabJd = doc.julianday && doc.julianday.day ? doc.julianday.day.value : null
  if (fourmilabJd == null) throw new Error(`Fourmilab returned no Julian day for ${bc} BC Feb 29`)
  const fourmilabJdn = Math.round(Number(fourmilabJd) + 0.5)
  if (fourmilabJdn !== jdn) throw new Error(`JDN mismatch for ${bc} BC Feb 29: fourmilab ${fourmilabJdn} vs formula ${jdn}`)
  const weekday = WEEKDAYS[(jdn + 1) % 7]
  if (doc.gregorian.wday.value !== weekday) {
    throw new Error(`weekday mismatch for ${bc} BC Feb 29: fourmilab ${doc.gregorian.wday.value} vs JDN ${weekday}`)
  }
  return {
    gregorian: `${String(bc).padStart(4, '0')}-02-29 BC`,
    day_of_week: weekday,
    day_index: jdn - JDN_OFFSET,
    dd: doc.hebrew.day.value,
    mm: doc.hebrew.month.selectedIndex + 1,
    yy: doc.hebrew.year.value + HEBREW_EPOCH_SHIFT
  }
}

// SQL: Julian Day Number of a hebrew_dates.gregorian value under the table's label convention.
const JDN_FUNCTION_SQL = `
  CREATE OR REPLACE FUNCTION hebrew_dates_jdn(g date) RETURNS bigint
  LANGUAGE sql IMMUTABLE AS $$
    SELECT CASE
      WHEN g >= DATE '1582-10-15' THEN (g - DATE '1582-10-15')::bigint + ${JDN_1582_10_15}
      ELSE (
        SELECT (d + (153 * mm + 2) / 5 + 365 * yy + yy / 4 - 32083)::bigint
        FROM (
          SELECT d, m + 12 * a - 3 AS mm, ay + 4800 - a AS yy
          FROM (
            SELECT
              EXTRACT(DAY   FROM g)::int AS d,
              EXTRACT(MONTH FROM g)::int AS m,
              (14 - EXTRACT(MONTH FROM g)::int) / 12 AS a,
              CASE WHEN EXTRACT(YEAR FROM g)::int < 0
                   THEN EXTRACT(YEAR FROM g)::int + 1     -- Postgres: 1 BC = -1; astronomical 1 BC = 0
                   ELSE EXTRACT(YEAR FROM g)::int END AS ay
          ) s1
        ) s2
      )
    END
  $$;
`

// exactly the rows this migration inserts (there were no BC Feb 29 rows before it)
const NEW_ROWS_WHERE = `hd.gregorian >= DATE '4004-01-01 BC' AND hd.gregorian < DATE '0001-01-01'
  AND EXTRACT(MONTH FROM hd.gregorian) = 2 AND EXTRACT(DAY FROM hd.gregorian) = 29`

const rowCount = (meta) => (typeof meta === 'number' ? meta : Number((meta && meta.rowCount) || 0))

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const sequelize = queryInterface.sequelize
    const t = await sequelize.transaction()
    const select = (sql, replacements = {}) =>
      sequelize.query(sql, { replacements, type: Sequelize.QueryTypes.SELECT, transaction: t })
    const run = (sql, replacements = {}) => sequelize.query(sql, { replacements, transaction: t })
    const one = async (sql, replacements) => (await select(sql, replacements))[0]
    const assert = (cond, msg) => { if (!cond) throw new Error(`[leap-day migration] assertion failed: ${msg}`) }
    const log = (...a) => console.log('[leap-day migration]', ...a)

    try {
      // one transaction holding a 2.2M-row UPDATE through a SQL function and two 2.2M-row window
      // sorts — never let a server-side statement_timeout kill it halfway
      await run('SET LOCAL statement_timeout = 0;')
      await run(`SET LOCAL lock_timeout = '30s';`)
      await run(`SET LOCAL work_mem = '128MB';`)

      /* ── 0. baseline & preconditions ─────────────────────────────── */
      const before = await one(`
        SELECT count(*)::bigint AS rows,
               (SELECT day_index FROM hebrew_dates WHERE gregorian = DATE '1582-10-15') AS anchor,
               (SELECT day_index FROM hebrew_dates WHERE gregorian = DATE '2024-01-01') AS modern,
               (SELECT max(gregorian) FROM hebrew_dates) AS last_date,
               (SELECT day_index FROM hebrew_dates WHERE gregorian = (SELECT max(gregorian) FROM hebrew_dates)) AS last_index
        FROM hebrew_dates;`)
      assert(Number(before.anchor) === DAY_INDEX_1582_10_15,
        `expected day_index(1582-10-15) = ${DAY_INDEX_1582_10_15}, found ${before.anchor}; this migration assumes the original row numbering`)
      log(`rows before: ${before.rows}; anchor 1582-10-15 = ${before.anchor}; 2024-01-01 = ${before.modern}; last = ${before.last_date} @ ${before.last_index}`)

      // NULLs would slip through every later comparison (NULL <> x is never counted)
      const nulls = await one(`SELECT count(*)::int AS n FROM hebrew_dates
        WHERE gregorian IS NULL OR day_of_week IS NULL OR day_index IS NULL OR dd IS NULL OR mm IS NULL OR yy IS NULL;`)
      assert(nulls.n === 0, `${nulls.n} hebrew_dates rows with NULL columns`)
      // a UNIQUE index on day_index would make the single-statement renumber fail on transient duplicates
      const uniq = await select(`SELECT indexname FROM pg_indexes
        WHERE tablename = 'hebrew_dates' AND indexdef ILIKE 'CREATE UNIQUE%' AND indexdef ILIKE '%day_index%';`)
      assert(uniq.length === 0, `drop the unique index on hebrew_dates.day_index before running (${uniq.map((u) => u.indexname).join(', ')}); recreate it afterwards`)

      /* ── 1. insert the storable missing BC leap days ─────────────── */
      const years = missingStorableBcLeapYears()
      assert(years.length === 971, `expected 971 storable BC leap years, computed ${years.length}`)
      const existing = await select(`SELECT to_char(gregorian, 'YYYY')::int AS bc FROM hebrew_dates hd WHERE ${NEW_ROWS_WHERE};`)
      const have = new Set(existing.map((r) => Number(r.bc)))
      const rows = years.filter((bc) => !have.has(bc)).map(buildBcLeapRow)
      log(`BC leap rows to insert: ${rows.length} (already present: ${have.size})`)

      if (rows.length) {
        // each new Hebrew date must be new: a duplicate would mean the neighbours already cover it
        const dup = await one(`
          SELECT count(*)::int AS n FROM hebrew_dates hd
          JOIN (SELECT * FROM json_to_recordset(CAST(:rows AS json)) AS r(yy int, mm int, dd int)) r
            ON r.yy = hd.yy AND r.mm = hd.mm AND r.dd = hd.dd;`,
          { rows: JSON.stringify(rows.map(({ yy, mm, dd }) => ({ yy, mm, dd }))) })
        assert(dup.n === 0, `${dup.n} of the new Hebrew dates already exist`)

        // pin the label convention and the +243 shift: every new row's Feb 28 neighbour must equal
        // Fourmilab(+HEBREW_EPOCH_SHIFT) read as a Julian date, exactly as buildBcLeapRow reads Feb 29
        const feb28 = await select(`
          SELECT to_char(hd.gregorian, 'YYYY')::int AS bc, hd.yy, hd.mm, hd.dd, hd.day_of_week
          FROM hebrew_dates hd
          WHERE hd.gregorian < DATE '0001-01-01' AND EXTRACT(MONTH FROM hd.gregorian) = 2 AND EXTRACT(DAY FROM hd.gregorian) = 28
            AND to_char(hd.gregorian, 'YYYY')::int IN (:years);`, { years: rows.map((r) => Number(r.gregorian.slice(0, 4))) })
        assert(feb28.length === rows.length, `expected ${rows.length} Feb 28 neighbours, found ${feb28.length}`)
        const badNeighbours = feb28.filter((n) => {
          const d = fourmilabJulian(Number(n.bc), 2, 28)
          return d.hebrew.year.value + HEBREW_EPOCH_SHIFT !== n.yy || d.hebrew.month.selectedIndex + 1 !== n.mm
            || d.hebrew.day.value !== n.dd || d.gregorian.wday.value !== n.day_of_week
        })
        assert(badNeighbours.length === 0,
          `Feb 28 neighbours disagree with Fourmilab(+${HEBREW_EPOCH_SHIFT}) / Julian reading: ${JSON.stringify(badNeighbours.slice(0, 3))}`)

        const BATCH = 500
        for (let i = 0; i < rows.length; i += BATCH) {
          await queryInterface.bulkInsert('hebrew_dates', rows.slice(i, i + BATCH), { transaction: t })
        }
      }

      /* ── 2. day_index from the Julian Day Number, every row ───────── */
      await run(JDN_FUNCTION_SQL)
      await run(`UPDATE hebrew_dates SET day_index = hebrew_dates_jdn(gregorian) - ${JDN_OFFSET}
                  WHERE day_index IS DISTINCT FROM hebrew_dates_jdn(gregorian) - ${JDN_OFFSET};`)

      /* ── 3. prove it before committing ────────────────────────────── */
      const after = await one(`
        SELECT count(*)::bigint AS rows,
               (SELECT day_index FROM hebrew_dates WHERE gregorian = DATE '1582-10-15') AS anchor,
               (SELECT day_index FROM hebrew_dates WHERE gregorian = DATE '2024-01-01') AS modern,
               (SELECT day_index FROM hebrew_dates WHERE gregorian = CAST(:last_date AS DATE)) AS last_index
        FROM hebrew_dates;`, { last_date: before.last_date })
      assert(Number(after.rows) === Number(before.rows) + rows.length, `row count ${after.rows} != ${before.rows} + ${rows.length}`)
      assert(Number(after.anchor) === DAY_INDEX_1582_10_15, `anchor moved to ${after.anchor}`)
      assert(String(after.modern) === String(before.modern), `2024-01-01 moved ${before.modern} -> ${after.modern}`)
      assert(String(after.last_index) === String(before.last_index), `last row moved ${before.last_index} -> ${after.last_index}`)

      // 3a. weekday of every row agrees with its JDN (Sunday when (JDN + 1) % 7 = 0)
      const wd = await one(`
        SELECT count(*)::int AS bad FROM hebrew_dates
        WHERE day_of_week <> (ARRAY['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'])
                             [((day_index + ${JDN_OFFSET} + 1) % 7) + 1];`)
      assert(wd.bad === 0, `${wd.bad} rows whose weekday disagrees with their new day_index`)

      // 3b. consecutive rows step by exactly 1, except the 42 unstorable holes (step 2)
      const steps = await select(`
        WITH s AS (SELECT gregorian, day_index - lag(day_index) OVER (ORDER BY day_index) AS step FROM hebrew_dates)
        SELECT step, count(*)::int AS n FROM s WHERE step IS NOT NULL GROUP BY step ORDER BY step;`)
      const stepMap = Object.fromEntries(steps.map((r) => [String(r.step), r.n]))
      assert(Object.keys(stepMap).every((k) => k === '1' || k === '2'), `unexpected index steps: ${JSON.stringify(stepMap)}`)
      assert(stepMap['2'] === 42, `expected exactly 42 two-day steps (the unstorable Julian leap days), found ${stepMap['2'] || 0}`)
      const holes = await select(`
        WITH s AS (SELECT gregorian, day_index - lag(day_index) OVER (ORDER BY day_index) AS step FROM hebrew_dates)
        SELECT to_char(gregorian, 'YYYY')::int AS y, gregorian < DATE '0001-01-01' AS bc,
               EXTRACT(MONTH FROM gregorian)::int AS m, EXTRACT(DAY FROM gregorian)::int AS d
        FROM s WHERE step = 2 ORDER BY gregorian;`)
      const expectedHoles = new Set([
        ...AD_HOLES.map((y) => `${y} AD`),
        ...unstorableBcLeapYears().map((y) => `${y} BC`)
      ])
      const foundHoles = new Set(holes.map((h) => `${h.y} ${h.bc ? 'BC' : 'AD'}`))
      assert(holes.every((h) => h.m === 3 && h.d === 1), 'a two-day step is not at Mar 1')
      assert(expectedHoles.size === 42 && foundHoles.size === 42 && [...expectedHoles].every((h) => foundHoles.has(h)),
        `holes differ from the 42 expected: ${[...foundHoles].join(', ')}`)

      // 3c. known spans, inclusive of the first day
      const span = async (a, b) => {
        const r = await one(`
          SELECT (SELECT day_index FROM hebrew_dates WHERE gregorian = CAST(:b AS DATE)) -
                 (SELECT day_index FROM hebrew_dates WHERE gregorian = CAST(:a AS DATE)) + 1 AS d;`, { a, b })
        return Number(r.d)
      }
      const expectSpan = async (a, b, n) => { const d = await span(a, b); assert(d === n, `${a} -> ${b}: ${d}, expected ${n}`) }
      await expectSpan('0070-08-04', '2063-10-24', 728012)   // 2nd Temple destruction -> Rapture 2063
      await expectSpan('1005-10-27 BC', '1004-09-16 BC', 325) // 1st Temple completed -> jubilee
      await expectSpan('0515-02-09 BC', '0514-09-30 BC', 599) // 2nd Temple completed -> jubilee
      await expectSpan('4004-01-01 BC', '2024-01-01', 2201349)
      await expectSpan('0001-02-28 BC', '0001-03-01 BC', 3)   // Feb 29 of 1 BC now has a row between them
      await expectSpan('0100-02-28', '0100-03-01', 3)         // Feb 29 of 100 AD is a hole, still counted
      await expectSpan('1582-10-04', '1582-10-15', 2)         // the reform: one real day apart

      /* ── 4. shabbat / rosh_chodesh for the new rows ──────────────── */
      const [, hedMeta] = await run(`
        INSERT INTO hebrew_event_dates (hebrew_event, hebrew_date)
        SELECT he.uuid, hd.uuid
        FROM hebrew_dates hd
        JOIN hebrew_events he ON (
             (he.short_name = 'shabbat'      AND hd.day_of_week = 'Saturday')
          OR (he.short_name = 'rosh_chodesh' AND hd.dd = 1)
          OR (he.short_name = 'pesach'       AND hd.mm = 1 AND hd.dd = 14)
          OR (he.short_name = 'matzot'       AND hd.mm = 1 AND hd.dd BETWEEN 15 AND 21)
          OR (he.short_name = 'yom_teruah'   AND hd.mm = 7 AND hd.dd = 1)
          OR (he.short_name = 'yom_kippur'   AND hd.mm = 7 AND hd.dd = 10)
          OR (he.short_name = 'sukkot'       AND hd.mm = 7 AND hd.dd BETWEEN 15 AND 22)
          OR (he.short_name = 'tisha_bav'    AND hd.mm = 5 AND hd.dd = 9)
          OR (he.short_name = 'chanukkah'    AND (
                (hd.mm = 9 AND hd.dd BETWEEN 25 AND 30) OR (hd.mm = 10 AND hd.dd IN (1, 2))
                OR (hd.mm = 10 AND hd.dd = 3 AND NOT EXISTS (SELECT 1 FROM hebrew_dates k WHERE k.yy = hd.yy AND k.mm = 9 AND k.dd = 30))))
        )
        WHERE ${NEW_ROWS_WHERE}
          AND NOT EXISTS (SELECT 1 FROM hebrew_event_dates x WHERE x.hebrew_event = he.uuid AND x.hebrew_date = hd.uuid);`)
      // a Julian Feb 29 BC always falls in Shevat / Adar / Adar II, so only shabbat and rosh_chodesh can match
      const hedAdded = rowCount(hedMeta)
      const expectHed = rows.filter((r) => r.day_of_week === 'Saturday').length + rows.filter((r) => r.dd === 1).length
      assert(hedAdded === expectHed, `hebrew_event_dates inserted ${hedAdded}, expected ${expectHed} (shabbat + rosh_chodesh)`)
      const multi = await one(`
        SELECT count(*)::int AS n FROM hebrew_event_dates hed
        JOIN hebrew_dates hd ON hd.uuid = hed.hebrew_date
        JOIN hebrew_events he ON he.uuid = hed.hebrew_event
        WHERE ${NEW_ROWS_WHERE} AND he.short_name IN ('sukkot', 'matzot', 'chanukkah');`)
      assert(multi.n === 0, `${multi.n} new rows fall inside a multi-day feast — not expected for a Feb 29`)
      log(`hebrew_event_dates added for new rows: ${hedAdded}`)

      await t.commit()
      log(`committed: +${rows.length} rows, day_index recomputed for all ${after.rows} rows, 42 unstorable holes remain (counted). events/events_entry/events_pairs untouched by design.`)
    } catch (err) {
      // a failed commit() already marks t finished; rollback() would then throw and hide the real error
      if (!t.finished) await t.rollback().catch((e) => console.error('[leap-day migration] rollback failed:', e.message))
      console.error('[leap-day migration] rolled back:', err.message)
      throw err
    }
  },

  down: async (queryInterface, Sequelize) => {
    const sequelize = queryInterface.sequelize
    const t = await sequelize.transaction()
    const run = (sql, replacements = {}) => sequelize.query(sql, { replacements, transaction: t })
    try {
      await run('SET LOCAL statement_timeout = 0;')
      // refuse rather than destroy user entries created on the inserted days
      const [[ref]] = await sequelize.query(
        `SELECT count(*)::int AS n FROM events_entry ee JOIN hebrew_dates hd ON hd.uuid = ee.hebrew_date WHERE ${NEW_ROWS_WHERE};`,
        { transaction: t })
      if (ref.n) throw new Error(`[leap-day migration] cannot undo: ${ref.n} events_entry rows reference the inserted Feb 29 BC dates; remove them first`)
      await run(`DELETE FROM hebrew_event_dates hed USING hebrew_dates hd WHERE hed.hebrew_date = hd.uuid AND ${NEW_ROWS_WHERE};`)
      await run(`DELETE FROM hebrew_dates hd WHERE ${NEW_ROWS_WHERE};`)
      // restore the original row-counter numbering, anchored at 1582-10-15 = 577726
      await run(`
        WITH r AS (SELECT uuid, gregorian, ROW_NUMBER() OVER (ORDER BY gregorian) AS rn FROM hebrew_dates),
             a AS (SELECT rn AS anchor_rn FROM r WHERE gregorian = DATE '1582-10-15')
        UPDATE hebrew_dates hd SET day_index = r.rn - a.anchor_rn + ${DAY_INDEX_1582_10_15}
        FROM r, a WHERE r.uuid = hd.uuid AND hd.day_index <> r.rn - a.anchor_rn + ${DAY_INDEX_1582_10_15};`)
      await run('DROP FUNCTION IF EXISTS hebrew_dates_jdn(date);')
      await t.commit()
    } catch (err) {
      if (!t.finished) await t.rollback().catch((e) => console.error('[leap-day migration] rollback failed:', e.message))
      throw err
    }
  },

  // exposed for tests
  __helpers: { jdnJulian, missingStorableBcLeapYears, unstorableBcLeapYears, buildBcLeapRow, fourmilabJulian, JDN_OFFSET, AD_HOLES, WEEKDAYS }
}
