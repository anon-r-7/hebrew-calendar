import { Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import HttpException from '@api/utils/HttpException'
import { AuthRequest } from '@api/types/express/AuthRequest'

const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const JWT_SECRET = process.env.JWT_SECRET

    if (!JWT_SECRET) {
      console.error('[authMiddleware] Missing JWT_SECRET — auth will not work')
      throw new Error('JWT_SECRET not defined')
    }

    const authorization = req.headers.authorization || ''
    const token = authorization.replace('Bearer ', '').trim()

    if (!token) {
      console.error('[authMiddleware] No token provided')
      next(new HttpException(401, 'No token provided'))
      return
    }

    const payload = jwt.verify(token, JWT_SECRET) as any

    req.auth = payload
    next()
  } catch (err: any) {
    console.error('[authMiddleware] Token verification failed:', err)
    if (err.name === 'TokenExpiredError') {
      next(new HttpException(401, 'Token expired'))
      return
    }
    next(new HttpException(401, 'Unauthorized'))
  }
}

export default authMiddleware
