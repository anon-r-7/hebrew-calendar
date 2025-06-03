import { Router } from 'express'
import { BaseRoute } from '@api/routes'
import authMiddlware from '@api/middleware/auth'

let controllerInstance
try {
  const Controller = require('./controller').default
  controllerInstance = new Controller()
} catch (err) {
  console.error('[events route] Failed to instantiate controller:', err)
  throw err
}

class Route implements BaseRoute {
  public path = '/events'
  public router = Router()
  public controller = controllerInstance

  constructor() {
    try {
      this.initializeRoutes()
    } catch (err) {
      console.error('[events route] Failed during route initialization:', err)
      throw err
    }
  }

  private initializeRoutes() {
    try {
      this.router.get(
        `${this.path}/users`,
        authMiddlware,
        this.controller.getUsers
      )
      this.router.post(
        `${this.path}/entry`,
        authMiddlware,
        this.controller.createEntry
      )
      this.router.patch(
        `${this.path}/entry/:uuid`,
        authMiddlware,
        this.controller.updateEntry
      )
      this.router.get(
        `${this.path}/entry`,
        authMiddlware,
        this.controller.listEntry
      )
      this.router.delete(
        `${this.path}/entry/:uuid`,
        authMiddlware,
        this.controller.removeEntry
      )
      this.router.post(`${this.path}/sync`, authMiddlware, this.controller.sync)
      this.router.get(
        `${this.path}/sync`,
        authMiddlware,
        this.controller.syncStatus
      )
      this.router.patch(
        `${this.path}/pair/:uuid`,
        authMiddlware,
        this.controller.updatePair
      )
      this.router.get(
        `${this.path}/pair`,
        authMiddlware,
        this.controller.listPairs
      )
    } catch (err) {
      console.error('[events route] Error registering routes:', err)
      throw err
    }
  }
}

export default Route
