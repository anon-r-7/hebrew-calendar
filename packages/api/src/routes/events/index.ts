import { Router } from 'express'
import { BaseRoute } from '@api/routes'
import authMiddleware from '@api/middleware/auth'
import Controller from './controller'

class Route implements BaseRoute {
  public path = '/events'
  public router = Router()
  public controller = new Controller()

  constructor() {
    this.initializeRoutes()
  }

  private initializeRoutes() {
    // everything here is behind the admin login
    this.router.get(`${this.path}`, authMiddleware, this.controller.list)
    this.router.post(`${this.path}`, authMiddleware, this.controller.create)
    this.router.patch(`${this.path}/:uuid`, authMiddleware, this.controller.update)
    this.router.delete(`${this.path}/:uuid`, authMiddleware, this.controller.remove)

    this.router.get(`${this.path}/pairs`, authMiddleware, this.controller.listPairs)
    this.router.post(`${this.path}/pairs`, authMiddleware, this.controller.createPair)
    this.router.patch(`${this.path}/pairs/:uuid`, authMiddleware, this.controller.updatePair)
    this.router.delete(`${this.path}/pairs/:uuid`, authMiddleware, this.controller.removePair)
  }
}

export default Route
