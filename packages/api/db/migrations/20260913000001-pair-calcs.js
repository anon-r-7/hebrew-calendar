'use strict';

/**
 * Persist the date maths on events_pairs so pairs can be filtered and sorted server-side
 * (whole weeks, divisible by 7, more than N new moons, ...). Written on pair creation and
 * recomputed for every pair an event belongs to when that event's date changes.
 * Same arithmetic as src/utils/breakdown.ts.
 */

const COLUMNS = {
  days: 'BIGINT', half_days: 'BIGINT', weeks: 'NUMERIC(14,6)',
  years_364: 'NUMERIC(14,6)', months_364: 'NUMERIC(14,6)',
  years_360: 'NUMERIC(14,6)', months_360: 'NUMERIC(14,6)',
  years_civil: 'INTEGER', new_moons: 'INTEGER', new_moons_fraction: 'NUMERIC(14,6)',
  new_moon_years: 'NUMERIC(14,6)', new_moon_years_fraction: 'NUMERIC(14,6)'
}

module.exports = {
  up: async (queryInterface) => {
    const q = (sql) => queryInterface.sequelize.query(sql)
    for (const [col, type] of Object.entries(COLUMNS)) {
      await q(`ALTER TABLE events_pairs ADD COLUMN IF NOT EXISTS ${col} ${type};`)
    }
    for (const col of ['days', 'weeks', 'new_moons', 'new_moons_fraction', 'years_civil']) {
      await q(`CREATE INDEX IF NOT EXISTS events_pairs_${col}_idx ON events_pairs (${col});`)
    }
    await q('CREATE INDEX IF NOT EXISTS events_pairs_a_idx ON events_pairs (a);')
    await q('CREATE INDEX IF NOT EXISTS events_pairs_b_idx ON events_pairs (b);')

    // backfill existing pairs
    await q(`
      WITH x AS (
        SELECT p.uuid,
               (CASE WHEN p.include_first_day THEN 1 ELSE 0 END) AS first,
               ha.day_index AS a_di, hb.day_index AS b_di,
               ha.month_index AS a_mi, hb.month_index AS b_mi,
               ha.yy AS a_yy, hb.yy AS b_yy, ha.dd AS a_dd, hb.dd AS b_dd,
               (SELECT max(dd) FROM hebrew_dates m WHERE m.month_index = ha.month_index) AS a_len,
               (SELECT max(dd) FROM hebrew_dates m WHERE m.month_index = hb.month_index) AS b_len
        FROM events_pairs p
        JOIN events ea ON ea.uuid = p.a JOIN hebrew_dates ha ON ha.uuid = ea.hebrew_date
        JOIN events eb ON eb.uuid = p.b JOIN hebrew_dates hb ON hb.uuid = eb.hebrew_date
      ), c AS (
        SELECT uuid,
               abs(b_di - a_di) + first AS days,
               abs(b_mi - a_mi) + first AS new_moons,
               abs((b_mi + (b_dd - 1)::numeric / b_len) - (a_mi + (a_dd - 1)::numeric / a_len)) + first AS nmf,
               abs(b_yy - a_yy) AS years_civil
        FROM x
      )
      UPDATE events_pairs p SET
        days = c.days, half_days = c.days * 2, weeks = c.days / 7.0,
        years_364 = c.days / 364.0, months_364 = c.days * 12 / 364.0,
        years_360 = c.days / 360.0, months_360 = c.days / 30.0,
        years_civil = c.years_civil, new_moons = c.new_moons, new_moons_fraction = c.nmf,
        new_moon_years = c.new_moons / 12.0, new_moon_years_fraction = c.nmf / 12.0
      FROM c WHERE c.uuid = p.uuid;`)
  },

  down: async (queryInterface) => {
    const q = (sql) => queryInterface.sequelize.query(sql)
    for (const col of Object.keys(COLUMNS)) await q(`ALTER TABLE events_pairs DROP COLUMN IF EXISTS ${col};`)
  }
}
