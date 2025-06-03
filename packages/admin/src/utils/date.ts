export const getDateFromParts = ({ yy, mm, dd, era, type }): string => {
  const year = String(yy).padStart(4, '0')
  const month = String(mm).padStart(2, '0')
  const day = String(dd).padStart(2, '0')

  return `${year}-${month}-${day}${
    era === 'BC' && type === 'gregorian' ? ' BC' : ''
  }`
}
