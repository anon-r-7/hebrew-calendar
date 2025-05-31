import { Router } from 'express'
import { BaseRoute } from '@api/routes'
import Controller from './controller'
import authGuard from '@api/middleware/auth' // todo

class Route implements BaseRoute {
  public path = '/events'
  public router = Router()
  public controller = new Controller()

  constructor() {
    this.initializeRoutes()
  }

  private initializeRoutes() {
    this.router.post(
      `${this.path}/entry`,
      authGuard,
      this.controller.createEntry
    )
    this.router.patch(
      `${this.path}/entry/:uuid`,
      authGuard,
      this.controller.updateEntry
    )
    this.router.get(`${this.path}/entry`, authGuard, this.controller.listEntry)
    this.router.delete(
      `${this.path}/entry/:uuid`,
      authGuard,
      this.controller.removeEntry
    )

    this.router.post(`${this.path}/sync`, authGuard, this.controller.sync)
    this.router.get(`${this.path}/sync`, authGuard, this.controller.syncStatus)

    this.router.patch(
      `${this.path}/pair/:uuid`,
      authGuard,
      this.controller.updatePair
    )
    this.router.get(`${this.path}/pair`, authGuard, this.controller.listPairs)
  }
}

export default Route
