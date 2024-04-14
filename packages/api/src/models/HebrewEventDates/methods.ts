import { Op } from 'sequelize'
import Models from '@api/models'
import { HebrewEventDatesModel } from '@api/models/HebrewEventDates'
import { createSafeSqlDate } from '@api/utils/dates'

export const findByGregorian = async (
  date: Date
): Promise<HebrewEventDatesModel> => {
  return Models.HebrewEventDates.findOne({
    include: [
      {
        model: Models.HebrewDates,
        where: { gregorian: createSafeSqlDate(date) },
        required: true
      },
      {
        model: Models.HebrewEvents,
        required: true
      }
    ]
  })
}

export const findAllByGregorian = async (
  start: Date,
  end: Date
): Promise<HebrewEventDatesModel[]> => {
  return Models.HebrewEventDates.findAll({
    include: [
      {
        model: Models.HebrewDates,
        where: {
          gregorian: {
            [Op.gte]: createSafeSqlDate(start),
            [Op.lte]: createSafeSqlDate(end)
          }
        },
        required: true
      },
      {
        model: Models.HebrewEvents,
        required: true
      }
    ]
  })
}

// export const findByHebrew = async (
//   dateParts: HebrewParts
// ): Promise<HebrewEventDatesModel> => {
//   const date = hebrewToGregorian(dateParts)
//   return await findByGregorian(date)
// }

// export const findAllByHebrew = async (
//   start: HebrewParts,
//   end: HebrewParts
// ): Promise<HebrewEventDatesModel[]> => {
//   const gStart = hebrewToGregorian(start)
//   const gEnd = hebrewToGregorian(end)
//   return await findAllByGregorian(gStart, gEnd)
// }
