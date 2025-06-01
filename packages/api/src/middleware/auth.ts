import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import HttpException from '@api/utils/HttpException'

export default function authGuard(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  try {
    const authorization = req.headers.authorization || ''
    const token = authorization.replace('Bearer ', '')
    if (!token) throw new Error()

    const payload = jwt.verify(token, process.env.JWT_SECRET!) as any
    ;(req as any).auth = payload
    next()
  } catch {
    next(new HttpException(401, 'Unauthorized'))
  }
}
