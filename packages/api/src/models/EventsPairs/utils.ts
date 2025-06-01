const parseDate = (d?: string) => {
  if (!d) return undefined
  const era = d.includes('BC') ? 'BC' : 'AD'
  const stripped = d.replace(' BC', '')
  const [yy, mm, dd] = stripped.split('-')
  return {
    formatted: d,
    yy: Number(yy),
    mm: Number(mm),
    dd: Number(dd),
    era
  }
}

const parseHebrew = (d?: string) => {
  if (!d) return undefined
  const [yy, mm, dd] = d.split('-').map((x) => parseInt(x, 10))
  return { formatted: d, yy, mm, dd }
}

export const mapSide = (p: 'a' | 'b', r: any) => {
  const gdate = r[`${p}_gdate`]
  const hdate = r[`${p}_hdate`]

  const base = {
    source: r[`${p}_source`],
    name: r[`${p}_name`],
    day_index: Number(r[`${p}_day_index`]),
    day_of_week: r[`${p}_day_of_week`],
    gregorian: parseDate(gdate),
    hebrew: parseHebrew(hdate)
  }

  return r[`${p}_source`] === 'user'
    ? {
        ...base,
        user: {
          events_entry_uuid: r[`${p}_events_entry_uuid`],
          description: r[`${p}_description`],
          tags: r[`${p}_tags`],
          created_by: {
            uuid: r[`${p}_created_by_uuid`],
            first_name: r[`${p}_first_name`],
            last_name: r[`${p}_last_name`]
          }
        }
      }
    : {
        ...base,
        system: {
          hebrew_event_dates_uuid: r[`${p}_hebrew_event_dates_uuid`],
          hebrew_dates_uuid: r[`${p}_hebrew_dates_uuid`],
          hebrew_events_uuid: r[`${p}_hebrew_events_uuid`],
          event_day: r[`${p}_event_day`],
          short_name: r[`${p}_short_name`]
        }
      }
}
