import { NextFunction, Request, Response } from 'express'

import { logger } from '@api/utils/logger'
import HttpException from '@api/utils/HttpException'

import {
  createSafeJsDate,
  isValidHebrewDateFormat,
  parseHebrewDate
} from '@api/utils/dates'

import {
  findAllByGregorian,
  findAllByGregorianWithEvents,
  findAllByHebrew,
  findAllByHebrewWithEvents,
  findByGregorian,
  findByHebrew,
  findByHebrewEventAndYear,
  findByGregorianEventAndYear,
  findAllByIndexRange
} from '@api/models/HebrewDates/methods'

import { feasts } from '@api/constants/feasts'

class DatesController {
  public getDates = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const type = typeof req.query.type === 'string' ? req.query.type : ''
      const start = typeof req.query.start === 'string' ? req.query.start : ''
      const end = typeof req.query.end === 'string' ? req.query.end : ''
      const with_events =
        typeof req.query.with_events === 'string'
          ? req.query.with_events
          : false
      let response

      if (type !== 'hebrew') {
        const dtStart = createSafeJsDate(start)
        const dtEnd = createSafeJsDate(end)

        if (isNaN(dtStart.getTime()) || isNaN(dtEnd.getTime())) {
          next(new HttpException(400, 'Invalid gregorian start or end date'))
          return
        }

        response = with_events
          ? await findAllByGregorianWithEvents(dtStart, dtEnd)
          : await findAllByGregorian(dtStart, dtEnd)
      } else {
        if (!isValidHebrewDateFormat(start) || !isValidHebrewDateFormat(end)) {
          next(
            new HttpException(400, 'Invalid hebrew start or end Hebrew date')
          )
          return
        }

        const dtStart = parseHebrewDate(start)
        const dtEnd = parseHebrewDate(end)

        response = with_events
          ? await findAllByHebrewWithEvents(dtStart, dtEnd)
          : await findAllByHebrew(dtStart, dtEnd)
      }

      if (!response || !response.length) {
        next(new HttpException(404, 'Dates not found'))
        return
      }

      res.json(response)
      logger.info('getDate Success')
    } catch (error: any) {
      logger.error(`getDate Error: ${JSON.stringify(error)}`)
      next(error)
    }
  }

  public getDaysFromDate = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const category =
        typeof req.query.category === 'string' ? req.query.category : ''
      const type = typeof req.query.type === 'string' ? req.query.type : ''
      const event = typeof req.query.event === 'string' ? req.query.event : ''
      const start = typeof req.query.start === 'string' ? req.query.start : ''
      const buffer =
        typeof req.query.buffer === 'string' ? Number(req.query.buffer) : 0
      const days =
        typeof req.query.days === 'string' ? Number(req.query.days) : 0

      let start_date

      if (!start) {
        next(new HttpException(400, 'Invalid start date'))
        return
      }

      if (category === 'date') {
        if (type !== 'hebrew') {
          const dtStart = createSafeJsDate(start)

          if (isNaN(dtStart.getTime())) {
            next(new HttpException(400, 'Invalid gregorian start date'))
            return
          }

          start_date = await findByGregorian(dtStart)
        } else {
          if (!isValidHebrewDateFormat(start)) {
            next(new HttpException(400, 'Invalid hebrew start date'))
            return
          }

          const dtStart = parseHebrewDate(start)

          start_date = await findByHebrew(dtStart)
        }
      }

      if (category === 'event') {
        const year = Number(start.split('-')[0])

        const invalid = !(
          year &&
          ((type !== 'hebrew' && (year >= 1 || year <= 2075)) ||
            (type === 'hebrew' && (year >= 3762 || year <= 5836)))
        )

        if (invalid) {
          next(new HttpException(400, 'Invalid category year'))
          return
        }

        if (
          !event ||
          !feasts.map(({ short_name }) => short_name).includes(event)
        ) {
          next(new HttpException(400, 'Invalid feast'))
          return
        }

        if (type !== 'hebrew') {
          start_date = await findByGregorianEventAndYear(year, event)
        } else {
          start_date = await findByHebrewEventAndYear(year, event)
        }
      }

      if (!start_date) {
        next(new HttpException(404, 'Start date not found'))
        return
      }

      const day_index = Number(start_date.day_index)

      const match_index = Number(day_index + days)
      const start_index = Number(match_index - buffer)
      const end_index = Number(match_index + buffer)

      if (!start_index || !end_index || start_index > end_index) {
        next(new HttpException(404, 'Invalid date range'))
        return
      }

      const response = await findAllByIndexRange(start_index, end_index)

      res.json(response)
      logger.info('getDate Success')
    } catch (error: any) {
      logger.error(`getDate Error: ${JSON.stringify(error)}`)
      next(error)
    }
  }
}

export default DatesController
