import { Model, DataTypes, Sequelize, Optional } from 'sequelize'

export interface HebrewEventDates {
  uuid: string
  hebrew_event: string
  hebrew_date: string
  created_at?: Date
  updated_at?: Date
}

interface HebrewEventDatesCreationAttributes
  extends Optional<HebrewEventDates, 'uuid'> {}

export class HebrewEventDatesModel
  extends Model<HebrewEventDates, HebrewEventDatesCreationAttributes>
  implements HebrewEventDates
{
  public uuid!: string
  public hebrew_event!: string
  public hebrew_date!: string
}

export default (sequelize: Sequelize) => {
  HebrewEventDatesModel.init(
    {
      uuid: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      hebrew_event: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'hebrew_events',
          key: 'uuid'
        }
      },
      hebrew_date: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'hebrew_dates',
          key: 'uuid'
        }
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
      modelName: 'HebrewEventDates',
      tableName: 'hebrew_event_dates',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  )

  return HebrewEventDatesModel
}
