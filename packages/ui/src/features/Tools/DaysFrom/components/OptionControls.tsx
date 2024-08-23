import React from 'react'
import {
  Flex,
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
      <Flex flexDirection={{ base: 'column', md: 'row' }}>
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
