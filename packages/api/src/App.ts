import express, { Request, Response, NextFunction } from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import morgan from 'morgan'
import Routes from '@api/routes'
import { logger } from '@api/utils/logger'

const port = process.env.SERVER_PORT ? process.env.SERVER_PORT : 5000

export default () => {
  const app = express()

  app.use(cors())
  app.use(bodyParser.json())

  app.use(
    morgan('combined', {
      immediate: true,
      stream: {
        write: (message: string) => logger.info(message.trim())
      }
    })
  )

  // ACME Challenge Route
  app.get('/.well-known/acme-challenge/:token', (req: Request, res: Response) => {
    const acmeTokenResponses: {[key: string]: string} = {
      '3BqoFf6YUWMUA0aoehmdCjweMS3Bkgn4jwl8g0oAUCE': '3BqoFf6YUWMUA0aoehmdCjweMS3Bkgn4jwl8g0oAUCE.aGrO--yVpewzoP8hLcH0GZY4DpWclVgSEOrHfl8BtKI',
      'CNVT0JKDCYIpy9S1TZpEgK0JLui1E_Xr-jWyVVfholA': 'CNVT0JKDCYIpy9S1TZpEgK0JLui1E_Xr-jWyVVfholA.aGrO--yVpewzoP8hLcH0GZY4DpWclVgSEOrHfl8BtKI'
    };
    const tokenResponse = acmeTokenResponses[req.params.token];
    if (tokenResponse) {
      res.type('text/plain').send(tokenResponse);
    } else {
      res.status(404).send('Token not found');
    }
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
    logger.error(`Error: ${err.stack}`)
    res.status(500).send('Fatal request error.')
  })


  Routes.forEach((route) => {
    app.use('/v1/', route.router)
  })

  app.listen(port, async () => {
    logger.info(`[App] running on port ${port}`)
    logger.info('[App] ready')
  })
}
