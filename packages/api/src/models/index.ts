import Sequelize from 'sequelize'
import { logger } from '@api/utils/logger'

import HebrewDatesModel from './HebrewDates'
import HebrewEventsModel from './HebrewEvents'

const host = process.env.DB_ENDPOINT
const database = process.env.POSTGRES_DB
const user = process.env.POSTGRES_USER
const password = process.env.POSTGRES_PASSWORD

const sequelize = new Sequelize.Sequelize(database, user, password, {
  host,
  dialect: 'postgres',
  timezone: '-5:00',
  logging: process.env.SHOULD_LOG_DATABASE === 'true'
})

sequelize
  .authenticate()
  .then(() => {
    logger.info('Connection has been established successfully.')
  })
  .catch((err) => {
    logger.error(
      `Unable to connect to the database: ${JSON.stringify({ err })}`
    )
  })

export default {
  Sequelize,
  sequelize,
  HebrewDates: HebrewDatesModel(sequelize),
  HebrewEvents: HebrewEventsModel(sequelize)
}
