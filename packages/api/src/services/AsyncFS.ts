import fs, { closeSync, openSync } from 'fs'
import { promisify } from 'util'

interface Config {
  base?: string
  path: string
}

export default class AsyncFS {
  private base
  private path
  private readFile = promisify(fs.readFile)
  private writeFile = promisify(fs.writeFile)

  constructor({ base, path }: Config) {
    this.base = base ? base : ''
    this.path = path
  }

  public async read() {
    try {
      const response = await this.readFile(
        `${__dirname}/../../tmp/${this.path}`,
        'utf-8'
      )
      return response
    } catch (error) {
      return null
    }
  }

  public async write(data: any) {
    try {
      const dirPath = `tmp/${this.base}`
      if (dirPath) {
        const baseExists = fs.existsSync(dirPath)
        if (!baseExists) {
          fs.mkdirSync(dirPath)
        }
      }

      const filePath = `${dirPath}/${this.path}`
      const exists = fs.existsSync(filePath)
      if (!exists) {
        closeSync(openSync(filePath, 'w'))
      }
      const response = await this.writeFile(filePath, data)
      return response
    } catch (error) {
      throw new Error(`Problem writing ${this.path}: ${error}`)
    }
  }

  public async remove({ base }) {
    try {
      fs.unlinkSync(this.path)
      if (base) fs.rmSync(this.base, { recursive: true, force: true })
    } catch (error) {
      throw new Error(`Problem removing ${this.path}: ${error}`)
    }
  }
}
