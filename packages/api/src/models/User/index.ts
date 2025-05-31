import { Model, DataTypes, Sequelize, Optional } from 'sequelize'
import bcrypt from 'bcrypt'

export interface User {
  uuid: string
  first_name: string
  last_name: string
  email: string
  password: string
  created_at?: Date
  updated_at?: Date
}

export type UserCreation = Optional<User, 'uuid'>

export class UserModel extends Model<User, UserCreation> implements User {
  public uuid!: string
  public first_name!: string
  public last_name!: string
  public email!: string
  public password!: string
  public readonly created_at!: Date
  public readonly updated_at!: Date
}

export default (sequelize: Sequelize) => {
  UserModel.init(
    {
      uuid: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      first_name: {
        allowNull: false,
        type: DataTypes.STRING
      },
      last_name: {
        allowNull: false,
        type: DataTypes.STRING
      },
      email: {
        allowNull: false,
        type: DataTypes.STRING
      },
      password: {
        allowNull: false,
        type: DataTypes.STRING
      },
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
      modelName: 'User',
      tableName: 'users',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      hooks: {
        beforeCreate: async (u: UserModel) => {
          u.password = await bcrypt.hash(u.password, 10)
        },
        beforeUpdate: async (u: UserModel, opts) => {
          if (opts.fields?.includes('password')) {
            u.password = await bcrypt.hash(u.password, 10)
          }
        }
      }
    }
  )

  return UserModel
}
