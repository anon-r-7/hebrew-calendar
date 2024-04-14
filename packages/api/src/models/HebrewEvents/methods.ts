import Models from '@api/models'
import { HebrewEventsModel } from '@api/models/HebrewEvents'

export const findByName = async (name: string): Promise<HebrewEventsModel> => {
  return Models.HebrewEvents.findOne({
    where: {
      name
    }
  })
}

export const findByShortName = async (
  short_name: string
): Promise<HebrewEventsModel> => {
  return Models.HebrewEvents.findOne({
    where: {
      short_name
    }
  })
}

export const findAll = async (): Promise<HebrewEventsModel[]> => {
  return Models.HebrewEvents.findAll()
}
