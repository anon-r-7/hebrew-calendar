import { Op } from 'sequelize'
import Models from '@api/models'
import { HebrewDatesModel } from '@api/models/HebrewDates'
import { createSafeSqlDate, HebrewParts } from '@api/utils/dates'

export const findByGregorian = async (
  date: Date
): Promise<HebrewDatesModel> => {
  const response = await Models.HebrewDates.findOne({
    where: {
      gregorian: createSafeSqlDate(date)
    }
  })
  return response
}

export const findAllByGregorian = async (
  start: Date,
  end: Date
): Promise<HebrewDatesModel[]> => {
  const response = await Models.HebrewDates.findAll({
    where: {
      gregorian: {
        [Op.gte]: createSafeSqlDate(start),
        [Op.lte]: createSafeSqlDate(end)
      }
    },
    order: ['gregorian']
  })
  return response
}

export const findAllByGregorianWithEvents = async (
  start: Date,
  end: Date
): Promise<HebrewDatesModel[]> => {
  const response = await Models.HebrewDates.findAll({
    where: {
      gregorian: {
        [Op.gte]: createSafeSqlDate(start),
        [Op.lte]: createSafeSqlDate(end)
      }
    },
    attributes: {
      exclude: ['created_at', 'updated_at']
    },
    include: [
      {
        model: Models.HebrewEventDates,
        as: 'events',
        attributes: {
          exclude: ['hebrew_event', 'hebrew_date', 'created_at', 'updated_at']
        },
        required: false,
        include: [
          {
            model: Models.HebrewEvents,
            as: 'event',
            attributes: {
              exclude: ['created_at', 'updated_at', 'uuid']
            },
            required: true
          }
        ]
      }
    ],
    order: ['gregorian']
  })
  return response
}

export const findByHebrew = async ({
  yy,
  mm,
  dd
}: HebrewParts): Promise<HebrewDatesModel> => {
  const response = await Models.HebrewDates.findOne({
    where: { yy, mm, dd }
  })
  return response
}

export const findAllByHebrew = async (
  start: HebrewParts,
  end: HebrewParts
): Promise<HebrewDatesModel[]> => {
  const start_row = await Models.HebrewDates.findOne({
    where: {
      yy: start.yy,
      mm: start.mm,
      dd: start.dd
    }
  })

  const end_row = await Models.HebrewDates.findOne({
    where: {
      yy: end.yy,
      mm: end.mm,
      dd: end.dd
    }
  })

  const response = await Models.HebrewDates.findAll({
    where: {
      day_index: {
        [Op.gte]: start_row.day_index,
        [Op.lte]: end_row.day_index
      }
    },
    order: ['gregorian']
  })
  return response
}

export const findAllByHebrewWithEvents = async (
  start: HebrewParts,
  end: HebrewParts
): Promise<HebrewDatesModel[]> => {
  const start_row = await Models.HebrewDates.findOne({
    where: {
      yy: start.yy,
      mm: start.mm,
      dd: start.dd
    }
  })

  const end_row = await Models.HebrewDates.findOne({
    where: {
      yy: end.yy,
      mm: end.mm,
      dd: end.dd
    }
  })

  const response = await Models.HebrewDates.findAll({
    where: {
      day_index: {
        [Op.gte]: start_row.day_index,
        [Op.lte]: end_row.day_index
      }
    },
    attributes: {
      exclude: ['created_at', 'updated_at']
    },
    include: [
      {
        model: Models.HebrewEventDates,
        as: 'events',
        attributes: {
          exclude: ['hebrew_event', 'hebrew_date', 'created_at', 'updated_at']
        },
        required: false,
        include: [
          {
            model: Models.HebrewEvents,
            as: 'event',
            attributes: {
              exclude: ['created_at', 'updated_at', 'uuid']
            },
            required: true
          }
        ]
      }
    ],
    order: ['gregorian']
  })
  return response
}
