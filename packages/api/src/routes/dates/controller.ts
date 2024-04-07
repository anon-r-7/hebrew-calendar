import { NextFunction, Request, Response } from 'express'
import { logger } from '@api/utils/logger'
import HttpException from '@api/utils/HttpException'
import getByGregorian from './methods/getByGregorian'

class DatesController {
  public getDates = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const start = typeof req.query.start === 'string' ? req.query.start : ''
      const end = typeof req.query.end === 'string' ? req.query.end : ''

      const dtStart = new Date(start)
      const dtEnd = new Date(end)

      // Validate the date objects
      if (isNaN(dtStart.getTime()) || isNaN(dtEnd.getTime())) {
        next(new HttpException(400, 'Invalid start or end date'))
        return
      }

      const response = await getByGregorian(dtStart, dtEnd)

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
