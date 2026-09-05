import { Op } from 'sequelize'
import Models from '@api/models'
import { HebrewEventsModel } from '@api/models/HebrewEvents'
import { SYSTEM_EVENT_SHORT_NAMES } from '@api/constants/systemEvents'

export const findByName = async (name: string): Promise<HebrewEventsModel> => {
  return Models.HebrewEvents.findOne({
    where: {
      name
    }
  })
}

export const findForEvents = async () => {
  const response = await Models.HebrewEvents.findAll({
    where: {
      short_name: {
        [Op.in]: [...SYSTEM_EVENT_SHORT_NAMES]
      }
    },
    order: [['name', 'ASC']]
  })

  return response.map(({ uuid, name }) => ({ uuid, name }))
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
