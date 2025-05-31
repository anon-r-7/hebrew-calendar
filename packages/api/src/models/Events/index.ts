import { Model, DataTypes, Sequelize, Optional } from 'sequelize'

export interface Event {
  uuid: string
  day_index: string
  source: 'system' | 'user'
  system_meta: 'before' | 'after' | null
  source_row: string
  created_at?: Date
}

export type EventCreation = Optional<Event, 'uuid' | 'system_meta'>

export class EventModel extends Model<Event, EventCreation> implements Event {
  public uuid!: string
  public day_index!: string
  public source!: 'system' | 'user'
  public system_meta!: 'before' | 'after' | null
  public source_row!: string
}

export default (sequelize: Sequelize) => {
  EventModel.init(
    {
      uuid: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      day_index: { allowNull: false, type: DataTypes.BIGINT },
      source: { allowNull: false, type: DataTypes.ENUM('system', 'user') },
      system_meta: { allowNull: true, type: DataTypes.ENUM('before', 'after') },
      source_row: { allowNull: false, type: DataTypes.UUID },
      created_at: {
        allowNull: false,
        type: DataTypes.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    },
    {
      sequelize,
      modelName: 'Event',
      tableName: 'events',
      timestamps: false
    }
  )

  return EventModel
}
