import { logger } from '@api/utils/logger'
import App from '@api/App'

process.on('unhandledRejection', (err) => {
  logger.error('[unhandledRejection]', err)
})

process.on('uncaughtException', (err) => {
  logger.error('[uncaughtException]', err)
})

const Init = async () => {
  try {
    const requiredEnvs = ['TZ']
    requiredEnvs.forEach((env) => {
      if (!process.env[env]) throw new Error(`process.env.${env} not defined`)
    })
  } catch (error) {
    return logger.error(error)
  }

  try {
    logger.info('[App] starting')
    return App()
  } catch (error) {
    logger.error(error)
  }
}

Init()
