import { Router } from 'express'
import { BaseRoute } from '@api/routes'
import authMiddleware from '@api/middleware/auth'
import Controller from './controller'

class Route implements BaseRoute {
  public path = '/auth'
  public router = Router()
  public controller = new Controller()

  constructor() {
    this.initializeRoutes()
  }

  private initializeRoutes() {
    this.router.post(`${this.path}`, this.controller.login)
    this.router.get(`${this.path}/me`, authMiddleware, this.controller.me)
  }
}

export default Route
