import Sequelize from 'sequelize'
import { logger } from '@api/utils/logger'

/* ───────── validate env ───────── */
const requiredEnvVars = [
  'POSTGRES_DB',
  'POSTGRES_USER',
  'POSTGRES_PASSWORD',
  'DB_ENDPOINT'
]
requiredEnvVars.forEach((key) => {
  if (!process.env[key]) {
    logger.error(`[models] Missing required env var: ${key}`)
    process.exit(1)
  }
})

/* ───────── initialize Sequelize ───────── */
let sequelize: Sequelize.Sequelize

try {
  sequelize = new Sequelize.Sequelize(
    process.env.POSTGRES_DB!,
    process.env.POSTGRES_USER!,
    process.env.POSTGRES_PASSWORD!,
    {
      host: process.env.DB_ENDPOINT,
      port: Number(process.env.DB_PORT || 5432),
      dialect: 'postgres',
      timezone: '-5:00',
      // eslint-disable-next-line
      // logging: (msg) => {
      //   console.log(`[Sequelize] ${new Date().toISOString()} — ${msg}`)
      // }
      logging: true
    }
  )
} catch (err) {
  logger.error('[models] Failed to initialize Sequelize instance', err)
  process.exit(1)
}

/* ───────── test DB connection ───────── */
sequelize
  .authenticate()
  .then(() => logger.info('[models] DB connection established successfully.'))
  .catch((err) => {
    logger.error('[models] Unable to connect to database:', err)
    process.exit(1)
  })

/* ───────── model imports ───────── */
import HebrewDatesModel from './HebrewDates'
import HebrewEventsModel from './HebrewEvents'
import HebrewEventDatesModel from './HebrewEventDates'
import EventsModel from './Events'
import EventsEntryModel from './EventsEntry'
import EventsPairsModel from './EventsPairs'
import UserModel from './User'
import MoonModel from './Moon'
import SunModel from './Sun'

/* ───────── model init ───────── */
let HebrewDates,
  HebrewEvents,
  HebrewEventDates,
  Events,
  EventsEntry,
  EventsPairs,
  User,
  Moon,
  Sun

try {
  HebrewDates = HebrewDatesModel(sequelize)
  HebrewEvents = HebrewEventsModel(sequelize)
  HebrewEventDates = HebrewEventDatesModel(sequelize)
  Events = EventsModel(sequelize)
  EventsEntry = EventsEntryModel(sequelize)
  EventsPairs = EventsPairsModel(sequelize)
  User = UserModel(sequelize)
  Moon = MoonModel(sequelize)
  Sun = SunModel(sequelize)
} catch (err) {
  logger.error('[models] Error initializing models:', err)
  process.exit(1)
}

/* ───────── associations ───────── */
try {
  HebrewEvents.hasMany(HebrewEventDates, {
    foreignKey: 'hebrew_event',
    as: 'eventDates'
  })
  HebrewEventDates.belongsTo(HebrewEvents, {
    foreignKey: 'hebrew_event',
    as: 'event'
  })

  HebrewDates.hasMany(HebrewEventDates, {
    foreignKey: 'hebrew_date',
    as: 'events'
  })
  HebrewEventDates.belongsTo(HebrewDates, {
    foreignKey: 'hebrew_date',
    as: 'hebrewDate'
  })

  User.hasMany(EventsEntry, { foreignKey: 'created_by', as: 'entries' })
  EventsEntry.belongsTo(User, { foreignKey: 'created_by', as: 'creator' })

  HebrewDates.hasMany(EventsEntry, { foreignKey: 'hebrew_date', as: 'entries' })
  EventsEntry.belongsTo(HebrewDates, {
    foreignKey: 'hebrew_date',
    as: 'hebrewDateEntry'
  })

  Events.hasMany(EventsPairs, { foreignKey: 'a', as: 'pairsAsA' })
  Events.hasMany(EventsPairs, { foreignKey: 'b', as: 'pairsAsB' })
  EventsPairs.belongsTo(Events, { foreignKey: 'a', as: 'eventA' })
  EventsPairs.belongsTo(Events, { foreignKey: 'b', as: 'eventB' })

  /* ---------- Events <-> EventsEntry (user-created events) ---------- */
  Events.belongsTo(EventsEntry, {
    foreignKey: 'source_row', // Events.source_row → EventsEntry.uuid
    targetKey: 'uuid',
    as: 'userEntry',
    constraints: false // polymorphic – keep FK flexible
  })
  EventsEntry.hasOne(Events, {
    foreignKey: 'source_row',
    sourceKey: 'uuid',
    as: 'eventRef',
    constraints: false
  })

  /* ---------- Events <-> HebrewEventDates (system events) ---------- */
  Events.belongsTo(HebrewEventDates, {
    foreignKey: 'source_row', // Events.source_row → HebrewEventDates.uuid
    targetKey: 'uuid',
    as: 'systemDate',
    constraints: false
  })
  HebrewEventDates.hasOne(Events, {
    foreignKey: 'source_row',
    sourceKey: 'uuid',
    as: 'eventRef',
    constraints: false
  })
} catch (err) {
  logger.error('[models] Error setting up associations:', err)
  process.exit(1)
}

/* ───────── export models ───────── */
export default {
  Sequelize,
  sequelize,
  User,
  Events,
  EventsEntry,
  EventsPairs,
  HebrewDates,
  HebrewEvents,
  HebrewEventDates,
  Moon,
  Sun
}
