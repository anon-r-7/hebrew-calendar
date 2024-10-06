import { Sequelize, Op, QueryTypes } from 'sequelize'
import Models from '@api/models'
import { HebrewEventDatesModel } from '@api/models/HebrewEventDates'
import { createSafeSqlDate } from '@api/utils/dates'

export const findByGregorian = async (
  date: Date,
  era: string
): Promise<HebrewEventDatesModel | null> => {
  // Create the safe SQL date with the correct era (BC or AD)
  const gregorianDate = createSafeSqlDate(date, era)

  // Raw SQL query to find the Hebrew event by Gregorian date
  const query = `
    SELECT hed.*, 
           hd.gregorian,
           he.uuid AS event_uuid, he.name AS event_name, he.short_name AS event_short_name
    FROM hebrew_event_dates hed
    JOIN hebrew_dates hd ON hed.hebrew_date = hd.uuid
    JOIN hebrew_events he ON hed.hebrew_event = he.uuid
    WHERE hd.gregorian = CAST(:gregorianDate AS DATE)
    LIMIT 1;
  `

  // Execute the raw SQL query and cast results as HebrewEventDatesModel[]
  const results: HebrewEventDatesModel[] = await Models.sequelize.query(query, {
    replacements: {
      gregorianDate
    },
    type: QueryTypes.SELECT // Specifies the query type (SELECT)
  })

  // Return the first result or null if no results
  return results.length > 0 ? (results[0] as HebrewEventDatesModel) : null
}

export const findAllByGregorian = async (
  start: Date,
  end: Date,
  era: string
): Promise<HebrewEventDatesModel[]> => {
  return Models.HebrewEventDates.findAll({
    include: [
      {
        model: Models.HebrewDates,
        where: {
          gregorian: {
            [Op.gte]: Sequelize.literal(
              `CAST('${createSafeSqlDate(start, era)}' AS DATE)`
            ),
            [Op.lte]: Sequelize.literal(
              `CAST('${createSafeSqlDate(end, era)}' AS DATE)`
            )
          }
        },
        required: true
      },
      {
        model: Models.HebrewEvents,
        required: true
      }
    ],
    raw: true
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
