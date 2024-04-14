import { Model, DataTypes, Sequelize, Optional } from 'sequelize'

export interface HebrewEvents {
  uuid: string
  name: string
  short_name: string
  created_at?: Date
  updated_at?: Date
}

interface HebrewEventsCreationAttributes
  extends Optional<HebrewEvents, 'uuid'> {}

export class HebrewEventsModel
  extends Model<HebrewEvents, HebrewEventsCreationAttributes>
  implements HebrewEvents
{
  public uuid!: string
  public name!: string
  public short_name!: string
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
      },
      short_name: {
        allowNull: false,
        type: DataTypes.STRING
      },
      created_at: {
        allowNull: false,
        type: DataTypes.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        field: 'created_at'
      },
      updated_at: {
        allowNull: false,
        type: DataTypes.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        field: 'updated_at'
      }
    },
    {
      sequelize,
      modelName: 'HebrewEvents',
      tableName: 'hebrew_events',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  )

  return HebrewEventsModel
}
