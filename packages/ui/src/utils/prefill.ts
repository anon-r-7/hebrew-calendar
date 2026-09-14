/**
 * The calendar's day popover links into the tools / events page with the clicked date:
 *   ?type=gregorian&start=YYYY-MM-DD&era=ad|bc   or   ?type=hebrew&start=yy-mm-dd
 * (events page uses `date` instead of `start`, plus new=1). Read once on mount.
 */
export interface DatePrefill {
  type: 'gregorian' | 'hebrew'
  date: string
  era: 'ad' | 'bc'
}

export const readDatePrefill = (search: string, key = 'start'): DatePrefill | null => {
  try {
    const params = new URLSearchParams(search)
    const date = params.get(key)
    if (!date || !/^\d{1,4}-\d{1,2}-\d{1,2}$/.test(date)) return null
    const [y, m, d] = date.split('-')
    return {
      type: params.get('type') === 'hebrew' ? 'hebrew' : 'gregorian',
      date: `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`,
      era: params.get('era') === 'bc' ? 'bc' : 'ad'
    }
  } catch {
    return null
  }
}
