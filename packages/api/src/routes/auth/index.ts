import { Router } from 'express'
import { BaseRoute } from '@api/routes'
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
  }
}

export default Route
