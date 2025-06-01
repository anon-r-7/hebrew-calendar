import { Model, DataTypes, Sequelize, Optional } from 'sequelize'

export interface EventsPair {
  uuid: string
  a: string
  b: string
  diff: number
  favorite: boolean
}

export type EventsPairCreation = Optional<EventsPair, 'uuid' | 'favorite'>

export class EventsPairModel
  extends Model<EventsPair, EventsPairCreation>
  implements EventsPair
{
  public uuid!: string
  public a!: string
  public b!: string
  public diff!: number
  public favorite!: boolean
}

export default (sequelize: Sequelize) => {
  EventsPairModel.init(
    {
      uuid: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      a: { allowNull: false, type: DataTypes.UUID },
      b: { allowNull: false, type: DataTypes.UUID },
      diff: { allowNull: false, type: DataTypes.INTEGER },
      favorite: {
        allowNull: false,
        type: DataTypes.BOOLEAN,
        defaultValue: false
      }
    },
    {
      sequelize,
      modelName: 'EventsPair',
      tableName: 'events_pairs',
      timestamps: false
    }
  )

  return EventsPairModel
}
