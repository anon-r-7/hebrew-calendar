import { NextFunction, Request, Response } from 'express'

import { logger } from '@api/utils/logger'
import HttpException from '@api/utils/HttpException'
import { findAllByGregorian } from './methods/gregorian'
import {
  findAllByHebrew,
  isValidHebrewDateFormat,
  parseHebrewDate
} from './methods/hebrew'

class DatesController {
  public getDates = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const type = typeof req.query.type === 'string' ? req.query.type : ''
      const start = typeof req.query.start === 'string' ? req.query.start : ''
      const end = typeof req.query.end === 'string' ? req.query.end : ''
      let response

      if (type !== 'hebrew') {
        const dtStart = new Date(start)
        const dtEnd = new Date(end)

        if (isNaN(dtStart.getTime()) || isNaN(dtEnd.getTime())) {
          next(new HttpException(400, 'Invalid start or end date'))
          return
        }

        response = await findAllByGregorian(dtStart, dtEnd)
      } else {
        if (!isValidHebrewDateFormat(start) || !isValidHebrewDateFormat(end)) {
          next(new HttpException(400, 'Invalid start or end Hebrew date'))
          return
        }

        response = await findAllByHebrew(
          parseHebrewDate(start),
          parseHebrewDate(end)
        )
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
}

export default DatesController
