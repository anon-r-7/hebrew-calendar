// 1st of current month formatted as yyyy-mm-dd
export const getCurrentMonthFirstIso = () =>
  ((d) => new Date(d.setDate(1)).toISOString().substring(0, 10))(new Date())

// Function to calculate the first day of the next month
const getNextMonthFirstIso = (year, month) => {
  if (month === 12) {
    year += 1
    month = 1
  } else {
    month += 1
  }
  return `${year.toString().padStart(4, '0')}-${month
    .toString()
    .padStart(2, '0')}-01`
}

export const daysOfWeek = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday'
]

export const months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
]

export const getMonthRange = (start) => {
  const monthDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31] // Days in each month, assuming Feb has 28 days

  let [startYear, startMonth, startDay] = start.split('-').map(Number)
  let endYear = startYear
  let endMonth = startMonth
  let endDay = monthDays[startMonth - 1] // Last day of the start month

  // Calculate the end date at the first of the next month
  const endDate = getNextMonthFirstIso(endYear, endMonth)
  ;[endYear, endMonth, endDay] = endDate.split('-').map(Number)
  endDay += 5 // Add 5 days past the start of the next month

  // Adjust the end date if it exceeds the month length
  if (endDay > monthDays[endMonth - 1]) {
    endDay -= monthDays[endMonth - 1]
    endMonth += 1
    if (endMonth > 12) {
      endMonth = 1
      endYear += 1
    }
  }

  // Calculate the new start date by subtracting 6 days
  startDay -= 6
  if (startDay <= 0) {
    startMonth -= 1
    if (startMonth < 1) {
      startMonth = 12
      startYear -= 1
    }
    startDay += monthDays[startMonth - 1]
  }

  // Format the dates back to 'YYYY-MM-DD'
  const newStart = `${startYear.toString().padStart(4, '0')}-${startMonth
    .toString()
    .padStart(2, '0')}-${startDay.toString().padStart(2, '0')}`
  const newEnd = `${endYear.toString().padStart(4, '0')}-${endMonth
    .toString()
    .padStart(2, '0')}-${endDay.toString().padStart(2, '0')}`

  return [newStart, newEnd]
}
