/**
 * Run a full event sync from the command line and exit.
 *
 *   yarn resync
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

  const started = Date.now()
  const result = await runSync()
  const totalSec = Math.round((Date.now() - started) / 1000)

  console.log(
    JSON.stringify(
      {
        systemInserted: result.systemInserted,
        userProcessed: result.processedCount,
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
