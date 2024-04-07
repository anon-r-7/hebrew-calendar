import { Op } from 'sequelize'
import Models from '@api/models'
import { HebrewDatesModel } from '@api/models/HebrewDates'

export const findByGregorian = async (
  dt: Date
): Promise<HebrewDatesModel> => {
  const date = dt.toISOString().split('T')[0]

  return Models.HebrewDates.findOne({
    where: {
      gregorian: date
    }
  })
}

export const findAllByGregorian = async (
  startDt: Date,
  endDt: Date
): Promise<HebrewDatesModel[]> => {
  // Convert start and end dates to YYYY-MM-DD format
  const start = startDt.toISOString().split('T')[0]
  const end = endDt.toISOString().split('T')[0]

  return Models.HebrewDates.findAll({
    where: {
      gregorian: {
        [Op.gte]: start,
        [Op.lte]: end
      }
    }
  })
}
