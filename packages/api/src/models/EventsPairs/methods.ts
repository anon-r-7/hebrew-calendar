import { QueryTypes } from 'sequelize'
import Models from '@api/models'
import { mapSide } from './utils'
import { EventPairsParams } from './interface'

export const setFavorite = async (uuid: string, favorite: boolean) => {
  const pair = await Models.EventsPairs.findByPk(uuid)
  if (!pair) return null
  await pair.update({ favorite })
  return pair
}

export const listWithFilters = async (q: EventPairsParams) => {
  const page = Math.max(1, Number(q.page ?? 1))
  const limit = Math.min(500, Number(q.limit ?? 50))
  const offset = (page - 1) * limit

  const where: string[] = []
  const replacements: any = {}

  if (q.favorite !== undefined) {
    where.push('favorite = :fav')
    replacements.fav = q.favorite === 'true'
  }

  if (q.gregorian_from && q.gregorian_to) {
    where.push(
      `(a_gdate BETWEEN :gfrom AND :gto OR b_gdate BETWEEN :gfrom AND :gto)`
    )
    replacements.gfrom = q.gregorian_from
    replacements.gto = q.gregorian_to
  } else if (q.gregorian) {
    where.push('(a_gdate = :g OR b_gdate = :g)')
    replacements.g = q.gregorian
  } else {
    if (q.gregorian_before) {
      where.push('(a_gdate <= :gbefore OR b_gdate <= :gbefore)')
      replacements.gbefore = q.gregorian_before
    }
    if (q.gregorian_after) {
      where.push('(a_gdate >= :gafter OR b_gdate >= :gafter)')
      replacements.gafter = q.gregorian_after
    }
  }

  if (q.name) {
    where.push('(a_name ILIKE :nm OR b_name ILIKE :nm)')
    replacements.nm = `%${q.name}%`
  }

  if (q.tags) {
    const tags = q.tags.split(',').map((tag: string, i: number) => {
      const key = `tag${i}`
      replacements[key] = `%${tag.trim()}%`
      return `(a_tags ILIKE :${key} OR b_tags ILIKE :${key})`
    })
    where.push(tags.join(' AND '))
  }

  const uuidKeys = ['events_entry_uuid', 'hebrew_events_uuid', 'create_by_uuid']
  for (const key of uuidKeys) {
    const value = q[key as keyof EventPairsParams]
    if (value) {
      where.push(
        `(${['a', 'b']
          .map((letter, i) => `${letter}_${key} = :${key}${i}`)
          .join(' OR ')})`
      )
      ;['a', 'b'].forEach((letter, i) => {
        replacements[`${key}${i}`] = value
      })
    }
  }

  if (q.exact_rev_years === 'true') where.push('exact_rev_years = true')
  if (q.exact_enoch_years === 'true') where.push('exact_enoch_years = true')
  if (q.exact_weeks === 'true') where.push('exact_weeks = true')

  if (q.enochian_years) {
    where.push('enoch_years = :ey')
    replacements.ey = Number(q.enochian_years)
  }

  if (q.revelation_years) {
    where.push('rev_years = :ry')
    replacements.ry = Number(q.revelation_years)
  }

  if (q.weeks) {
    where.push('weeks = :w')
    replacements.w = Number(q.weeks)
  }

  if (q.events_pairs_uuid) {
    where.push('uuid = :uuid')
    replacements.uuid = q.events_pairs_uuid
  }

  const whereSQL = where.length ? `WHERE ${where.join(' AND ')}` : ''

  const orderKey = q.order ?? 'diff'
  const orderSQL =
    {
      diff: 'ORDER BY diff ASC',
      diff_desc: 'ORDER BY diff DESC',
      gregorian: 'ORDER BY a_gdate ASC',
      gregorian_desc: 'ORDER BY a_gdate DESC'
    }[orderKey] ?? 'ORDER BY diff ASC'

  const rowsRaw: any[] = await Models.sequelize.query(
    `
    SELECT *
    FROM events_pair_view
    ${whereSQL}
    ${orderSQL}
    OFFSET :off LIMIT :lim
    `,
    {
      replacements: { ...replacements, off: offset, lim: limit },
      type: QueryTypes.SELECT
    }
  )

  const [{ count }] = (await Models.sequelize.query(
    `SELECT COUNT(*)::bigint AS count FROM events_pair_view ${whereSQL}`,
    { replacements, type: QueryTypes.SELECT }
  )) as any[]

  const rows = rowsRaw.map((r) => ({
    events_pairs_uuid: r.uuid,
    favorite: r.favorite,
    calculations: {
      diff: r.diff,
      half_days: r.half_days,
      weeks: Number(r.weeks),
      revelation_years: Number(r.rev_years),
      enochian_years: Number(r.enoch_years)
    },
    isExact: {
      weeks: r.exact_weeks,
      revelation_years: r.exact_rev_years,
      enochian_years: r.exact_enoch_years
    },
    dates: [mapSide('a', r), mapSide('b', r)]
  }))

  const hasNext = offset + limit < Number(count)
  const hasPrev = page > 1

  return {
    meta: {
      count: { total: Number(count), current: rows.length },
      page: {
        current: page,
        next: hasNext ? page + 1 : null,
        prev: hasPrev ? page - 1 : null,
        limit
      }
    },
    rows
  }
}
