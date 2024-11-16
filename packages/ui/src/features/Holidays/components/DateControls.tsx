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
  useBreakpointValue,
  useTheme
} from '@chakra-ui/react'

export const DateControls = ({ apiControls, setApiControls, onSubmit }) => {
  const theme = useTheme()

  const handleChange = (key, value) => {
    setApiControls((prev) => ({
      ...prev,
      [key]: value
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
            onChange={(value) => handleChange('year', value)}
            value={apiControls.year}
            mr={marginSide}
            mb={{ base: 2, md: 0 }}>
            <NumberInputField />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
          <Select
            bg="white"
            size={inputSize}
            fontFamily={'HubotSans'}
            color={'black'}
            borderRadius="0"
            w={{ base: '33%', md: '140px' }}
            mr={{ base: 2, md: 2 }}
            mb={{ base: '3', md: 0 }}
            onChange={(e) => handleChange('type', e.target.value)}
            value={apiControls.type}>
            <option value="gregorian">Gregorian</option>
            <option value="hebrew">Hebrew</option>
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
                bg: '#691818'
              }
            }}>
            Search
          </Button>
        </Flex>
      </Flex>
    </Stack>
  )
}
