// 1st of current month formatted as yyyy-mm-dd
export const getCurrentMonthFirstIso = () => (d => new Date(d.setDate(1)).toISOString().substring(0, 10))(new Date())
