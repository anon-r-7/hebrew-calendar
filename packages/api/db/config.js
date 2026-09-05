const params = {
  host: process.env.DB_ENDPOINT,
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.POSTGRES_DB,
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  dialect: 'postgres',
}

module.exports = {
  development: params,
  test: params,
  production: params,
}
