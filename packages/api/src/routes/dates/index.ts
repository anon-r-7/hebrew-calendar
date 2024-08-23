import { Router } from 'express'
import { BaseRoute } from '@api/routes'
import Controller from './controller'

class Route implements BaseRoute {
  public path = '/dates'
  public router = Router()
  public controller = new Controller()

  constructor() {
    this.initializeRoutes()
  }

  private initializeRoutes() {
    // GET /dates
    this.router.get(`${this.path}`, this.controller.getDates)

    // GET /dates/days-from-date
    this.router.get(
      `${this.path}/days-from-date`,
      this.controller.getDaysFromDate
    )
  }
}

export default Route
