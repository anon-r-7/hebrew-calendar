import React from 'react'
import {
  Flex,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Select,
  Stack,
  FormControl,
  FormLabel,
  useBreakpointValue
} from '@chakra-ui/react'

import { isHebrewLeapYear } from '@ui/utils/date'
import { feasts } from '@ui/constants/feasts'

export const DateControls = ({ apiControls, setApiControls }) => {
  const handleDateChange = (field, part, value) => {
    const dateParts = apiControls[field].split('-')
    if (part === 'year') {
      dateParts[0] = value
    } else if (part === 'month') {
      dateParts[1] = value.padStart(2, '0')
    } else if (part === 'day') {
      dateParts[2] = value.padStart(2, '0')
    }

    setApiControls((prev) => ({
      ...prev,
      [field]: dateParts.join('-')
    }))
  }

  const handleChange = (key, value) => {
    setApiControls((prev) => ({
      ...prev,
      [key]: value
    }))
  }

  const inputSize = useBreakpointValue({ base: 'lg', md: 'sm' })
  const marginSide = useBreakpointValue({ base: '4', md: '4' })
  const orientation = useBreakpointValue({ base: 'vertical', md: 'horizontal' })

  const selectProps = {
    bg: 'brand.surfaceRaised',
    size: inputSize,
    color: 'brand.text',
    borderRadius: 'md',
    mr: { base: 2, md: 2 },
    mb: { base: 3, md: 0 }
  }

  return (
    <>
      {/* row 1: what we are counting from, in which calendar, in which unit */}
      <Stack direction={orientation} align="center" w="full">
        <Flex flexDirection={{ base: 'column', md: 'row' }} w="full">
          <Flex>
            <FormControl id="category" mr={marginSide} mb={{ base: 2, md: 0 }}>
              <FormLabel fontSize="11" pl="2">
                TYPE
              </FormLabel>
              <Select
                {...selectProps}
                w={{ base: '100%', md: '140px' }}
                onChange={(e) => handleChange('category', e.target.value)}
                value={apiControls.category}>
                <option value="date">Date</option>
                <option value="event">Event</option>
              </Select>
            </FormControl>

            <FormControl id="calendar" mr={marginSide} mb={{ base: 2, md: 0 }}>
              <FormLabel fontSize="11" pl="2">
                CALENDAR
              </FormLabel>
              <Select
                {...selectProps}
                w={{ base: '100%', md: '140px' }}
                onChange={(e) => handleChange('type', e.target.value)}
                value={apiControls.type}>
                <option value="gregorian">Gregorian</option>
                <option value="hebrew">Hebrew</option>
              </Select>
            </FormControl>
          </Flex>
          <Flex>
            <FormControl id="unit" mr={marginSide} mb={{ base: 2, md: 0 }}>
              <FormLabel fontSize="11" pl="2">
                UNIT
              </FormLabel>
              <Select
                {...selectProps}
                w={{ base: '100%', md: '140px' }}
                onChange={(e) =>
                  setApiControls((prev) => ({
                    ...prev,
                    unit: e.target.value,
                    // "+1 new moon from 4-7 is 5-7": the start month is not counted by default
                    include_first_day:
                      e.target.value === 'new_moons' ? false : prev.include_first_day
                  }))
                }
                value={apiControls.unit}>
                <option value="days">Days</option>
                <option value="new_moons">New Moons</option>
              </Select>
            </FormControl>
          </Flex>
        </Flex>
      </Stack>

      {/* row 2: the start date (or the feast and its year) */}
      <Stack direction={orientation} align="center" w="full" mt={4}>
        <Flex flexDirection={{ base: 'column', md: 'row' }} w="full">
          <Flex>
            {apiControls.type === 'gregorian' && (
              <FormControl id="era" mr={marginSide} mb={{ base: 2, md: 0 }}>
                <FormLabel fontSize="11" pl="2">
                  Era
                </FormLabel>
                <Select
                  {...selectProps}
                  w={{ base: '100%', md: '70px' }}
                  onChange={(e) => handleChange('era', e.target.value)}
                  value={apiControls.era}>
                  <option value="ad">AD</option>
                  <option value="bc">BC</option>
                </Select>
              </FormControl>
            )}

            <FormControl id="year" mr={marginSide} mb={{ base: 2, md: 0 }}>
              <FormLabel fontSize="11" pl="2">
                YEAR
              </FormLabel>
              <NumberInput
                bg="brand.surfaceRaised"
                size={inputSize}
                max={
                  apiControls.type === 'gregorian'
                    ? apiControls.era === 'ad'
                      ? 4200
                      : 4004
                    : 8203
                }
                min={apiControls.type === 'gregorian' ? 1 : 1}
                w={{ base: '100%', md: '140px' }}
                onChange={(valueString) =>
                  handleDateChange('start', 'year', valueString)
                }
                value={apiControls.start.split('-')[0]}>
                <NumberInputField />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </FormControl>
          </Flex>
          <Flex>
            {apiControls.category === 'date' ? (
              <>
                <FormControl id="month" mr={marginSide} mb={{ base: 2, md: 0 }}>
                  <FormLabel fontSize="11" pl="2">
                    MONTH
                  </FormLabel>
                  <NumberInput
                    bg="brand.surfaceRaised"
                    size={inputSize}
                    w={{ base: '100%', md: '140px' }}
                    max={
                      apiControls.type === 'hebrew' &&
                      isHebrewLeapYear(apiControls.start.split('-')[0])
                        ? 13
                        : 12
                    }
                    min={1}
                    onChange={(valueString) =>
                      handleDateChange(
                        'start',
                        'month',
                        valueString.padStart(2, '0')
                      )
                    }
                    value={parseInt(apiControls.start.split('-')[1], 10)}
                    precision={0}>
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>

                <FormControl id="day" mr={marginSide} mb={{ base: 2, md: 0 }}>
                  <FormLabel fontSize="11" pl="2">
                    DAY
                  </FormLabel>
                  <NumberInput
                    bg="brand.surfaceRaised"
                    size={inputSize}
                    max={31}
                    min={1}
                    w={{ base: '100%', md: '140px' }}
                    onChange={(valueString) =>
                      handleDateChange('start', 'day', valueString)
                    }
                    value={apiControls.start.split('-')[2]}>
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>
              </>
            ) : (
              <FormControl id="event" mr={marginSide} mb={{ base: 2, md: 0 }}>
                <FormLabel fontSize="11" pl="2">
                  EVENT
                </FormLabel>
                <Select
                  {...selectProps}
                  w={{ base: '100%', md: '180px' }}
                  onChange={(e) => handleChange('event', e.target.value)}
                  value={apiControls.event}>
                  {feasts.map(({ name, short_name }, index) => {
                    return (
                      <option key={index} value={short_name}>
                        {name}
                      </option>
                    )
                  })}
                </Select>
              </FormControl>
            )}
          </Flex>
        </Flex>
      </Stack>
    </>
  )
}
