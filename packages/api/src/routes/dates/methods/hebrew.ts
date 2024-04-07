import { HDate } from '@hebcal/core'

import { HebrewDatesModel } from '@api/models/HebrewDates'
import { findAllByGregorian } from './gregorian'

interface HebrewParts {
  mm: number
  dd: number
  yy: number
}

export const isValidHebrewDateFormat = (dateString: string): boolean => {
  const parts = dateString.split('-').map((part) => parseInt(part, 10))
  const [year, month, day] = parts

  try {
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

export const hebrewToGregorian = ({ yy, mm, dd }: HebrewParts): Date => {
  const hDate = new HDate(dd, mm, yy)
  return new Date(hDate.greg())
}

export const findAllByHebrew = async (
  start: HebrewParts,
  end: HebrewParts
): Promise<HebrewDatesModel[]> => {
  const gStart = hebrewToGregorian(start)
  const gEnd = hebrewToGregorian(end)
  return await findAllByGregorian(gStart, gEnd)
}
