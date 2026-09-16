'use strict';

/**
 * The cycles engine (src/utils/analysis.js) scores every pair: rungs of 8190 (k + r/d),
 * classic periods, and the Hebrew-year layer, each with a signed offset up to ±3 days.
 * This stores that result on events_pairs so lists can filter and sort on it in SQL:
 *   analysis         JSONB   the full result (hits, rung position, best label …)
 *   score            NUMERIC the pair's score at ±3 days (re-scored per request for tighter tolerances)
 *   analysis_version INT     bump ANALYSIS_VERSION in the engine and re-run `yarn analyze:pairs`
 *   hebrew_years     INT     |yy_b − yy_a|
 *   same_month_day   BOOL    same Hebrew month and day
 * and backfills every existing pair.
 */
const analysis = require('../../src/utils/analysis.js')

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const q = (sql, opts) => queryInterface.sequelize.query(sql, opts)
    await q(`ALTER TABLE events_pairs
      ADD COLUMN IF NOT EXISTS analysis JSONB,
      ADD COLUMN IF NOT EXISTS score NUMERIC(8,2) NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS analysis_version INTEGER NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS hebrew_years INTEGER,
      ADD COLUMN IF NOT EXISTS same_month_day BOOLEAN NOT NULL DEFAULT false;`)
    await q('CREATE INDEX IF NOT EXISTS events_pairs_score_idx ON events_pairs (score DESC);')
    await q('CREATE INDEX IF NOT EXISTS events_pairs_hebrew_years_idx ON events_pairs (hebrew_years);')

    const rows = await q(
      `SELECT p.uuid, ha.day_index AS a_day_index, ha.yy AS a_yy, ha.mm AS a_mm, ha.dd AS a_dd,
              hb.day_index AS b_day_index, hb.yy AS b_yy, hb.mm AS b_mm, hb.dd AS b_dd
         FROM events_pairs p
         JOIN events ea ON ea.uuid = p.a JOIN hebrew_dates ha ON ha.uuid = ea.hebrew_date
         JOIN events eb ON eb.uuid = p.b JOIN hebrew_dates hb ON hb.uuid = eb.hebrew_date;`,
      { type: Sequelize.QueryTypes.SELECT }
    )
    for (const r of rows) {
      const a = { day_index: r.a_day_index, yy: r.a_yy, mm: r.a_mm, dd: r.a_dd }
      const b = { day_index: r.b_day_index, yy: r.b_yy, mm: r.b_mm, dd: r.b_dd }
      const result = analysis.analyzePair(a, b)
      await q(
        `UPDATE events_pairs SET analysis = :analysis::jsonb, score = :score, analysis_version = :version,
                hebrew_years = :hy, same_month_day = :smd WHERE uuid = :uuid;`,
        {
          replacements: {
            uuid: r.uuid,
            analysis: JSON.stringify(result),
            score: result.score,
            version: analysis.ANALYSIS_VERSION,
            hy: result.hebrew_years,
            smd: result.same_month_day
          }
        }
      )
    }
    console.log(`[pair-analysis] analysed ${rows.length} pairs (engine v${analysis.ANALYSIS_VERSION})`)
  },

  down: async (queryInterface) => {
    const q = (sql) => queryInterface.sequelize.query(sql)
    await q('DROP INDEX IF EXISTS events_pairs_score_idx;')
    await q('DROP INDEX IF EXISTS events_pairs_hebrew_years_idx;')
    await q(`ALTER TABLE events_pairs
      DROP COLUMN IF EXISTS analysis, DROP COLUMN IF EXISTS score, DROP COLUMN IF EXISTS analysis_version,
      DROP COLUMN IF EXISTS hebrew_years, DROP COLUMN IF EXISTS same_month_day;`)
  }
}
