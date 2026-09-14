import { Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import { findByEmail, findByUuid } from '@api/models/User/methods'
import HttpException from '@api/utils/HttpException'
import { AuthRequest } from '@api/types/express/AuthRequest'

const JWT_SECRET = process.env.JWT_SECRET!

// sessions last until the user logs out (any number of devices)
const TOKEN_TTL = '3650d'

const publicUser = (user) => ({
  uuid: user.uuid,
  email: user.email,
  first_name: user.first_name,
  last_name: user.last_name
})

class AuthController {
  public login = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body || {}
      const user = email && password ? await findByEmail(String(email)) : null

      if (!user || !(await bcrypt.compare(String(password), user.password))) {
        return next(new HttpException(401, 'Invalid credentials'))
      }

      const token = jwt.sign({ sub: user.uuid }, JWT_SECRET, { expiresIn: TOKEN_TTL })
      res.json({ token, user: publicUser(user) })
    } catch (err) {
      next(err)
    }
  }

  /** who the bearer token belongs to (401 if it is not valid) */
  public me = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const user = req.auth?.sub ? await findByUuid(req.auth.sub) : null
      if (!user) return next(new HttpException(401, 'Unauthorized'))
      res.json(publicUser(user))
    } catch (err) {
      next(err)
    }
  }
}

export default AuthController
