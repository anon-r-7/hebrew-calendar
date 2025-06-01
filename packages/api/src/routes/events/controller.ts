import { Request, Response, NextFunction } from 'express'
import HttpException from '@api/utils/HttpException'
import * as EntryService from '@api/models/EventsEntry/methods'
import * as PairService from '@api/models/EventsPairs/methods'
import * as SyncService from '@api/services/EventSync'

class EventsController {
  /* POST /events/entry */
  public createEntry = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { type, date, name, description, tags } = req.body
      const userId = req.auth!.sub

      const record = await EntryService.create({
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
      const { name, description } = req.body
      const record = await EntryService.update(req.params.uuid, {
        name,
        description
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
      const list = await EntryService.list({
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
      await EntryService.removeCascade(req.params.uuid)
      res.status(204).send()
    } catch (err) {
      next(err)
    }
  }

  /* POST /event_entry/sync */
  public sync = async (_req: Request, res: Response) => {
    SyncService.enqueue()
    res.status(202).json({ queued: true })
  }

  /* GET /event_entry/sync */
  public syncStatus = (_req: Request, res: Response) => {
    res.json({ syncing: SyncService.isRunning() })
  }

  /* PATCH /event_pair/:uuid { favorite } */
  public updatePair = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { favorite } = req.body
      const pair = await PairService.setFavorite(req.params.uuid, favorite)
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
      const result = await PairService.listWithFilters(req.query)
      res.json(result)
    } catch (err) {
      next(err)
    }
  }
}

export default EventsController
