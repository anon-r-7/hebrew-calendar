import { Model, DataTypes, Sequelize, Optional } from 'sequelize'

export interface Event {
  uuid: string
  name: string
  description: string | null
  hebrew_date: string
  created_by: string | null
  created_at?: Date
  updated_at?: Date
}

export type EventCreation = Optional<Event, 'uuid' | 'description' | 'created_by'>

export class EventsModel extends Model<Event, EventCreation> implements Event {
  public uuid!: string
  public name!: string
  public description!: string | null
  public hebrew_date!: string
  public created_by!: string | null
}

export default (sequelize: Sequelize) => {
  EventsModel.init(
    {
      uuid: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      name: { allowNull: false, type: DataTypes.STRING },
      description: { allowNull: true, type: DataTypes.TEXT },
      hebrew_date: { allowNull: false, type: DataTypes.UUID },
      created_by: { allowNull: true, type: DataTypes.UUID },
      created_at: { allowNull: false, type: DataTypes.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { allowNull: false, type: DataTypes.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    },
    {
      sequelize,
      modelName: 'Event',
      tableName: 'events',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  )

  return EventsModel
}
