import Models from '@api/models'
import { pgPool } from '@api/models/pool'
import { mapSide } from './utils'
import { EventPairsParams } from './interface'

export const setFavorite = async (uuid: string, favorite: string) => {
  const pair = await Models.EventsPairs.findByPk(uuid)
  if (!pair) return null
  await pair.update({ favorite })
  return pair
}

const convertNamedParams = (sql: string, replacements: Record<string, any>) => {
  const values: any[] = []
  const nameToIndex: Record<string, number> = {}

  const convertedSql = sql.replace(/(::\w+)|:(\w+)/g, (_, cast, name) => {
    if (cast) return cast // preserve PostgreSQL casts (::type)
    if (!(name in nameToIndex)) {
      nameToIndex[name] = values.push(replacements[name])
    }
    return `$${nameToIndex[name]}`
  })

  return { convertedSql, values }
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

  if (q.require_user_source === 'true') {
    where.push(`(
      a_source = 'user'
      AND
      b_source = 'user'
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
  uuidKeys.forEach((key) => {
    const value = q[key as keyof EventPairsParams]
    if (value) {
      where.push(`(a_${key} = :${key}0 OR b_${key} = :${key}1)`)
      replacements[`${key}0`] = value
      replacements[`${key}1`] = value
    }
  })

  if (q.exact_rev_years === 'true') where.push('exact_rev_years = true')
  if (q.exact_enoch_years === 'true') where.push('exact_enoch_years = true')
  if (q.exact_weeks === 'true') where.push('exact_weeks = true')

  if (q.days) {
    where.push('ep.diff = :d')
    replacements.d = Number(q.days)
  }

  if (q.days_from || q.days_to) {
    const days_from = q.days_from || q.days_to
    const days_to = q.days_to || q.days_from

    where.push('ep.diff BETWEEN :days_from AND :days_to')
    replacements.days_from = Number(days_from)
    replacements.days_to = Number(days_to)
  }

  if (q.weeks) {
    where.push('weeks = :w')
    replacements.w = Number(q.weeks)
  }

  if (q.weeks_from || q.weeks_to) {
    const weeks_from = q.weeks_from || q.weeks_to
    const weeks_to = q.weeks_to || q.weeks_from

    where.push('weeks BETWEEN :weeks_from AND :weeks_to')
    replacements.weeks_from = Number(weeks_from)
    replacements.weeks_to = Number(weeks_to)
  }

  if (q.revelation_years) {
    where.push('rev_years = :ry')
    replacements.ry = Number(q.revelation_years)
  }

  if (q.revelation_years_from || q.revelation_years_to) {
    const ry_from = q.revelation_years_from || q.revelation_years_to
    const ry_to = q.revelation_years_to || q.revelation_years_from

    where.push(
      'rev_years BETWEEN :revelation_years_from AND :revelation_years_to'
    )
    replacements.revelation_years_from = Number(ry_from)
    replacements.revelation_years_to = Number(ry_to)
  }

  if (q.enochian_years) {
    where.push('enoch_years = :ey')
    replacements.ey = Number(q.enochian_years)
  }

  if (q.enochian_years_from || q.enochian_years_to) {
    const ey_from = q.enochian_years_from || q.enochian_years_to
    const ey_to = q.enochian_years_to || q.enochian_years_from

    where.push(
      'enoch_years BETWEEN :enochian_years_from AND :enochian_years_to'
    )
    replacements.enochian_years_from = Number(ey_from)
    replacements.enochian_years_to = Number(ey_to)
  }

  if (q.favorite === 'true') {
    where.push('ep.favorite = :fav')
    replacements.fav = true
  }

  if (q.name) {
    const words = q.name.trim().split(/\s+/).filter(Boolean)
    words.forEach((word, i) => {
      const key = `name${i}`
      replacements[key] = `%${word}%`
      where.push(`(ea.name ILIKE :${key} OR eb.name ILIKE :${key})`)
    })
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

  const query = `
    SELECT
      epv.*,
      ep.favorite as favorite_live,
      ea.name AS a_name_live,
      ea.description AS a_description_live,
      eb.name AS b_name_live,
      eb.description AS b_description_live,

      CASE
        WHEN epv.a_gdate < DATE '0001-01-01' THEN TO_CHAR(epv.a_gdate, 'YYYY-MM-DD') || ' BC'
        ELSE TO_CHAR(epv.a_gdate, 'YYYY-MM-DD')
      END AS a_gdate_string,
      CASE
        WHEN epv.b_gdate < DATE '0001-01-01' THEN TO_CHAR(epv.b_gdate, 'YYYY-MM-DD') || ' BC'
        ELSE TO_CHAR(epv.b_gdate, 'YYYY-MM-DD')
      END AS b_gdate_string

    FROM events_pair_view epv
    LEFT JOIN events_pairs ep ON ep.uuid = epv.uuid
    LEFT JOIN events_entry ea ON ea.uuid = epv.a_events_entry_uuid
    LEFT JOIN events_entry eb ON eb.uuid = epv.b_events_entry_uuid
    ${whereSQL}
    ${orderSQL}
    OFFSET :off LIMIT :lim
  `

  const countQuery = `
    SELECT COUNT(*)::bigint AS count
    FROM events_pair_view epv
    LEFT JOIN events_pairs ep ON ep.uuid = epv.uuid
    LEFT JOIN events_entry ea ON ea.uuid = epv.a_events_entry_uuid
    LEFT JOIN events_entry eb ON eb.uuid = epv.b_events_entry_uuid
    ${whereSQL}
  `

  const { convertedSql: finalQuery, values: finalValues } = convertNamedParams(
    query,
    { ...replacements, off: offset, lim: limit }
  )

  const { convertedSql: finalCountQuery, values: finalCountValues } =
    convertNamedParams(countQuery, { ...replacements })

  const client = await pgPool.connect()

  let rows = [],
    count = 0

  try {
    const response = await client.query(finalQuery, finalValues)
    const countResponse = await client.query(finalCountQuery, finalCountValues)

    rows = response.rows
    count = Number(countResponse.rows[0].count)
  } finally {
    client.release()
  }

  rows = rows.map((r) => {
    const sideA = mapSide('a', {
      ...r,
      name: r.a_name_live ?? r.a_name,
      description: r.a_description_live ?? r.a_description
    })

    const sideB = mapSide('b', {
      ...r,
      name: r.b_name_live ?? r.b_name,
      description: r.b_description_live ?? r.b_description
    })

    // Ensure user is always on side A if one is system and the other is user
    const [finalA, finalB] =
      sideA.source === 'system' && sideB.source === 'user'
        ? [sideB, sideA]
        : [sideA, sideB]

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
      dates: [finalA, finalB]
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
