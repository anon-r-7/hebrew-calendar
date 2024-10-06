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
  Stack,
  useBreakpointValue
} from '@chakra-ui/react'

import { isHebrewLeapYear } from '@ui/utils/date'

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
    setApiControls((prev) => ({
      ...prev,
      type: value
    }))
  }

  const handleEraChange = (value) => {
    setApiControls((prev) => ({
      ...prev,
      era: value
    }))
  }

  const handleAstronomyChange = (value) => {
    setApiControls((prev) => ({
      ...prev,
      with_astronomy: value
    }))
  }

  const buttonSize = useBreakpointValue({ base: 'lg', md: 'sm' })
  const inputSize = useBreakpointValue({ base: 'lg', md: 'sm' })
  const marginSide = useBreakpointValue({ base: '2', md: '2' })
  const marginBottom = useBreakpointValue({ base: '2', md: '0' })
  const orientation = useBreakpointValue({ base: 'vertical', md: 'horizontal' })

  return (
    <Stack direction={orientation} align="center" w="full" p={2} spacing={4}>
      <Flex flexDirection={{ base: 'column', md: 'row' }}>
        <Flex justifyContent={{ base: 'flex-end', md: '' }}>
          <NumberInput
            bg="white"
            size={inputSize}
            fontFamily={'HubotSans'}
            max={
              apiControls.type === 'gregorian'
                ? apiControls.era === 'ad'
                  ? 2075
                  : 4004
                : 5836
            }
            min={apiControls.type === 'gregorian' ? 1 : 1}
            w={{
              base: apiControls.type === 'gregorian' ? '33%' : '50%',
              md: '90px'
            }}
            onChange={(valueString) =>
              handleDateChange('start', 'year', valueString)
            }
            value={apiControls.start.split('-')[0]}
            mr={marginSide}
            mb={{ base: 2, md: 0 }}>
            <NumberInputField />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
          <NumberInput
            bg="white"
            size={inputSize}
            fontFamily={'HubotSans'}
            max={
              apiControls.type === 'hebrew' &&
              isHebrewLeapYear(apiControls.start.split('-')[0])
                ? 13
                : 12
            }
            min={1}
            w={{
              base: apiControls.type === 'gregorian' ? '33%' : '50%',
              md: '80px'
            }}
            onChange={(valueString) =>
              handleDateChange('start', 'month', valueString.padStart(2, '0'))
            }
            value={parseInt(apiControls.start.split('-')[1], 10)}
            precision={0}
            mr={marginSide}
            mb={{ base: 2, md: 0 }}>
            <NumberInputField />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>

          {apiControls.type === 'gregorian' && (
            <Select
              bg="white"
              size={inputSize}
              fontFamily={'HubotSans'}
              color={'black'}
              borderRadius="0"
              w={{ base: '33%', md: '80px' }}
              mr={{ base: 2, md: 2 }}
              mb={{ base: '3', md: 0 }}
              onChange={(e) => handleEraChange(e.target.value)}
              value={apiControls.era}>
              <option value="ad">AD</option>
              <option value="bc">BC</option>
            </Select>
          )}
        </Flex>

        <Flex>
          <Select
            bg="white"
            size={inputSize}
            fontFamily={'HubotSans'}
            color={'black'}
            borderRadius="0"
            w={{ base: '33%', md: '140px' }}
            mr={{ base: 2, md: 2 }}
            mb={{ base: '3', md: 0 }}
            onChange={(e) => handleTypeChange(e.target.value)}
            value={apiControls.type}>
            <option value="gregorian">Gregorian</option>
            <option value="hebrew">Hebrew</option>
          </Select>
          <Select
            bg="white"
            size={inputSize}
            fontFamily={'HubotSans'}
            color={'black'}
            borderRadius="0"
            w={{ base: '33%', md: '90px' }}
            mr={{ base: 2, md: 2 }}
            mb={{ base: '3', md: 0 }}
            onChange={(e) => handleAstronomyChange(e.target.value)}
            value={apiControls.with_astronomy}>
            <option value="false">Basic</option>
            <option value="true">Advanced</option>
          </Select>
          <Button
            size={buttonSize}
            onClick={onSubmit}
            w={{ base: '33%', md: '140px' }}
            height={{ base: '47px', md: 'initial ' }}
            mt={{ base: 0.25, md: 0 }}
            mr={2}
            bg="brand.red"
            fontWeight="500"
            fontFamily="HubotSans"
            borderRadius="0"
            color="white"
            mb={marginBottom}
            sx={{
              ':hover': {
                bg: '#691818' // Use Chakra's color tokens or any CSS color
              }
            }}>
            Search
          </Button>
        </Flex>
      </Flex>
    </Stack>
  )
}
