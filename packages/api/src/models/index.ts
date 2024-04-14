import Sequelize from 'sequelize'
import { logger } from '@api/utils/logger'

import HebrewDatesModel from './HebrewDates'
import HebrewEventsModel from './HebrewEvents'
import HebrewEventDatesModel from './HebrewEventDates'

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

const HebrewDates = HebrewDatesModel(sequelize)
const HebrewEvents = HebrewEventsModel(sequelize)
const HebrewEventDates = HebrewEventDatesModel(sequelize)


HebrewEventDates.belongsTo(HebrewDates, {
  foreignKey: 'hebrew_date',
  as: 'hebrewDate'  
});
HebrewEventDates.belongsTo(HebrewEvents, {
  foreignKey: 'hebrew_event',
  as: 'event'  
});

HebrewDates.hasMany(HebrewEventDates, {
  foreignKey: 'hebrew_date',
  as: 'events'  
});
HebrewEvents.hasMany(HebrewEventDates, {
  foreignKey: 'hebrew_event',
  as: 'eventDates'  
});

export default {
  Sequelize,
  sequelize,
  HebrewDates,
  HebrewEvents,
  HebrewEventDates
}
