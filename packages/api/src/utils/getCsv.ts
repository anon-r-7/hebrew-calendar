import AsyncFS from '@api/services/AsyncFS'
import csvParser from '@api/utils/csvParser'

export default async (path) => {
  const fs = new AsyncFS({ path })
  const file = await fs.read()
  const csv = csvParser(file)
  csv.shift()
  return csv
}
