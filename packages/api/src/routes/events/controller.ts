import { Request, Response, NextFunction } from 'express'
import HttpException from '@api/utils/HttpException'

import * as UserMethods from '@api/models/User/methods'
import * as EventsEntryMethods from '@api/models/EventsEntry/methods'
import * as EventsPairsMethods from '@api/models/EventsPairs/methods'
import * as HebrewEventsMethods from '@api/models/HebrewEvents/methods'

import * as SyncService from '@api/services/EventSync'

import { AuthRequest } from '@api/types/express/AuthRequest'

class EventsController {
  /* POST /events/users */
  public getUsers = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const records = await UserMethods.findAll()
      res.status(201).json(records)
    } catch (err) {
      next(err)
    }
  }

  /* POST /events/entry */
  public createEntry = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { type, date, name, description, tags } = req.body
      const userId = req.auth!.sub

      const record = await EventsEntryMethods.create({
        type,
        date,
        name,
        description,
        tags,
        created_by: userId
      })

      res.status(201).json(record)
    } catch (err) {
      next(err)
    }
  }

  /* PATCH /events/entry/:uuid */
  public updateEntry = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { name, description, tags } = req.body
      const record = await EventsEntryMethods.update(req.params.uuid, {
        name,
        description,
        tags
      })
      if (!record) return next(new HttpException(404, 'Entry not found'))
      res.json(record)
    } catch (err) {
      next(err)
    }
  }

  /* GET /events/entry?created_by=&page=&size= */
  public listEntry = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { created_by, page = 1, size = 50 } = req.query

      const list = await EventsEntryMethods.list({
        created_by: created_by as string,
        page: Number(page),
        size: Number(size)
      })
      res.json(list)
    } catch (err) {
      next(err)
    }
  }

  /* DELETE /events/entry/:uuid */
  public removeEntry = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      await EventsEntryMethods.removeCascade(req.params.uuid)
      res.status(201).send({ success: true })
    } catch (err) {
      next(err)
    }
  }

  /* POST /event_entry/sync */
  public sync = async (_req: Request, res: Response) => {
    SyncService.enqueue()
    res.json(SyncService.getStatus())
  }

  /* GET /event_entry/sync */
  public syncStatus = (_req: Request, res: Response) => {
    res.json(SyncService.getStatus())
  }

  /* PATCH /event_pair/:uuid { favorite } */
  public updatePair = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { favorite } = req.body
      const pair = await EventsPairsMethods.setFavorite(
        req.params.uuid,
        favorite
      )
      if (!pair) return next(new HttpException(404, 'Pair not found'))
      res.json(pair)
    } catch (err) {
      next(err)
    }
  }

  /* GET /event_pair?...filters... */
  public listPairs = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const result = await EventsPairsMethods.listWithFilters(req.query)
      res.json(result)
    } catch (err) {
      next(err)
    }
  }

  /* GET /filter_meta */
  public getFilterMeta = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const events = await HebrewEventsMethods.findForEvents()
      const users = await UserMethods.findAll()
      const entries = await EventsEntryMethods.findMeta()

      res.json({
        events,
        users: users.map((user) => ({
          uuid: user.uuid,
          name: `${user.first_name} ${user.last_name}`
        })),
        entries
      })
    } catch (err) {
      next(err)
    }
  }
}

export default EventsController
