import { Op } from 'sequelize'
import Models from '@api/models'
import { MoonModel } from '@api/models/Moon'

export const findByGregorian = async (date: Date): Promise<MoonModel[]> => {
  const response = await Models.Moon.findAll({
    where: {
      gregorian: date
    }
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
        [Op.gte]: start,
        [Op.lte]: end
      }
    },
    order: ['gregorian']
  })
  return response
}
