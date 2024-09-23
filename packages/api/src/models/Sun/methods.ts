import { Op } from 'sequelize'
import Models from '@api/models'
import { SunModel } from '@api/models/Sun'

export const findByGregorian = async (date: Date): Promise<SunModel[]> => {
  const response = await Models.Sun.findAll({
    where: {
      gregorian: date
    }
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
        [Op.gte]: start,
        [Op.lte]: end
      }
    },
    order: ['gregorian']
  })
  return response
}
