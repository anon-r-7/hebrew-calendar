import { Response, NextFunction } from 'express'

import HttpException from '@api/utils/HttpException'
import { AuthRequest } from '@api/types/express/AuthRequest'
import { createSafeJsDate, isValidHebrewDateFormat, parseHebrewDate } from '@api/utils/dates'
import { findByGregorian, findByHebrew } from '@api/models/HebrewDates/methods'
import * as Events from '@api/models/Events/methods'
import * as Pairs from '@api/models/EventsPairs/methods'

class EventsController {
  public list = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const search = typeof req.query.q === 'string' ? req.query.q.trim() : ''
      res.json(await Events.listEvents(search))
    } catch (err) {
      next(err)
    }
  }

  /** body: { name, description?, type: 'gregorian' | 'hebrew', date: 'YYYY-MM-DD', era?: 'ad' | 'bc' } */
  public create = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { name, description, type, date, era } = req.body || {}
      if (!name || typeof name !== 'string' || !name.trim()) {
        return next(new HttpException(400, 'Name is required'))
      }
      if (!date || typeof date !== 'string') {
        return next(new HttpException(400, 'Date is required'))
      }

      let row
      if (type === 'hebrew') {
        if (!isValidHebrewDateFormat(date)) return next(new HttpException(400, 'Invalid hebrew date'))
        row = await findByHebrew(parseHebrewDate(date))
      } else {
        const dt = createSafeJsDate(date)
        if (isNaN(dt.getTime())) return next(new HttpException(400, 'Invalid gregorian date'))
        row = await findByGregorian(dt, era === 'bc' ? 'bc' : 'ad')
      }
      if (!row) return next(new HttpException(404, 'Date not found in the calendar'))

      const event = await Events.createEvent({
        name: name.trim(),
        description: typeof description === 'string' && description.trim() ? description.trim() : null,
        hebrew_date: row.uuid,
        created_by: req.auth?.sub || null
      })
      res.status(201).json(event)
    } catch (err) {
      next(err)
    }
  }

  /** body: any of { name, description, type, date, era }; a new date re-links the event to
   *  another hebrew_dates row, and every pair built on it recalculates on its next read */
  public update = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { name, description, type, date, era } = req.body || {}
      const values: { name?: string; description?: string | null; hebrew_date?: string } = {}
      if (name !== undefined) {
        if (typeof name !== 'string' || !name.trim()) return next(new HttpException(400, 'Name is required'))
        values.name = name.trim()
      }
      if (description !== undefined) {
        values.description = typeof description === 'string' && description.trim() ? description.trim() : null
      }
      if (date !== undefined) {
        let row
        if (type === 'hebrew') {
          if (!isValidHebrewDateFormat(date)) return next(new HttpException(400, 'Invalid hebrew date'))
          row = await findByHebrew(parseHebrewDate(date))
        } else {
          const dt = createSafeJsDate(String(date))
          if (isNaN(dt.getTime())) return next(new HttpException(400, 'Invalid gregorian date'))
          row = await findByGregorian(dt, era === 'bc' ? 'bc' : 'ad')
        }
        if (!row) return next(new HttpException(404, 'Date not found in the calendar'))
        values.hebrew_date = row.uuid
      }
      const event = await Events.updateEvent(req.params.uuid, values)
      if (!event) return next(new HttpException(404, 'Event not found'))
      // the stored maths of every pair this event is in follow its new date
      if (values.hebrew_date) await Pairs.recalcPairs({ event: req.params.uuid })
      res.json(event)
    } catch (err) {
      next(err)
    }
  }

  public remove = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const removed = await Events.deleteEvent(req.params.uuid)
      if (!removed) return next(new HttpException(404, 'Event not found'))
      res.status(204).end()
    } catch (err) {
      next(err)
    }
  }

  /** query: event, q, field, min, max, whole, divisible_by, sort, dir, limit, offset */
  public listPairs = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const s = (k: string) => (typeof req.query[k] === 'string' ? (req.query[k] as string) : undefined)
      const n = (k: string) => (s(k) !== undefined && s(k) !== '' ? Number(s(k)) : undefined)
      res.json(
        await Pairs.listPairs({
          event: s('event'),
          favorite: s('favorite') === 'true',
          q: s('q'),
          field: s('field') as any,
          min: n('min'),
          max: n('max'),
          whole: s('whole') === 'true',
          divisible_by: n('divisible_by'),
          sort: s('sort') as any,
          dir: s('dir') === 'asc' ? 'asc' : 'desc',
          limit: n('limit'),
          offset: n('offset')
        })
      )
    } catch (err) {
      next(err)
    }
  }

  /** body: { a, b, include_first_day? } */
  public createPair = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { a, b, include_first_day } = req.body || {}
      if (!a || !b) return next(new HttpException(400, 'Both events are required'))
      if (a === b) return next(new HttpException(400, 'Pick two different events'))
      const [ea, eb] = await Promise.all([Events.findEvent(a), Events.findEvent(b)])
      if (!ea || !eb) return next(new HttpException(404, 'Event not found'))

      try {
        const pair = await Pairs.createPair({
          a,
          b,
          include_first_day: include_first_day === true || include_first_day === 'true',
          created_by: req.auth?.sub || null
        })
        res.status(201).json(pair)
      } catch (err: any) {
        if (err?.name === 'SequelizeUniqueConstraintError') {
          return next(new HttpException(409, 'That pair already exists'))
        }
        throw err
      }
    } catch (err) {
      next(err)
    }
  }

  /** body: { favorite?: boolean, include_first_day?: boolean } — favorite is a global flag shared
   *  by all users; include_first_day recomputes the pair's stored measures */
  public updatePair = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { favorite, include_first_day } = req.body || {}
      const values: { favorite?: boolean; include_first_day?: boolean } = {}
      if (favorite !== undefined) {
        if (typeof favorite !== 'boolean') return next(new HttpException(400, 'favorite must be true or false'))
        values.favorite = favorite
      }
      if (include_first_day !== undefined) {
        if (typeof include_first_day !== 'boolean') return next(new HttpException(400, 'include_first_day must be true or false'))
        values.include_first_day = include_first_day
      }
      if (!Object.keys(values).length) return next(new HttpException(400, 'Nothing to update'))
      try {
        const pair = await Pairs.updatePair(req.params.uuid, values)
        if (!pair) return next(new HttpException(404, 'Pair not found'))
        res.json(pair)
      } catch (err: any) {
        if (err?.name === 'SequelizeUniqueConstraintError') {
          return next(new HttpException(409, 'That pair already exists with the first day counted that way'))
        }
        throw err
      }
    } catch (err) {
      next(err)
    }
  }

  public removePair = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const removed = await Pairs.deletePair(req.params.uuid)
      if (!removed) return next(new HttpException(404, 'Pair not found'))
      res.status(204).end()
    } catch (err) {
      next(err)
    }
  }
}

export default EventsController
