import 'express'

declare module 'express-serve-static-core' {
  interface Request {
    /** added by auth-middleware */
    auth?: { sub: string }
  }
}
