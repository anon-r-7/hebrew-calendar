import { HDate } from '@hebcal/core'

export const createSafeJsDate = (dateString) => {
  const parts = dateString.split('-').map((part) => parseInt(part, 10)) // Assumes YYYY-MM-DD format
  if (parts.length === 3) {
    const [year, month, day] = parts
    const date = new Date(Date.UTC(1970, 0, 1)) // Start with a base date
    date.setUTCFullYear(year) // set year, since years before 1900 are not set correctly otherwise
    date.setUTCMonth(month - 1) // JS months are 0-indexed
    date.setUTCDate(day)
    return date
  }
  throw new Error('Invalid date format')
}

export const createSafeSqlDate = (date) => {
  const year = date.getFullYear().toString().padStart(4, '0') // Ensure the year has four digits
  const month = (date.getMonth() + 1).toString().padStart(2, '0') // Month is 0-indexed, add 1
  const day = date.getDate().toString().padStart(2, '0')
  return `${year}-${month}-${day}`
}

export interface HebrewParts {
  mm: number
  dd: number
  yy: number
}

export const isValidHebrewDateFormat = (dateString: string): boolean => {
  const parts = dateString.split('-').map((part) => parseInt(part, 10))
  const [year, month, day] = parts

  try {
    // Note, we use this library only for certain validations like this one
    // but not for actually calculating hebrew dates
    new HDate(year, month, day)
    return true
  } catch (error) {
    return false
  }
}

export const parseHebrewDate = (dateStr: string): HebrewParts => {
  const [yy, mm, dd] = dateStr.split('-').map((part) => parseInt(part, 10))
  return { yy, mm, dd }
}
