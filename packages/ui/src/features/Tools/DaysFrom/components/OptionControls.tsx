import React from 'react'
import {
  Flex,
  Select,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Stack,
  FormControl,
  FormLabel,
  useBreakpointValue
} from '@chakra-ui/react'

export const OptionControls = ({ apiControls, setApiControls }) => {
  const handleChange = (type, value) => {
    setApiControls((prev) => ({
      ...prev,
      [type]: value
    }))
  }

  const inputSize = useBreakpointValue({ base: 'lg', md: 'sm' })
  const marginSide = useBreakpointValue({ base: '4', md: '6' })
  const orientation = useBreakpointValue({ base: 'vertical', md: 'horizontal' })

  return (
    <Stack direction={orientation} align="center" w="full">
      <Flex flexDirection={{ base: 'column', md: 'row' }} w="full">
        <Flex justifyContent={{ base: 'center', md: '' }}>
          <FormControl id="day" mr={marginSide} mb={{ base: 2, md: 0 }}>
            <FormLabel fontSize="11" pl="2">
              DIRECTION
            </FormLabel>
            <Select
              bg="white"
              size={inputSize}
              fontFamily={'HubotSans'}
              color={'black'}
              borderRadius="0"
              w={{ base: '100%', md: '140px' }}
              mr={{ base: 2, md: 0 }}
              mb={{ base: 3, md: 0 }}
              onChange={(e) => handleChange('direction', e.target.value)}
              value={apiControls.direction}>
              <option value="future">Forward</option>
              <option value="past">Backwards</option>
            </Select>
          </FormControl>
        </Flex>

        <Flex justifyContent={{ base: 'center', md: '' }}>
          <FormControl id="days" mr={marginSide} mb={{ base: 2, md: 0 }}>
            <FormLabel fontSize="11" pl="2">
              DAYS FROM DATE
            </FormLabel>
            <NumberInput
              bg="white"
              size={inputSize}
              fontFamily={'HubotSans'}
              w={{ base: '100%', md: '140px' }}
              onChange={(valueString) => handleChange('days', valueString)}
              min={15}
              max={744585} // maximum records
              value={apiControls.days}>
              <NumberInputField />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          </FormControl>

          <FormControl id="days" mr={marginSide} mb={{ base: 2, md: 0 }}>
            <FormLabel fontSize="11" pl="2">
              BUFFER (+/-)
            </FormLabel>
            <NumberInput
              bg="white"
              size={inputSize}
              fontFamily={'HubotSans'}
              w={{ base: '100%', md: '140px' }}
              min={0}
              max={7}
              onChange={(valueString) => handleChange('buffer', valueString)}
              value={apiControls.buffer}>
              <NumberInputField />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          </FormControl>
        </Flex>
      </Flex>
    </Stack>
  )
}
