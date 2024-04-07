import { Model, DataTypes, Sequelize, Optional } from 'sequelize'

export interface HebrewEvents {
  uuid: string
  name: string
  createdAt?: Date
  updatedAt?: Date
}

interface HebrewEventsCreationAttributes
  extends Optional<HebrewEvents, 'uuid'> {}

export class HebrewEventsModel
  extends Model<HebrewEvents, HebrewEventsCreationAttributes>
  implements HebrewEvents
{
  public uuid!: string
  public name!: string
}

export default (sequelize: Sequelize) => {
  HebrewEventsModel.init(
    {
      uuid: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      name: {
        allowNull: false,
        type: DataTypes.STRING
      }
    },
    {
      sequelize,
      modelName: 'HebrewEvents',
      tableName: 'hebrew_events',
      timestamps: true
    }
  )

  return HebrewEventsModel
}
