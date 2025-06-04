import express, { Request, Response, NextFunction } from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import morgan from 'morgan'
import Routes from '@api/routes'
import { logger } from '@api/utils/logger'

const port = process.env.SERVER_PORT ? process.env.SERVER_PORT : 5000

export default () => {
  const app = express()

  app.use(
    cors({
      origin: [
        'https://hebrewfeasts.com',
        'https://admin.hebrewfeasts.com',
        'http://localhost:3006'
      ],
      credentials: true
    })
  )

  app.use(bodyParser.json())

  app.use(
    morgan('combined', {
      immediate: true,
      stream: {
        write: (message: string) => logger.info(message.trim())
      }
    })
  )

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
    logger.error(`Error: ${err.stack}`)
    res.status(500).send('Fatal request error.')
  })

  Routes.forEach((route, idx) => {
    if (!route.router) throw new Error(`Route at index ${idx} has no router`)
    app.use('/v1/', route.router)
  })

  app.listen(port, async () => {
    logger.info(`[App] running on port ${port}`)
    logger.info('[App] ready')
  })
}
