import React from 'react'
import {
  Flex,
  Button,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Select,
  useBreakpointValue
} from '@chakra-ui/react'

import { isHebrewLeapYear } from '@ui/utils/date'

const SearchIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    aria-hidden="true">
    <circle cx="11" cy="11" r="7" />
    <line x1="21" y1="21" x2="16.5" y2="16.5" />
  </svg>
)

export const DateControls = ({ apiControls, setApiControls, onSubmit, dates }) => {
  const handleDateChange = (field, part, value) => {
    const dateParts = apiControls[field].split('-')
    if (part === 'year') {
      dateParts[0] = value
    } else if (part === 'month') {
      dateParts[1] = value.padStart(2, '0')
    }
    setApiControls((prev) => ({
      ...prev,
      [field]: dateParts.join('-')
    }))
  }

  // Switching calendars keeps the same month on screen: the loaded rows carry both
  // dates, so the middle of the current month is looked up exactly (the 1st would often
  // land in the previous month of the other calendar). If the rows are not
  // loaded yet, fall back to the epoch offset (Hebrew yy = Gregorian AD year + 4003).
  const handleTypeChange = (value) => {
    setApiControls((prev) => {
      if (value === prev.type) return prev
      const [y, m] = prev.start.split('-')
      const rows = dates || []
      if (value === 'hebrew') {
        const mid = `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-15`
        const row = rows.find((r) => String(r.gregorian).replace(/\s*BC$/, '') === mid && String(r.gregorian).includes('BC') === (prev.era === 'bc'))
        const start = row
          ? `${row.yy}-${String(row.mm).padStart(2, '0')}-01`
          : `${prev.era === 'bc' ? 4004 - Number(y) : Number(y) + 4003}-${String(m).padStart(2, '0')}-01`
        return { ...prev, type: 'hebrew', start }
      }
      const row = rows.find((r) => Number(r.yy) === Number(y) && Number(r.mm) === Number(m) && Number(r.dd) === 15)
      if (row) {
        const isBC = String(row.gregorian).includes('BC')
        const [gy, gm] = String(row.gregorian).replace(/\s*BC$/, '').split('-')
        return { ...prev, type: 'gregorian', era: isBC ? 'bc' : 'ad', start: `${Number(gy)}-${gm}-01` }
      }
      const gy = Number(y) - 4003
      return gy > 0
        ? { ...prev, type: 'gregorian', era: 'ad', start: `${gy}-${String(m).padStart(2, '0')}-01` }
        : { ...prev, type: 'gregorian', era: 'bc', start: `${4004 - Number(y)}-${String(m).padStart(2, '0')}-01` }
    })
  }
  const handleEraChange = (value) => {
    setApiControls((prev) => ({ ...prev, era: value }))
  }
  const handleAstronomyChange = (value) => {
    setApiControls((prev) => ({ ...prev, with_astronomy: value }))
  }

  const isMobile = useBreakpointValue({ base: true, md: false })
  const size = useBreakpointValue({ base: 'md', md: 'sm' })
  const isGregorian = apiControls.type === 'gregorian'

  return (
    // Mobile: [year] [month] [AD/BC] [search icon], wrapping to a second line for the
    // Gregorian/Hebrew select. Desktop expands to the full set (adds Basic/Advanced).
    <Flex
      w="full"
      align="center"
      gap={2}
      justify={{ base: 'center', md: 'flex-end' }}
      flexWrap={{ base: 'wrap', md: 'nowrap' }}
      py={2}>
      <NumberInput
        bg="brand.surfaceRaised"
        size={size}
        max={isGregorian ? (apiControls.era === 'ad' ? 4200 : 4004) : 8203}
        min={1}
        w={{ base: '86px', md: '90px' }}
        flex="none"
        onChange={(valueString) =>
          handleDateChange('start', 'year', valueString)
        }
        value={apiControls.start.split('-')[0]}>
        <NumberInputField px={2} />
        <NumberInputStepper>
          <NumberIncrementStepper />
          <NumberDecrementStepper />
        </NumberInputStepper>
      </NumberInput>

      <NumberInput
        bg="brand.surfaceRaised"
        size={size}
        max={
          apiControls.type === 'hebrew' &&
          isHebrewLeapYear(apiControls.start.split('-')[0])
            ? 13
            : 12
        }
        min={1}
        w={{ base: '62px', md: '80px' }}
        flex="none"
        onChange={(valueString) =>
          handleDateChange('start', 'month', valueString.padStart(2, '0'))
        }
        value={parseInt(apiControls.start.split('-')[1], 10)}
        precision={0}>
        <NumberInputField px={2} />
        <NumberInputStepper>
          <NumberIncrementStepper />
          <NumberDecrementStepper />
        </NumberInputStepper>
      </NumberInput>

      {isGregorian && (
        <Select
          bg="brand.surfaceRaised"
          size={size}
          color="brand.text"
          borderRadius="md"
          w={{ base: '68px', md: '80px' }}
          flex="none"
          sx={{ '& > select': { paddingInlineEnd: '1.4rem', paddingInlineStart: '0.5rem' } }}
          onChange={(e) => handleEraChange(e.target.value)}
          value={apiControls.era}>
          <option value="ad">AD</option>
          <option value="bc">BC</option>
        </Select>
      )}

      <Select
        bg="brand.surfaceRaised"
        size={size}
        color="brand.text"
        borderRadius="md"
        w={{ base: '128px', md: '140px' }}
        flex="none"
        onChange={(e) => handleTypeChange(e.target.value)}
        value={apiControls.type}>
        <option value="gregorian">Gregorian</option>
        <option value="hebrew">Hebrew</option>
      </Select>

      <Select
        bg="brand.surfaceRaised"
        size={size}
        color="brand.text"
        borderRadius="md"
        w="90px"
        flex="none"
        display={{ base: 'none', md: 'block' }}
        onChange={(e) => handleAstronomyChange(e.target.value)}
        value={apiControls.with_astronomy}>
        <option value="false">Basic</option>
        <option value="true">Advanced</option>
      </Select>

      <Button
        size={size}
        onClick={onSubmit}
        w={{ base: '48px', md: '140px' }}
        minW={{ base: '48px', md: 'auto' }}
        px={{ base: 0, md: 4 }}
        flex="none"
        bg="brand.primary"
        fontWeight="500"
        borderRadius="md"
        color="brand.onPrimary"
        aria-label="Search"
        sx={{ ':hover': { bg: 'brand.primaryLight' } }}>
        {isMobile ? <SearchIcon /> : 'Search'}
      </Button>
    </Flex>
  )
}
