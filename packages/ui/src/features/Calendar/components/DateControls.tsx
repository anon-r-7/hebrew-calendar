import React from 'react'
import {
  Flex,
  Button,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  useBreakpointValue
} from '@chakra-ui/react'

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

  const buttonSize = useBreakpointValue({ base: 'md', md: 'sm' })
  const inputSize = useBreakpointValue({ base: 'md', md: 'sm' })
  const marginSide = useBreakpointValue({ base: '2', md: '2' })
  const marginBottom = useBreakpointValue({ base: '2', md: '0' })

  return (
    <Flex align="center" w="full" p={2}>
      <NumberInput
        bg="white"
        size={inputSize}
        max={2075}
        min={1}
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
        max={12}
        min={1}
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
      <Button
        size={buttonSize}
        onClick={onSubmit}
        bg="brand.red"
        fontWeight="500"
        fontFamily="HubotSans"
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
  )
}
