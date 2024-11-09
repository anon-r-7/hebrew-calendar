import { Sequelize, Op, QueryTypes } from 'sequelize'
import Models from '@api/models'
import { HebrewDatesModel } from '@api/models/HebrewDates'
import { createSafeSqlDate, HebrewParts } from '@api/utils/dates'

export const findByGregorian = async (
  date: Date,
  era: string
): Promise<HebrewDatesModel | null> => {
  // Create the safe SQL date with the correct era (BC or AD)
  const gregorianDate = createSafeSqlDate(date, era)

  // Raw SQL query to find the Hebrew date by Gregorian date
  const query = `
    SELECT * 
    FROM hebrew_dates
    WHERE gregorian = CAST(:gregorianDate AS DATE)
    LIMIT 1;
  `

  // Execute the raw SQL query
  const results: HebrewDatesModel[] = await Models.sequelize.query(query, {
    replacements: {
      gregorianDate
    },
    type: QueryTypes.SELECT // Specifies the query type (SELECT)
  })

  // Return the first result or null if no results
  return results.length > 0 ? (results[0] as HebrewDatesModel) : null
}

export const findAllByGregorian = async (
  start: Date,
  end: Date,
  era: string
): Promise<HebrewDatesModel[]> => {
  const response = await Models.HebrewDates.findAll({
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
    order: ['gregorian'],
    raw: true
  })
  return response
}

export const findAllByGregorianWithEvents = async (
  start: Date,
  end: Date,
  era: string
): Promise<any[]> => {
  const startDate = createSafeSqlDate(start, era)
  const endDate = createSafeSqlDate(end, era)

  const query = `
    SELECT hd.uuid AS "date_uuid"
      , hd.gregorian
      , hd.day_of_week
      , hd.day_index
      , hd.dd
      , hd.mm
      , hd.yy,
      COALESCE(
        json_agg(
          CASE 
            WHEN hed.uuid IS NOT NULL THEN json_build_object(
              'uuid', hed.uuid,
              'event', json_build_object(
                'uuid', he.uuid,
                'name', he.name,
                'short_name', he.short_name
              )
            )
          END
        ) FILTER (WHERE hed.uuid IS NOT NULL),
        '[]'  -- Return empty array when no events
      ) AS events
    FROM hebrew_dates hd
    LEFT JOIN hebrew_event_dates hed ON hed.hebrew_date = hd.uuid
    LEFT JOIN hebrew_events he ON he.uuid = hed.hebrew_event
    WHERE hd.gregorian >= CAST(:startDate AS DATE)
      AND hd.gregorian <= CAST(:endDate AS DATE)
    GROUP BY hd.uuid
    ORDER BY hd.gregorian;
  `

  // Execute the raw SQL query
  const results: HebrewDatesModel[] = await Models.sequelize.query(query, {
    replacements: { startDate, endDate },
    type: QueryTypes.SELECT
  })

  return results
}

export const findGregorianEventsByYear = async (
  year: string
): Promise<any[]> => {
  const startDate = `${year}-01-01`
  const endDate = `${year}-12-31`

  const query = `
    SELECT hd.uuid AS "date_uuid"
      , hd.gregorian
      , hd.day_of_week
      , hd.day_index
      , hd.dd
      , hd.mm
      , hd.yy,
      COALESCE(
        json_agg(
          CASE 
            WHEN hed.uuid IS NOT NULL THEN json_build_object(
              'uuid', hed.uuid,
              'event', json_build_object(
                'uuid', he.uuid,
                'name', he.name,
                'short_name', he.short_name
              )
            )
          END
        ) FILTER (WHERE hed.uuid IS NOT NULL),
        '[]'  -- Return empty array when no events
      ) AS events
    FROM hebrew_dates hd
    JOIN hebrew_event_dates hed ON hed.hebrew_date = hd.uuid
    JOIN hebrew_events he ON he.uuid = hed.hebrew_event
    WHERE hd.gregorian >= CAST(:startDate AS DATE)
      AND hd.gregorian <= CAST(:endDate AS DATE)
      AND he.short_name NOT IN ('shabbat', 'rosh_chodesh', 'tisha_bav', 'purim', 'chanukkah')
    GROUP BY hd.uuid
    ORDER BY hd.gregorian;
  `

  // Execute the raw SQL query
  const results: HebrewDatesModel[] = await Models.sequelize.query(query, {
    replacements: { startDate, endDate },
    type: QueryTypes.SELECT
  })

  return results
}

export const findByHebrew = async ({
  yy,
  mm,
  dd
}: HebrewParts): Promise<HebrewDatesModel> => {
  const response = await Models.HebrewDates.findOne({
    where: { yy, mm, dd },
    raw: true
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
    },
    raw: true
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
    order: ['gregorian'],
    raw: true
  })
  return response
}

export const findAllByHebrewWithEvents = async (
  start: HebrewParts,
  end: HebrewParts
): Promise<any[]> => {
  const start_row = await Models.HebrewDates.findOne({
    where: {
      yy: start.yy,
      mm: start.mm,
      dd: start.dd
    },
    raw: true
  })

  const end_row = await Models.HebrewDates.findOne({
    where: {
      yy: end.yy,
      mm: end.mm,
      dd: end.dd
    },
    raw: true
  })

  if (!start_row || !end_row) {
    return []
  }

  const query = `
    SELECT hd.uuid AS "date_uuid"
      , hd.gregorian
      , hd.day_of_week
      , hd.day_index
      , hd.dd
      , hd.mm
      , hd.yy,
      COALESCE(
        json_agg(
          CASE 
            WHEN hed.uuid IS NOT NULL THEN json_build_object(
              'uuid', hed.uuid,
              'event', json_build_object(
                'uuid', he.uuid,
                'name', he.name,
                'short_name', he.short_name
              )
            )
          END
        ) FILTER (WHERE hed.uuid IS NOT NULL),
        '[]'  -- Return empty array when no events
      ) AS events
    FROM hebrew_dates hd
    LEFT JOIN hebrew_event_dates hed ON hed.hebrew_date = hd.uuid
    LEFT JOIN hebrew_events he ON he.uuid = hed.hebrew_event
    WHERE hd.day_index >= :startDayIndex
      AND hd.day_index <= :endDayIndex
    GROUP BY hd.uuid
    ORDER BY hd.gregorian;
  `

  const results: HebrewDatesModel[] = await Models.sequelize.query(query, {
    replacements: {
      startDayIndex: start_row.day_index,
      endDayIndex: end_row.day_index
    },
    type: QueryTypes.SELECT
  })

  return results
}

export const findHebrewEventsByYear = async (
  year: string
): Promise<any[]> => {
  const query = `
    SELECT hd.uuid AS "date_uuid"
      , hd.gregorian
      , hd.day_of_week
      , hd.day_index
      , hd.dd
      , hd.mm
      , hd.yy,
      COALESCE(
        json_agg(
          CASE 
            WHEN hed.uuid IS NOT NULL THEN json_build_object(
              'uuid', hed.uuid,
              'event', json_build_object(
                'uuid', he.uuid,
                'name', he.name,
                'short_name', he.short_name
              )
            )
          END
        ) FILTER (WHERE hed.uuid IS NOT NULL),
        '[]'  -- Return empty array when no events
      ) AS events
    FROM hebrew_dates hd
    JOIN hebrew_event_dates hed ON hed.hebrew_date = hd.uuid
    JOIN hebrew_events he ON he.uuid = hed.hebrew_event
    WHERE hd.yy = :year
      AND hd.yy <= :endDayIndex
      AND he.short_name NOT IN ('shabbat', 'rosh_chodesh', 'tisha_bav', 'purim', 'chanukkah')
    GROUP BY hd.uuid
    ORDER BY hd.gregorian;
  `

  const results: HebrewDatesModel[] = await Models.sequelize.query(query, {
    replacements: {
      year,
    },
    type: QueryTypes.SELECT
  })

  return results
}

export const findByHebrewEventAndYear = async (
  year: number,
  event: string
): Promise<HebrewDatesModel | null> => {
  // Raw SQL query to find the Hebrew date and event
  const query = `
    SELECT hd.*
    FROM hebrew_event_dates hed
    JOIN hebrew_dates hd ON hed.hebrew_date = hd.uuid
    JOIN hebrew_events he ON hed.hebrew_event = he.uuid
    WHERE hd.yy = :year
      AND he.short_name = :event
    ORDER BY hd.day_index ASC
    LIMIT 1;
  `

  // Execute the raw SQL query
  const results: HebrewDatesModel[] = await Models.sequelize.query(query, {
    replacements: { year, event },
    type: QueryTypes.SELECT
  })

  return results.length > 0 ? (results[0] as HebrewDatesModel) : null
}

export const findByGregorianEventAndYear = async (
  year: number,
  event: string,
  era: string
): Promise<HebrewDatesModel | null> => {
  // Adjust the year format depending on whether the era is 'bc' or 'ad'
  const startDate = `${year}-01-01${era.toLowerCase() === 'bc' ? ' BC' : ''}`
  const endDate = `${year + 1}-01-01${era.toLowerCase() === 'bc' ? ' BC' : ''}`

  // Raw SQL query to find the Gregorian event by year and era
  const query = `
    SELECT hd.*
    FROM hebrew_event_dates hed
    JOIN hebrew_dates hd ON hed.hebrew_date = hd.uuid
    JOIN hebrew_events he ON hed.hebrew_event = he.uuid
    WHERE hd.gregorian >= CAST(:startDate AS DATE)
      AND hd.gregorian < CAST(:endDate AS DATE)
      AND he.short_name = :event
    ORDER BY hd.day_index ASC
    LIMIT 1;
  `

  // Execute the raw SQL query
  const results: HebrewDatesModel[] = await Models.sequelize.query(query, {
    replacements: { startDate, endDate, event },
    type: QueryTypes.SELECT
  })

  return results.length > 0 ? (results[0] as HebrewDatesModel) : null
}

export const findAllByIndexRange = async (
  start: number,
  end: number
): Promise<HebrewDatesModel[]> => {
  // Raw SQL query to find Hebrew dates by day_index range with related events
  const query = `
    SELECT hd.*,
           COALESCE(
             json_agg(
               json_build_object(
                 'uuid', hed.uuid,
                 'event', json_build_object(
                   'uuid', he.uuid,
                   'name', he.name,
                   'short_name', he.short_name
                 )
               )
             ) FILTER (WHERE hed.uuid IS NOT NULL),
             '[]'  -- Return empty array when no events
           ) AS events
    FROM hebrew_dates hd
    LEFT JOIN hebrew_event_dates hed ON hed.hebrew_date = hd.uuid
    LEFT JOIN hebrew_events he ON he.uuid = hed.hebrew_event
    WHERE hd.day_index >= :start
      AND hd.day_index <= :end
    GROUP BY hd.uuid
    ORDER BY hd.day_index ASC;
  `

  // Execute the raw SQL query
  const results: HebrewDatesModel[] = await Models.sequelize.query(query, {
    replacements: { start, end },
    type: QueryTypes.SELECT
  })

  return results
}
