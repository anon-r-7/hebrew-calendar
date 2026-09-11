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
  const handleChange = (key, value) => {
    setApiControls((prev) => ({ ...prev, [key]: value }))
  }

  const size = useBreakpointValue({ base: 'md', md: 'sm' })

  // Holidays are always Gregorian — just a year + search, centered like the table below.
  return (
    <Flex w="full" justify="center" align="center" gap={2} py={2}>
      <NumberInput
        bg="brand.surfaceRaised"
        size={size}
        max={apiControls.era === 'bc' ? 4004 : 4200}
        min={1}
        w={{ base: '120px', md: '120px' }}
        flex="none"
        onChange={(value) => handleChange('year', value)}
        value={apiControls.year}>
        <NumberInputField />
        <NumberInputStepper>
          <NumberIncrementStepper />
          <NumberDecrementStepper />
        </NumberInputStepper>
      </NumberInput>
      <Button
        size={size}
        onClick={onSubmit}
        w={{ base: '120px', md: '140px' }}
        flex="none"
        bg="brand.primary"
        fontWeight="500"
        borderRadius="md"
        color="brand.onPrimary"
        sx={{ ':hover': { bg: 'brand.primaryLight' } }}>
        Search
      </Button>
    </Flex>
  )
}
