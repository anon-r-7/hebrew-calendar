import { Router } from 'express'

import Dates from './dates'

export interface BaseRoute {
  path?: string
  router: Router
}

export default [new Dates()]
