/**
 * Run an event sync from the command line and exit.
 *
 *   yarn resync                    # system events + user entries; refresh view if it exists
 *   yarn resync --pairs            # also backfill missing events_pairs rows (heavy)
 *   yarn resync --create-view      # also create events_pair_view if it is missing (heavy)
 *
 * Uses the same DB env vars as the API (DB_ENDPOINT, DB_PORT, POSTGRES_DB,
 * POSTGRES_USER, POSTGRES_PASSWORD). Intended for running the sync from a
 * machine with more headroom than the API host, e.g. through an SSH tunnel
 * to production (see resync-prod.sh at the repo root).
 */
import Models from '@api/models'
import { logger } from '@api/utils/logger'
import { runSync } from '@api/services/EventSync'

const main = async () => {
  await Models.sequelize.authenticate()
  logger.info(
    `[resync] connected to ${process.env.POSTGRES_DB}@${
      process.env.DB_ENDPOINT
    }:${process.env.DB_PORT || 5432}`
  )

  const args = process.argv.slice(2)
  const options = {
    pairs: args.includes('--pairs'),
    createView: args.includes('--create-view')
  }
  logger.info(`[resync] options ${JSON.stringify(options)}`)

  const started = Date.now()
  const result = await runSync(options)
  const totalSec = Math.round((Date.now() - started) / 1000)

  console.log(
    JSON.stringify(
      {
        systemInserted: result.systemInserted,
        userProcessed: result.processedCount,
        pairsBackfilled: result.pairsBackfilled,
        viewCreated: result.viewCreated,
        insertMs: result.insertMs,
        refreshMs: result.refreshMs,
        totalSec,
        errors: result.errors
      },
      null,
      2
    )
  )

  await Models.sequelize.close()
  process.exit(result.errors.length ? 1 : 0)
}

main().catch(async (err) => {
  console.error('[resync] fatal:', err)
  try {
    await Models.sequelize.close()
  } catch {}
  process.exit(1)
})
