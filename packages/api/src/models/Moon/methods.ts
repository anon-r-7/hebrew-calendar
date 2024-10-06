import { Sequelize, Op } from 'sequelize'
import Models from '@api/models'
import { MoonModel } from '@api/models/Moon'

export const findByGregorian = async (date: Date): Promise<MoonModel[]> => {
  const response = await Models.Moon.findAll({
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
): Promise<MoonModel[]> => {
  const response = await Models.Moon.findAll({
    where: {
      gregorian: {
        [Op.gte]: Sequelize.literal(`CAST('${start}' AS DATE)`),
        [Op.lte]: Sequelize.literal(`CAST('${end}' AS DATE)`)
      },
      type: {
        [Op.notIn]: ['firstquarter', 'newmoon', 'thirdquarter', 'fullmoon']
      }
    },
    order: ['gregorian'],
    raw: true
  })
  return response
}

export const findPhasesByGregorian = async (
  start: Date,
  end: Date
): Promise<MoonModel[]> => {
  const response = await Models.Moon.findAll({
    where: {
      gregorian: {
        [Op.gte]: Sequelize.literal(`CAST('${start}' AS DATE)`),
        [Op.lte]: Sequelize.literal(`CAST('${end}' AS DATE)`)
      },
      type: {
        [Op.in]: ['firstquarter', 'newmoon', 'thirdquarter', 'fullmoon']
      }
    },
    order: ['gregorian'],
    raw: true
  })
  return response
}
