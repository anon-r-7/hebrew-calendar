import { Op, WhereOptions } from 'sequelize'
import models from '@api/models'
const { EventPairs, Events } = models

export async function setFavorite(uuid: string, favorite: boolean) {
  const pair = await EventPairs.findByPk(uuid)
  if (!pair) return null
  await pair.update({ favorite })
  return pair
}

/* naive but flexible filter builder */
export async function listWithFilters(q: Record<string, any>) {
  const where: WhereOptions = {}

  if (q.favorite !== undefined) where.favorite = q.favorite === 'true'

  if (q.created_by) {
    // at least one side created_by
    where[Op.or] = [
      { '$eventA.created_by$': q.created_by },
      { '$eventB.created_by$': q.created_by }
    ]
  }

  /* range filters on diff */
  if (q.days_min || q.days_max) {
    where.diff = {
      ...(q.days_min && { [Op.gte]: Number(q.days_min) }),
      ...(q.days_max && { [Op.lte]: Number(q.days_max) })
    }
  }

  /* add more filters as required */

  return EventPairs.findAndCountAll({
    where,
    include: [
      { model: Events, as: 'eventA' },
      { model: Events, as: 'eventB' }
    ],
    order: [['diff', 'ASC']],
    offset: Number(q.offset ?? 0),
    limit: Number(q.limit ?? 50)
  })
}
