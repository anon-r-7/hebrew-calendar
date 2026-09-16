/**
 * Recompute the cycles-engine analysis on pairs.
 *   yarn analyze:pairs          # only pairs whose stored analysis is missing or from an older engine
 *   yarn analyze:pairs --all    # every pair
 */
import Models from '@api/models'
import { recalcPairs, recalcStale } from '@api/models/EventsPairs/methods'

const run = async () => {
  const all = process.argv.includes('--all')
  const n = all ? await recalcPairs() : await recalcStale()
  console.log(`[analyze:pairs] ${all ? 'recomputed' : 'refreshed'} ${n} pair${n === 1 ? '' : 's'}`)
  await Models.sequelize.close()
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
