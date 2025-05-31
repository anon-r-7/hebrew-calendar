import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import { findByEmail } from '@api/models/User/methods'
import HttpException from '@api/utils/HttpException'

const JWT_SECRET = process.env.JWT_SECRET!

class AuthController {
  public login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body
      const user = await findByEmail(email)

      if (!user || !(await bcrypt.compare(password, user.password))) {
        return next(new HttpException(401, 'Invalid credentials'))
      }

      const token = jwt.sign({ sub: user.uuid }, JWT_SECRET, {
        expiresIn: '8h'
      })
      res.json({ token })
    } catch (err) {
      next(err)
    }
  }
}

export default AuthController
