import { Request } from 'express'

export interface AuthRequest extends Request {
  auth?: {
    sub: string
    [key: string]: any
  }
}
