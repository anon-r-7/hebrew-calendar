/**
 * Create every interesting pair the cycles engine can find among the events.
 *
 *   yarn pairs:generate                       # score ≥ 5.5 at ±2 days, skip pairs that already exist
 *   yarn pairs:generate --min-score 3 --tol 1
 *   yarn pairs:generate --reset               # delete every existing pair first
 *   yarn pairs:generate --dry-run             # print what would be created, change nothing
 *   yarn pairs:generate --favorite 8          # also favorite anything scoring ≥ 8 (whole rungs)
 *
 * Pairs are created earlier → later. Existing pairs (either direction) are left alone unless
 * --reset. Prints the ranked list it created (or would create).
 */
import Models from '@api/models'
import { listEvents } from '@api/models/Events/methods'
import { createPair } from '@api/models/EventsPairs/methods'
import { QueryTypes } from 'sequelize'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const engine = require('@api/utils/analysis.js')

const arg = (name: string, fallback?: string) => {
  const i = process.argv.indexOf(`--${name}`)
  return i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : fallback
}
const flag = (name: string) => process.argv.includes(`--${name}`)

const run = async () => {
  const minScore = Number(arg('min-score', '5.5'))
  const tol = Math.min(Math.max(Number(arg('tol', '2')), 0), engine.MAX_TOL)
  const favoriteAt = arg('favorite') ? Number(arg('favorite')) : null
  const dry = flag('dry-run')
  const reset = flag('reset')

  if (reset && !dry) {
    const n = await Models.EventsPairs.destroy({ where: {} })
    console.log(`[pairs:generate] deleted ${n} existing pairs`)
  }
  const existing: any[] = reset && !dry ? [] : await Models.sequelize.query('SELECT a, b FROM events_pairs;', { type: QueryTypes.SELECT })
  const taken = new Set(existing.map((p) => [p.a, p.b].sort().join('|')))

  const events = (await listEvents()).sort((x, y) => Number(x.day_index) - Number(y.day_index))
  const found: { a: any; b: any; analysis: any }[] = []
  for (let i = 0; i < events.length; i++) {
    for (let j = i + 1; j < events.length; j++) {
      const a = events[i]
      const b = events[j]
      if (taken.has([a.uuid, b.uuid].sort().join('|'))) continue
      const analysis = engine.analyzePair(a, b, tol)
      if (analysis.score >= minScore) found.push({ a, b, analysis })
    }
  }
  found.sort((x, y) => y.analysis.score - x.analysis.score)
  console.log(`[pairs:generate] ${events.length} events, ${(events.length * (events.length - 1)) / 2} spans, ${found.length} with score ≥ ${minScore} at ±${tol}d${taken.size ? ` (${taken.size} existing pairs skipped)` : ''}`)

  let created = 0
  let favorited = 0
  for (const f of found) {
    const line = `  ${f.analysis.score.toFixed(2).padStart(6)}  ${f.a.name.slice(0, 34).padEnd(34)} → ${f.b.name.slice(0, 34).padEnd(34)}  ${f.analysis.best}`
    console.log(line)
    if (dry) continue
    const pair = await createPair({ a: f.a.uuid, b: f.b.uuid, include_first_day: false, created_by: null })
    created++
    if (favoriteAt !== null && f.analysis.score >= favoriteAt && pair) {
      await Models.EventsPairs.update({ favorite: true }, { where: { uuid: pair.uuid } })
      favorited++
    }
  }
  console.log(dry ? `[pairs:generate] dry run — nothing created` : `[pairs:generate] created ${created} pairs${favoriteAt !== null ? `, favorited ${favorited}` : ''}`)
  await Models.sequelize.close()
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
