import { Model, DataTypes, Sequelize, Optional } from 'sequelize'

export interface EventsEntry {
  uuid: string
  date: string
  type: 'gregorian' | 'hebrew'
  name: string
  description: string
  tags: string
  hebrew_date: string
  day_index: number
  processed: boolean
  created_by: string
  created_at?: Date
  updated_at?: Date
}

export type EventsEntryCreation = Optional<EventsEntry, 'uuid' | 'processed'>

export class EventsEntryModel
  extends Model<EventsEntry, EventsEntryCreation>
  implements EventsEntry
{
  public uuid!: string
  public date!: string
  public type!: 'gregorian' | 'hebrew'
  public name!: string
  public description!: string
  public tags!: string
  public hebrew_date!: string
  public day_index!: number
  public processed!: boolean
  public created_by!: string
}

export default (sequelize: Sequelize) => {
  EventsEntryModel.init(
    {
      uuid: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      date: { allowNull: false, type: DataTypes.STRING },
      type: { allowNull: false, type: DataTypes.ENUM('gregorian', 'hebrew') },
      name: { allowNull: false, type: DataTypes.STRING },
      description: { allowNull: false, type: DataTypes.STRING },
      tags: { allowNull: false, type: DataTypes.STRING },
      hebrew_date: { allowNull: false, type: DataTypes.UUID },
      day_index: { allowNull: false, type: DataTypes.BIGINT },
      processed: {
        allowNull: false,
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      created_by: { allowNull: false, type: DataTypes.UUID },
      created_at: {
        allowNull: false,
        type: DataTypes.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: DataTypes.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    },
    {
      sequelize,
      modelName: 'EventsEntry',
      tableName: 'events_entry',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  )

  return EventsEntryModel
}
