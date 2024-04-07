import { Op } from 'sequelize'
import Models from '@api/models'
import { HebrewDatesModel } from '@api/models/HebrewDates'
import {
  createSafeSqlDate,
  hebrewToGregorian,
  HebrewParts
} from '@api/utils/dates'

export const findByGregorian = async (
  date: Date
): Promise<HebrewDatesModel> => {
  return Models.HebrewDates.findOne({
    where: {
      gregorian: createSafeSqlDate(date)
    }
  })
}

export const findAllByGregorian = async (
  start: Date,
  end: Date
): Promise<HebrewDatesModel[]> => {
  return Models.HebrewDates.findAll({
    where: {
      gregorian: {
        [Op.gte]: createSafeSqlDate(start),
        [Op.lte]: createSafeSqlDate(end)
      }
    }
  })
}

export const findByHebrew = async (
  dateParts: HebrewParts
): Promise<HebrewDatesModel> => {
  const date = hebrewToGregorian(dateParts)
  return await findByGregorian(date)
}

export const findAllByHebrew = async (
  start: HebrewParts,
  end: HebrewParts
): Promise<HebrewDatesModel[]> => {
  const gStart = hebrewToGregorian(start)
  const gEnd = hebrewToGregorian(end)
  return await findAllByGregorian(gStart, gEnd)
}
