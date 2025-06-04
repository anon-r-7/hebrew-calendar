import { Op } from 'sequelize'
import Models from '@api/models'
import { HebrewEventsModel } from '@api/models/HebrewEvents'

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
        [Op.in]: [
          'tisha_bav',
          'matzot',
          'pesach',
          'yom_kippur',
          'yom_teruah',
          'sukkot',
          'shavuot',
          'yom_bikkurim',
          'rosh_chodesh',
          'chanukkah'
        ]
      }
    }
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
