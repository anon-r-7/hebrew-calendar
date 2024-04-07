export default (csv) => {
  const rows = csv.split('\n').filter((line) => line.trim() !== '')
  return rows.map((row) => {
    const columns = row.split(',')
    return columns.map((column) => {
      return column.trim()
    })
  })
}
