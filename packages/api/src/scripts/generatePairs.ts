/**
 * Create every interesting pair the cycles engine can find among the events.
 *
 *   yarn pairs:generate                       # the standing rule: score ≥ 4.5 at ±3 days, favorite ≥ 6; skip existing pairs
 *   yarn pairs:generate --min-score 6 --tol 1 --favorite 8
 *   yarn pairs:generate --reset               # delete every existing pair first
 *   yarn pairs:generate --dry-run             # print what would be created, change nothing
 *
 * The same generation runs automatically (for the one event involved) whenever an event is
 * created or re-dated through the API, so this script is for a full sweep or a reset.
 */
import Models from '@api/models'
import { generatePairs, GENERATE_DEFAULTS } from '@api/models/EventsPairs/methods'

const arg = (name: string, fallback?: string) => {
  const i = process.argv.indexOf(`--${name}`)
  return i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : fallback
}
const flag = (name: string) => process.argv.includes(`--${name}`)

const run = async () => {
  const dry = flag('dry-run')
  const reset = flag('reset')
  if (reset && !dry) {
    const n = await Models.EventsPairs.destroy({ where: {} })
    console.log(`[pairs:generate] deleted ${n} existing pairs`)
  }
  const out = await generatePairs({
    minScore: Number(arg('min-score', String(GENERATE_DEFAULTS.minScore))),
    tol: Number(arg('tol', String(GENERATE_DEFAULTS.tol))),
    favoriteAt: arg('favorite') ? Number(arg('favorite')) : GENERATE_DEFAULTS.favoriteAt,
    dryRun: dry,
    log: (line) => console.log(line.startsWith('  ') ? line : `[pairs:generate] ${line}`)
  })
  console.log(dry ? `[pairs:generate] dry run — nothing created` : `[pairs:generate] created ${out.created} pairs, favorited ${out.favorited}`)
  await Models.sequelize.close()
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
