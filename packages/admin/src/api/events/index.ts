import { client } from '../client'
import * as Request from './interface'

const baseUrl = '/events'

const getParams = (payload: Record<string, any>) =>
  new URLSearchParams(payload as any).toString()

export default {
  getUsers: async (): Promise<any> => {
    const { data } = await client.get(`${baseUrl}/users`)
    return data
  },

  createEntry: async (payload: Request.CreateEntry): Promise<any> => {
    const { data } = await client.post(`${baseUrl}/entry`, payload)
    return data
  },

  updateEntry: async (
    uuid: string,
    payload: Request.UpdateEntry
  ): Promise<any> => {
    const { data } = await client.patch(`${baseUrl}/entry/${uuid}`, payload)
    return data
  },

  getEntries: async (payload: Request.GetEntries): Promise<any> => {
    const params = getParams(payload)
    const { data } = await client.get(`${baseUrl}/entry?${params}`)
    return data
  },

  deleteEntry: async (uuid: string): Promise<any> => {
    const { data } = await client.delete(`${baseUrl}/entry/${uuid}`)
    return data
  },

  postSync: async (): Promise<any> => {
    const { data } = await client.post(`${baseUrl}/sync`)
    return data
  },

  getSync: async (): Promise<any> => {
    const { data } = await client.get(`${baseUrl}/sync`)
    return data
  },

  updatePair: async (
    uuid: string,
    payload: Request.UpdatePair
  ): Promise<any> => {
    const { data } = await client.patch(`${baseUrl}/pair/${uuid}`, payload)
    return data
  },

  getPairs: async (payload: Request.GetPairsParams): Promise<any> => {
    const params = getParams(payload)
    const { data } = await client.get(`${baseUrl}/pair?${params}`)
    return data
  },

  getFilterMeta: async (): Promise<any> => {
    const { data } = await client.get(`${baseUrl}/filter-meta`)
    return data
  }
}
