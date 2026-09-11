import { Request, Response } from 'express'
import axios from 'axios'
import { logger } from '@api/utils/logger'

// First-party proxy for Google Analytics (GA4).
//
// Tracker/ad blockers block `googletagmanager.com` and `google-analytics.com`
// outright, so a normal gtag install silently loses those visitors. Serving the
// gtag loader AND its collection hits through our own `api.hebrewfeasts.com/sync/*`
// makes them first-party, which the blocklists don't catch. Deliberately named
// `/sync` (not `/track` / `/analytics`) so it isn't matched by keyword filters.
//
// The UI points gtag at it:
//   <script src="https://api.hebrewfeasts.com/sync/gtag/js?id=G-...">
//   gtag('config', 'G-...', { transport_url: 'https://api.hebrewfeasts.com/sync' })
//
// Mounted in App.ts as:  app.use('/sync', express.raw({ type: '*/*' }), syncHandler)
// (raw body because gtag beacons are text/plain, not JSON).

const GTM = 'https://www.googletagmanager.com'
const GA = 'https://www.google-analytics.com'

export const syncHandler = async (req: Request, res: Response): Promise<void> => {
  // Mounted at /sync, so req.url is the remainder, e.g. "/gtag/js?id=..."
  // (the loader) or "/g/collect?v=2&..." (a hit).
  const sub = req.url || '/'
  const isLoader = sub.startsWith('/gtag')
  const target = (isLoader ? GTM : GA) + sub

  try {
    const upstream = await axios({
      url: target,
      method: req.method as never,
      // Forward the raw beacon body for POST hits; loader/GET have none.
      data:
        req.method === 'GET' || req.method === 'HEAD'
          ? undefined
          : Buffer.isBuffer(req.body) && req.body.length
          ? req.body
          : undefined,
      headers: {
        'user-agent': req.get('user-agent') || '',
        // Pass the real visitor IP (nginx already set X-Forwarded-For) so GA
        // attributes geo/device to the user, not to this server.
        'x-forwarded-for':
          (req.headers['x-forwarded-for'] as string) ||
          req.socket.remoteAddress ||
          '',
        'content-type': req.get('content-type') || 'text/plain;charset=UTF-8',
        accept: '*/*'
      },
      responseType: 'arraybuffer',
      // Never throw on non-2xx (GA replies 204 to hits); just pass it through.
      validateStatus: () => true,
      timeout: 10000,
      maxContentLength: 20 * 1024 * 1024,
      maxBodyLength: 20 * 1024 * 1024
    })

    const contentType = upstream.headers['content-type']
    if (contentType) res.set('content-type', contentType)
    // Let the loader script be cached like Google serves it.
    const cacheControl = upstream.headers['cache-control']
    if (isLoader && cacheControl) res.set('cache-control', cacheControl)

    res.status(upstream.status).send(Buffer.from(upstream.data))
  } catch (err) {
    // Analytics must never break the page — swallow and no-op.
    logger.error(`[sync] proxy error for ${sub}: ${(err as Error).message}`)
    res.status(204).end()
  }
}

export default syncHandler
