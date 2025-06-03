import { QueryTypes } from 'sequelize'
import Models from '@api/models'
import { mapSide } from './utils'
import { EventPairsParams } from './interface'

export const setFavorite = async (uuid: string, favorite: string) => {
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

  if (q.events_pairs_uuid) {
    where.push('uuid = :events_pairs_uuid')
    replacements.events_pairs_uuid = q.events_pairs_uuid
  }

  const gSrc = q.gregorian_source === 'user' ? 'user' : 'system'

  if (q.gregorian_from && q.gregorian_to) {
    where.push(`(
      (a_source = :gsrc AND a_gdate BETWEEN :gfrom AND :gto)
      OR
      (b_source = :gsrc AND b_gdate BETWEEN :gfrom AND :gto)
    )`)
    replacements.gsrc = gSrc
    replacements.gfrom = q.gregorian_from
    replacements.gto = q.gregorian_to
  } else if (q.gregorian) {
    where.push(`(
      (a_source = :gsrc AND a_gdate = :g)
      OR
      (b_source = :gsrc AND b_gdate = :g)
    )`)
    replacements.gsrc = gSrc
    replacements.g = q.gregorian
  } else {
    if (q.gregorian_before) {
      where.push(`(
        (a_source = :gsrc AND a_gdate <= :gbefore)
        OR
        (b_source = :gsrc AND b_gdate <= :gbefore)
      )`)
      replacements.gsrc = gSrc
      replacements.gbefore = q.gregorian_before
    }
    if (q.gregorian_after) {
      where.push(`(
        (a_source = :gsrc AND a_gdate >= :gafter)
        OR
        (b_source = :gsrc AND b_gdate >= :gafter)
      )`)
      replacements.gsrc = gSrc
      replacements.gafter = q.gregorian_after
    }
  }

  if (q.exclude_after_feasts === 'true') {
    where.push(`(
      (a_system_meta IS NULL OR a_system_meta != 'after')
      AND
      (b_system_meta IS NULL OR b_system_meta != 'after')
    )`)
  }

  if (q.exclude_before_feasts === 'true') {
    where.push(`(
      (a_system_meta IS NULL OR a_system_meta != 'before')
      AND
      (b_system_meta IS NULL OR b_system_meta != 'before')
    )`)
  }

  if (q.tags) {
    const tags = q.tags.split(',').map((tag: string, i: number) => {
      const key = `tag${i}`
      replacements[key] = `%${tag.trim()}%`
      return `(a_tags ILIKE :${key} OR b_tags ILIKE :${key})`
    })
    where.push(tags.join(' AND '))
  }

  const uuidKeys = [
    'events_entry_uuid',
    'hebrew_events_uuid',
    'created_by_uuid'
  ]
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

  if (q.favorite === 'true') {
    where.push('ep.favorite = :fav')
    replacements.fav = true
  }

  if (q.name) {
    const words = q.name.trim().split(/\s+/).filter(Boolean)
    const conditions = words.map((word, i) => {
      const key = `name${i}`
      replacements[key] = `%${word}%`
      return `(ea.name ILIKE :${key} OR eb.name ILIKE :${key})`
    })
    where.push(conditions.join(' AND '))
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
    SELECT
      epv.*,
      ep.favorite as favorite_live,
      ea.name AS a_name_live,
      ea.description AS a_description_live,
      eb.name AS b_name_live,
      eb.description AS b_description_live
    FROM events_pair_view epv
    LEFT JOIN events_pairs ep ON ep.uuid = epv.uuid
    LEFT JOIN events_entry ea ON ea.uuid = epv.a_events_entry_uuid
    LEFT JOIN events_entry eb ON eb.uuid = epv.b_events_entry_uuid
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
    `
    SELECT COUNT(*)::bigint AS count
    FROM events_pair_view epv
    LEFT JOIN events_pairs ep ON ep.uuid = epv.uuid
    LEFT JOIN events_entry ea ON ea.uuid = epv.a_events_entry_uuid
    LEFT JOIN events_entry eb ON eb.uuid = epv.b_events_entry_uuid
    ${whereSQL}
    `,
    { replacements, type: QueryTypes.SELECT }
  )) as any[]

  const rows = rowsRaw.map((r) => {
    return {
      events_pairs_uuid: r.uuid,
      favorite: r.favorite_live,
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
      dates: [
        mapSide('a', {
          ...r,
          name: r.a_name_live ?? r.a_name,
          description: r.a_description_live ?? r.a_description
        }),
        mapSide('b', {
          ...r,
          name: r.b_name_live ?? r.b_name,
          description: r.b_description_live ?? r.b_description
        })
      ]
    }
  })

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
