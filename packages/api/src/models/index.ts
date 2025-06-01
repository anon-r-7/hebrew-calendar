import Sequelize from 'sequelize'
import { logger } from '@api/utils/logger'

/* ───────── model factories ───────── */
import HebrewDatesModel from './HebrewDates'
import HebrewEventsModel from './HebrewEvents'
import HebrewEventDatesModel from './HebrewEventDates'
import EventsModel from './Events'
import EventsEntryModel from './EventsEntry'
import EventsPairsModel from './EventsPairs'
import UserModel from './User'
import MoonModel from './Moon'
import SunModel from './Sun'

/* ───────── sequelize instance ────── */
export const sequelize = new Sequelize.Sequelize(
  process.env.POSTGRES_DB!,
  process.env.POSTGRES_USER!,
  process.env.POSTGRES_PASSWORD!,
  {
    host: process.env.DB_ENDPOINT,
    dialect: 'postgres',
    timezone: '-5:00',
    logging: true
  }
)

sequelize
  .authenticate()
  .then(() => logger.info('Connection has been established successfully.'))
  .catch((err) => logger.error(`Unable to connect: ${err}`))

/* ───────── model init  ───────────── */
export const HebrewDates = HebrewDatesModel(sequelize)
export const HebrewEvents = HebrewEventsModel(sequelize)
export const HebrewEventDates = HebrewEventDatesModel(sequelize)
export const Events = EventsModel(sequelize)
export const EventsEntry = EventsEntryModel(sequelize)
export const EventsPairs = EventsPairsModel(sequelize)
export const User = UserModel(sequelize)
export const Moon = MoonModel(sequelize)
export const Sun = SunModel(sequelize)

/* ───────── associations ──────────── */

/* HebrewEvents ↔ HebrewEventDates  (1-M) */
HebrewEvents.hasMany(HebrewEventDates, {
  foreignKey: 'hebrew_event',
  as: 'eventDates'
})
HebrewEventDates.belongsTo(HebrewEvents, {
  foreignKey: 'hebrew_event',
  as: 'event'
})

/* HebrewDates  ↔ HebrewEventDates  (1-M) */
HebrewDates.hasMany(HebrewEventDates, {
  foreignKey: 'hebrew_date',
  as: 'events'
})
HebrewEventDates.belongsTo(HebrewDates, {
  foreignKey: 'hebrew_date',
  as: 'hebrewDate'
})

/* Users ↔ EventsEntry (1-M) */
User.hasMany(EventsEntry, { foreignKey: 'created_by', as: 'entries' })
EventsEntry.belongsTo(User, { foreignKey: 'created_by', as: 'creator' })

/* HebrewDates ↔ EventsEntry (1-M) */
HebrewDates.hasMany(EventsEntry, { foreignKey: 'hebrew_date', as: 'entries' })
EventsEntry.belongsTo(HebrewDates, {
  foreignKey: 'hebrew_date',
  as: 'hebrewDateEntry'
})

/* Events  ↔ EventsPairs (self-ref 1-M through a / b) */
Events.hasMany(EventsPairs, { foreignKey: 'a', as: 'pairsAsA' })
Events.hasMany(EventsPairs, { foreignKey: 'b', as: 'pairsAsB' })
EventsPairs.belongsTo(Events, { foreignKey: 'a', as: 'eventA' })
EventsPairs.belongsTo(Events, { foreignKey: 'b', as: 'eventB' })

/* ───────── exports ───────────────── */
export default {
  Sequelize,
  sequelize,

  /* new models */
  User,
  Events,
  EventsEntry,
  EventsPairs,

  /* existing models */
  HebrewDates,
  HebrewEvents,
  HebrewEventDates,
  Moon,
  Sun
}
