import { Model, DataTypes, Sequelize, Optional } from 'sequelize'

export interface HebrewDates {
  uuid: string
  gregorian: Date
  day_of_week: string
  day_index: number
  dd: number
  mm: number
  yy: number
  created_at?: Date
  updated_at?: Date
}

interface HebrewDatesCreationAttributes extends Optional<HebrewDates, 'uuid'> {}

export class HebrewDatesModel
  extends Model<HebrewDates, HebrewDatesCreationAttributes>
  implements HebrewDates
{
  public uuid!: string
  public gregorian!: Date
  public day_of_week!: string
  public day_index!: number
  public dd!: number
  public mm!: number
  public yy!: number
}

export default (sequelize: Sequelize) => {
  HebrewDatesModel.init(
    {
      uuid: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      gregorian: DataTypes.DATEONLY,
      day_of_week: {
        type: DataTypes.STRING
      },
      day_index: {
        type: DataTypes.BIGINT
      },
      dd: {
        allowNull: false,
        type: DataTypes.INTEGER
      },
      mm: {
        allowNull: false,
        type: DataTypes.INTEGER
      },
      yy: {
        allowNull: false,
        type: DataTypes.INTEGER
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
      modelName: 'HebrewDates',
      tableName: 'hebrew_dates',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  )

  return HebrewDatesModel
}
