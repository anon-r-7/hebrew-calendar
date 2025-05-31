import { Router } from 'express'

import Dates from './dates'
import Events from './events'
import Auth from './auth'

export interface BaseRoute {
  path?: string
  router: Router
}

export default [new Dates(), new Events(), new Auth()]
