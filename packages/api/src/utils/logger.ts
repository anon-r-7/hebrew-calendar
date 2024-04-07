import fs from 'fs'
import winston from 'winston'
import winstonDaily from 'winston-daily-rotate-file'

// logs dir
const logDir = `${__dirname}/../logs`

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir)
}

// Define log format
const logFormat = winston.format.printf(
  ({ timestamp, level, message }) =>
    `${timestamp} ${level}: ${JSON.stringify(message)}`
)

/*
 * Log Level
 * error: 0, warn: 1, info: 2, http: 3, verbose: 4, debug: 5, silly: 6
 */
const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    logFormat
  ),
  transports: [
    // debug log setting
    // eslint-disable-next-line
    new winstonDaily({
      level: 'debug',
      datePattern: 'YYYY-MM-DD',
      dirname: `${logDir}/debug`, // log file /logs/debug/*.log in save
      filename: `%DATE%.log`,
      maxFiles: 30, // 30 Days saved
      json: false,
      zippedArchive: true
    }),
    // error log setting
    // eslint-disable-next-line
    new winstonDaily({
      level: 'error',
      datePattern: 'YYYY-MM-DD',
      dirname: `${logDir}/error`, // log file /logs/error/*.log in save
      filename: `%DATE%.log`,
      maxFiles: 30, // 30 Days saved
      handleExceptions: true,
      json: false,
      zippedArchive: true
    })
  ]
})

logger.add(
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.splat(),
      winston.format.colorize()
    )
  })
)

const stream = {
  write: (message: string) => {
    logger.info(message.substring(0, message.lastIndexOf('\n')))
  }
}

const progress = (i, l, message) => {
  try {
    const percent = (((i + 1) / l) * 100).toFixed(0)
    process.stdout.clearLine(0)
    process.stdout.cursorTo(0)
    process.stdout.write(`(${percent.toString()}%) ${message}`)
    if (i === l) process.stdout.write('\n')
  } catch (error) {
    const percent = (((i + 1) / l) * 100).toFixed(0)
    process.stdout.write('\n')
    process.stdout.write(`(${percent.toString()}%) ${message}`)
  }
}

export { logger, stream, progress }
