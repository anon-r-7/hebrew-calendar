import { Op } from 'sequelize'
import Models from '@api/models'
import { HebrewDatesModel } from '@api/models/HebrewDates'

export default async (start: Date, end: Date): Promise<HebrewDatesModel[]> => {
  // Convert start and end dates to YYYY-MM-DD format
  const startDate = start.toISOString().split('T')[0]
  const endDate = end.toISOString().split('T')[0]

  return Models.HebrewDates.findAll({
    where: {
      gregorian: {
        [Op.gte]: startDate,
        [Op.lte]: endDate
      }
    }
  })
}
