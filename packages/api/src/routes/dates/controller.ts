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
  findAllByIndexRange,
  findMonthByIndex,
  findAllByMonthIndexAndDays,
  findGregorianEventsByYear,
  findHebrewEventsByYear
} from '@api/models/HebrewDates/methods'

import {
  findAllByGregorian as findMoon,
  findPhasesByGregorian as findPhases
} from '@api/models/Moon/methods'

import { findAllByGregorian as findSun } from '@api/models/Sun/methods'

import { feasts } from '@api/constants/feasts'

class DatesController {
  public getDates = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const type = typeof req.query.type === 'string' ? req.query.type : ''
      const start = typeof req.query.start === 'string' ? req.query.start : ''
      const end = typeof req.query.end === 'string' ? req.query.end : ''
      const era = typeof req.query.era === 'string' ? req.query.era : ''
      const with_events =
        typeof req.query.with_events === 'string'
          ? req.query.with_events === 'true'
            ? true
            : false
          : false
      const with_astronomy =
        typeof req.query.with_astronomy === 'string'
          ? req.query.with_astronomy === 'true'
            ? true
            : false
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
          ? await findAllByGregorianWithEvents(dtStart, dtEnd, era)
          : await findAllByGregorian(dtStart, dtEnd, era)
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

      const startGregorian = response[0].gregorian
      const endGregorian = response[response.length - 1].gregorian

      const moon_phases = await findPhases(startGregorian, endGregorian)
      if (moon_phases && moon_phases.length) {
        response.map((row) => {
          const moon_phase = moon_phases.find(
            (phase) => phase.gregorian === row.gregorian
          )
          if (moon_phase?.type) row.moon_phase = moon_phase.type
          return row
        })
      }

      if (with_astronomy) {
        const sun_events = await findSun(startGregorian, endGregorian)
        const moon_events = await findMoon(startGregorian, endGregorian)

        response = response.map((row) => {
          const row_sun_events = sun_events.filter(
            (event) => event.gregorian === row.gregorian
          )
          const row_moon_events = moon_events.filter(
            (event) => event.gregorian === row.gregorian
          )

          row.astronomy = {
            sun: row_sun_events,
            moon: row_moon_events
          }

          return row
        })
      }

      res.json(response)
      logger.info('getDate Success')
    } catch (error: any) {
      logger.error(`getDate Error: ${JSON.stringify(error)}`)
      next(error)
    }
  }

  public getHolidays = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const type = typeof req.query.type === 'string' ? req.query.type : ''
      const year = typeof req.query.year === 'string' ? req.query.year : ''

      let response

      if (type !== 'hebrew') {
        // TODO: findAllByGregorianWithEvents -> findGregorianEventsByYear
        response = await findGregorianEventsByYear(year)
      } else {
        // TODO: findAllByGregorianWithEvents -> findHebrewEventsByYear
        response = await findHebrewEventsByYear(year)
      }

      if (!response || !response.length) {
        next(new HttpException(404, 'Holidays not found'))
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
      const era = typeof req.query.era === 'string' ? req.query.era : ''
      const buffer =
        typeof req.query.buffer === 'string' ? Number(req.query.buffer) : 0
      const days =
        typeof req.query.days === 'string' ? Number(req.query.days) : 0
      const direction =
        typeof req.query.direction === 'string'
          ? req.query.direction
          : 'future'
      const include_first_day =
        req.query.include_first_day && req.query.include_first_day === 'true'
      // 'days' (day_index) or 'new_moons' (month_index)
      const unit = req.query.unit === 'new_moons' ? 'new_moons' : 'days'

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

          start_date = await findByGregorian(dtStart, era)
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
          ((type !== 'hebrew' &&
            (year >= 1 || (era === 'ad' ? year <= 4200 : year <= 4004))) ||
            (type === 'hebrew' && (year >= 1 || year <= 7960)))
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
          start_date = await findByGregorianEventAndYear(year, event, era)
        } else {
          start_date = await findByHebrewEventAndYear(year, event)
        }
      }

      if (!start_date) {
        next(new HttpException(404, 'Start date not found'))
        return
      }

      if (unit === 'new_moons') {
        // N new moons from a date = the same day of the month, N months later (or earlier).
        // "Include first month" counts the start month as month 1, like include_first_day.
        // No buffer in this mode: normally exactly one date comes back; when the target
        // month has no such day, a message plus the nearest corresponding days come back.
        let month_index = Number(start_date.month_index)
        if (include_first_day)
          month_index = direction === 'future' ? month_index - 1 : month_index + 1

        const match_month =
          direction === 'future'
            ? Number(month_index + days)
            : Number(month_index - days)
        const dd = Number(start_date.dd)

        const month = await findMonthByIndex(match_month)
        if (!month) {
          next(new HttpException(404, 'Invalid date range'))
          return
        }

        const withDistance = (rows) =>
          rows.map((row) => ({
            ...row,
            // Math.abs accounts for direction 'forward' or 'past'
            new_moons_from_month_index: Math.abs(
              Number(row.month_index) - month_index
            )
          }))

        const exact = await findAllByMonthIndexAndDays(match_month, [dd])
        if (exact.length) {
          res.json({ message: null, dates: withDistance(exact) })
          logger.info('getDate Success')
          return
        }

        let message: string
        let nearest
        if (dd > month.last_dd && month.last_dd >= 29) {
          // the month is shorter than the start's day of month: its last day, then as many
          // days of the following month as the overflow (Hebrew months are 29 or 30 days,
          // so in practice the last day and the 1st of the next month)
          const overflow = dd - month.last_dd
          nearest = await findAllByIndexRange(
            month.last_day_index,
            month.last_day_index + overflow
          )
          message = `The ${
            direction === 'past' ? 'previous' : 'next'
          } new moon's month has only ${month.last_dd} days, so it has no day ${dd}. Below are the nearest corresponding days:`
        } else {
          // the day exists in the calendar but has no row: one of the 42 Julian century leap
          // days a Postgres date cannot hold. Show the days either side of it.
          nearest = await findAllByMonthIndexAndDays(match_month, [dd - 1, dd + 1])
          message = `Day ${dd} of that month has no entry in the calendar (it falls on a Julian leap day the table cannot store). Below are the nearest days:`
        }

        res.json({ message, dates: withDistance(nearest) })
        logger.info('getDate Success')
        return
      }

      let day_index = Number(start_date.day_index)
      if (include_first_day)
        day_index = direction === 'future' ? day_index - 1 : day_index + 1

      const match_index =
        direction === 'future'
          ? Number(day_index + days)
          : Number(day_index - days)

      const start_index = Number(match_index - buffer)
      const end_index = Number(match_index + buffer)

      // day 0 (1-07-30, the eve of creation) is a valid index, so test for numbers, not truthiness
      if (
        !Number.isFinite(start_index) ||
        !Number.isFinite(end_index) ||
        start_index > end_index
      ) {
        next(new HttpException(404, 'Invalid date range'))
        return
      }

      const response = await findAllByIndexRange(start_index, end_index)

      const transformedResponse = response.map((row) => {
        // Math.abs accounts for direction 'forward' or 'past'
        const days_from_day_index = Math.abs(Number(row.day_index) - day_index)

        return {
          ...row,
          days_from_day_index
        }
      })

      transformedResponse.sort((a, b) => {
        if (a.days_from_day_index > b.days_from_day_index) return 1
        if (a.days_from_day_index < b.days_from_day_index) return -1
        return 0
      })

      res.json(transformedResponse)

      logger.info('getDate Success')
    } catch (error: any) {
      logger.error(`getDate Error: ${JSON.stringify(error)}`)
      next(error)
    }
  }

  public getDaysBetweenDates = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const type = typeof req.query.type === 'string' ? req.query.type : ''
      const start = typeof req.query.start === 'string' ? req.query.start : ''
      const end = typeof req.query.end === 'string' ? req.query.end : ''
      const era_start =
        typeof req.query.era_start === 'string' ? req.query.era_start : ''
      const era_end =
        typeof req.query.era_end === 'string' ? req.query.era_end : ''
      const include_first_day =
        req.query.include_first_day && req.query.include_first_day === 'true'
      // 'days' (day_index) or 'new_moons' (month_index); detail=true returns the breakdown
      // object instead of the bare number (the bare number stays the default for callers
      // like the spreadsheet's getDays()).
      const unit = req.query.unit === 'new_moons' ? 'new_moons' : 'days'
      const detail = req.query.detail === 'true'

      let start_date, end_date

      if (!start) {
        next(new HttpException(400, 'Invalid start date'))
        return
      }

      if (type !== 'hebrew') {
        const dtStart = createSafeJsDate(start)
        const dtEnd = createSafeJsDate(end)

        if (isNaN(dtStart.getTime()) || isNaN(dtEnd.getTime())) {
          next(new HttpException(400, 'Invalid gregorian start or end date'))
          return
        }

        start_date = await findByGregorian(dtStart, era_start)
        end_date = await findByGregorian(dtEnd, era_end)
      } else {
        if (!isValidHebrewDateFormat(start) || !isValidHebrewDateFormat(end)) {
          next(new HttpException(400, 'Invalid hebrew start or end date'))
          return
        }

        const dtStart = parseHebrewDate(start)
        const dtEnd = parseHebrewDate(end)

        start_date = await findByHebrew(dtStart)
        end_date = await findByHebrew(dtEnd)
      }

      if (!start_date || !end_date) {
        next(new HttpException(404, 'Start or end date not found'))
        return
      }

      const first = include_first_day ? 1 : 0
      const days =
        Math.abs(Number(end_date.day_index) - Number(start_date.day_index)) +
        first
      const new_moons =
        Math.abs(
          Number(end_date.month_index) - Number(start_date.month_index)
        ) + first
      const years_civil = Math.abs(Number(end_date.yy) - Number(start_date.yy))
      const diff = unit === 'new_moons' ? new_moons : days

      // fractional new moons: each date as month_index + (dd - 1) / days in its month, so
      // the 15th -> 15th of two 30-day months is N.0 and the 15th -> 14th is N.9667
      const position = async (row) => {
        const month = await findMonthByIndex(Number(row.month_index))
        const length = month ? month.last_dd : 30
        return Number(row.month_index) + (Number(row.dd) - 1) / length
      }
      const new_moons_fraction =
        Math.abs((await position(end_date)) - (await position(start_date))) + first

      if (!detail) {
        res.json(diff)
        logger.info('getDate Success')
        return
      }

      const pick = ({ gregorian, day_of_week, day_index, month_index, yy, mm, dd }) => ({
        gregorian,
        day_of_week,
        day_index: Number(day_index),
        month_index: Number(month_index),
        yy,
        mm,
        dd
      })

      res.json({
        unit,
        diff,
        days,
        new_moons,
        new_moons_fraction,
        years_civil,
        include_first_day: !!include_first_day,
        start: pick(start_date),
        end: pick(end_date)
      })

      logger.info('getDate Success')
    } catch (error: any) {
      logger.error(`getDate Error: ${JSON.stringify(error)}`)
      next(error)
    }
  }
}

export default DatesController
