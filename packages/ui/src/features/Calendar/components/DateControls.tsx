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

export const DateControls = ({ apiControls, setApiControls, onSubmit }) => {
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

  const handleTypeChange = (value) => {
    setApiControls((prev) => ({ ...prev, type: value }))
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
    // One compact row on mobile: [year] [month] [AD/BC] [search icon].
    // Desktop expands to the full set (adds Gregorian/Hebrew + Basic/Advanced).
    <Flex
      w="full"
      align="center"
      gap={2}
      justify={{ base: 'center', md: 'flex-end' }}
      flexWrap="nowrap"
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
          w={{ base: '84px', md: '80px' }}
          flex="none"
          sx={{ '& > select': { paddingInlineEnd: '1.5rem' } }}
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
        w="140px"
        flex="none"
        display={{ base: 'none', md: 'block' }}
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
