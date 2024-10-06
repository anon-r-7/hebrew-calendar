import { Sequelize, Op } from 'sequelize'
import Models from '@api/models'
import { SunModel } from '@api/models/Sun'

export const findByGregorian = async (date: Date): Promise<SunModel[]> => {
  const response = await Models.Sun.findAll({
    where: {
      gregorian: Sequelize.literal(`CAST('${date}' AS DATE)`)
    },
    raw: true
  })
  return response
}

export const findAllByGregorian = async (
  start: Date,
  end: Date
): Promise<SunModel[]> => {
  const response = await Models.Sun.findAll({
    where: {
      gregorian: {
        [Op.gte]: Sequelize.literal(`CAST('${start}' AS DATE)`),
        [Op.lte]: Sequelize.literal(`CAST('${end}' AS DATE)`)
      }
    },
    order: ['gregorian'],
    raw: true
  })
  return response
}
