import { Model, DataTypes, Sequelize, Optional } from 'sequelize'

export interface Sun {
  uuid: string
  gregorian: Date
  type: string
  hour: number
  min: number
  sec: number
  azimuth: number
  altitude: number
  distance: number
  created_at?: Date
  updated_at?: Date
}

interface SunCreationAttributes extends Optional<Sun, 'uuid'> {}

export class SunModel extends Model<Sun, SunCreationAttributes> implements Sun {
  public uuid!: string
  public gregorian!: Date
  public type: string
  public hour: number
  public min: number
  public sec: number
  public azimuth: number
  public altitude: number
  public distance: number
}

export default (sequelize: Sequelize) => {
  SunModel.init(
    {
      uuid: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      gregorian: DataTypes.DATEONLY,
      type: {
        type: DataTypes.STRING,
        allowNull: false
      },
      hour: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      min: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      sec: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      azimuth: {
        type: DataTypes.DECIMAL(12, 1),
        allowNull: true
      },
      altitude: {
        type: DataTypes.DECIMAL(12, 1),
        allowNull: true
      },
      distance: {
        type: DataTypes.INTEGER,
        allowNull: true
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
      modelName: 'Sun',
      tableName: 'sun',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  )

  return SunModel
}
