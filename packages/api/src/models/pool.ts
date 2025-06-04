// src/models/pool.ts  (unchanged)
import { Pool } from 'pg'
export const pgPool = new Pool({
  host: process.env.DB_ENDPOINT,
  database: process.env.POSTGRES_DB,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD
})

// template-literal helper (optional)
export const sql = (strings: TemplateStringsArray, ...vals: unknown[]) =>
  pgPool.query(strings.join('$'), vals)
