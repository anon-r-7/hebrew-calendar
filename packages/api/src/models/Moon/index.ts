import { Model, DataTypes, Sequelize, Optional } from 'sequelize'

export interface Moon {
  uuid: string
  gregorian: Date
  type: string
  hour: number
  min: number
  sec: number
  azimuth: number
  altitude: number
  distance: number
  illuminated: number
  posangle: number
  created_at?: Date
  updated_at?: Date
}

interface MoonCreationAttributes extends Optional<Moon, 'uuid'> {}

export class MoonModel
  extends Model<Moon, MoonCreationAttributes>
  implements Moon
{
  public uuid!: string
  public gregorian!: Date
  public type!: string
  public hour!: number
  public min!: number
  public sec!: number
  public azimuth!: number
  public altitude!: number
  public distance!: number
  public illuminated!: number
  public posangle!: number
}

export default (sequelize: Sequelize) => {
  MoonModel.init(
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
      illuminated: {
        type: DataTypes.DECIMAL(12, 1),
        allowNull: true
      },
      posangle: {
        type: DataTypes.DECIMAL(12, 1),
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
      modelName: 'Moon',
      tableName: 'moon',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  )

  return MoonModel
}
