import axios, { AxiosResponse } from 'axios'

export default class SomeAPI {
  public static async someMethod(): Promise<AxiosResponse<any, any>> {
    try {
      const url = `https://someurl?api_key=${process.env.MYVAR}`
      const response = await axios.get(url)
      return response
    } catch (error) {
      throw new Error(`Failed to call someMethod on SomeAPI`)
    }
  }
}
