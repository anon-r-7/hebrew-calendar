import { Model, DataTypes, Sequelize, Optional } from 'sequelize'

export interface EventsPair {
  uuid: string
  a: string
  b: string
  include_first_day: boolean
  favorite?: boolean
  created_by: string | null
  created_at?: Date
  // persisted date maths (see utils/breakdown.ts); filterable server-side
  days?: number
  half_days?: number
  weeks?: number
  years_364?: number
  months_364?: number
  years_360?: number
  months_360?: number
  years_civil?: number
  new_moons?: number
  new_moons_fraction?: number
  new_moon_years?: number
  new_moon_years_fraction?: number
}

export type EventsPairCreation = Optional<EventsPair, 'uuid' | 'created_by' | 'include_first_day'>

export class EventsPairsModel extends Model<EventsPair, EventsPairCreation> implements EventsPair {
  public uuid!: string
  public a!: string
  public b!: string
  public include_first_day!: boolean
  public created_by!: string | null
}

export default (sequelize: Sequelize) => {
  EventsPairsModel.init(
    {
      uuid: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      a: { allowNull: false, type: DataTypes.UUID },
      b: { allowNull: false, type: DataTypes.UUID },
      include_first_day: { allowNull: false, type: DataTypes.BOOLEAN, defaultValue: false },
      favorite: { allowNull: false, type: DataTypes.BOOLEAN, defaultValue: false },
      created_by: { allowNull: true, type: DataTypes.UUID },
      days: DataTypes.BIGINT,
      half_days: DataTypes.BIGINT,
      weeks: DataTypes.DECIMAL(14, 6),
      years_364: DataTypes.DECIMAL(14, 6),
      months_364: DataTypes.DECIMAL(14, 6),
      years_360: DataTypes.DECIMAL(14, 6),
      months_360: DataTypes.DECIMAL(14, 6),
      years_civil: DataTypes.INTEGER,
      new_moons: DataTypes.INTEGER,
      new_moons_fraction: DataTypes.DECIMAL(14, 6),
      new_moon_years: DataTypes.DECIMAL(14, 6),
      new_moon_years_fraction: DataTypes.DECIMAL(14, 6),
      created_at: { allowNull: false, type: DataTypes.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    },
    { sequelize, modelName: 'EventsPair', tableName: 'events_pairs', timestamps: false }
  )

  return EventsPairsModel
}
