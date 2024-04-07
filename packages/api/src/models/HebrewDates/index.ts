import { Model, DataTypes, Sequelize, Optional } from 'sequelize'

export interface HebrewDates {
  uuid: string
  gregorian: Date
  dd: number
  mm: number
  yy: number
  rd: number
  createdAt?: Date
  updatedAt?: Date
}

interface HebrewDatesCreationAttributes extends Optional<HebrewDates, 'uuid'> {}

export class HebrewDatesModel
  extends Model<HebrewDates, HebrewDatesCreationAttributes>
  implements HebrewDates
{
  public uuid!: string
  public gregorian!: Date
  public dd!: number
  public mm!: number
  public yy!: number
  public rd!: number
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
      rd: {
        allowNull: false,
        type: DataTypes.INTEGER
      }
    },
    {
      sequelize,
      modelName: 'HebrewDate',
      tableName: 'hebrew_dates',
      timestamps: true
    }
  )

  return HebrewDatesModel
}
