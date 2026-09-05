#!/usr/bin/env node
// Reset a user's password in the users table.
//
// Run from the repo root (after `yarn install`, so pg and bcrypt are available):
//   node reset_password.js rpostrom@gmail.com               # prompts for password (hidden)
//   node reset_password.js rpostrom@gmail.com 'newPassword'
//
// DB connection comes from DB_ENDPOINT / POSTGRES_DB / POSTGRES_USER / POSTGRES_PASSWORD.
// If they are not already in the environment, the script reads them from .envrc
// (path from ENVRC, or ./.envrc by default).

const fs = require('fs')
const path = require('path')
const readline = require('readline')

// pg and bcrypt are deps of packages/api; yarn normally hoists them to the root
// node_modules, but fall back to the package's own node_modules just in case.
const requireDep = (name) => {
  try { return require(name) } catch {}
  return require(path.join(__dirname, 'packages', 'api', 'node_modules', name))
}
const { Client } = requireDep('pg')
const bcrypt = requireDep('bcrypt')

const loadEnvrc = () => {
  const file = process.env.ENVRC || path.resolve('.envrc')
  if (!fs.existsSync(file)) return
  for (const raw of fs.readFileSync(file, 'utf8').split('\n')) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const m = line.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)=(.*)$/)
    if (!m) continue
    let value = m[2].trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    if (process.env[m[1]] === undefined) process.env[m[1]] = value
  }
}

const readHidden = (prompt) =>
  new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true })
    process.stdout.write(prompt)
    rl._writeToOutput = () => {}
    rl.question('', (answer) => {
      process.stdout.write('\n')
      rl.close()
      resolve(answer)
    })
  })

const main = async () => {
  const email = process.argv[2]
  if (!email) {
    console.error('Usage: node reset_password.js <email> [newPassword]')
    process.exit(1)
  }
  const password = process.argv[3] || (await readHidden('New password: '))
  if (!password) {
    console.error('Password cannot be empty')
    process.exit(1)
  }

  loadEnvrc()
  for (const key of ['DB_ENDPOINT', 'POSTGRES_DB', 'POSTGRES_USER', 'POSTGRES_PASSWORD']) {
    if (!process.env[key]) {
      console.error(`Missing ${key} (set it in the environment or in .envrc)`)
      process.exit(1)
    }
  }

  const hash = await bcrypt.hash(password, 10)

  const client = new Client({
    host: process.env.DB_ENDPOINT,
    port: Number(process.env.DB_PORT || 5432),
    database: process.env.POSTGRES_DB,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
  })
  await client.connect()
  try {
    const { rowCount } = await client.query(
      'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE email = $2',
      [hash, email]
    )
    if (rowCount === 0) {
      console.error(`No user found with email ${email}`)
      process.exit(1)
    }
    console.log(`Password updated for ${email}`)
  } finally {
    await client.end()
  }
}

main().catch((err) => {
  console.error(err.message || err)
  process.exit(1)
})
