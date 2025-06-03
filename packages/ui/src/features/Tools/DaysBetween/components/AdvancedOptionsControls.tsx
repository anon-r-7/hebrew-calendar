import React from 'react'
import {
  Flex,
  Stack,
  Checkbox,
  FormControl,
  useBreakpointValue
} from '@chakra-ui/react'

export const AdvancedOptionsControls = ({ apiControls, setApiControls }) => {
  const handleChange = (type, value) => {
    setApiControls((prev) => ({
      ...prev,
      [type]: value
    }))
  }
  const inputSize = useBreakpointValue({ base: 'lg', md: 'sm' })
  const marginSide = useBreakpointValue({ base: '4', md: '7' })
  const orientation = useBreakpointValue({ base: 'vertical', md: 'horizontal' })

  return (
    <Stack
      mt={{ base: 6, md: 4 }}
      direction={orientation}
      align="center"
      w="full">
      <Flex flexDirection={{ base: 'column', md: 'row' }} w="full">
        <Flex justifyContent={{ base: 'flex-start', md: '' }} w="full">
          <FormControl
            id="include_first_day"
            mr={marginSide}
            mb={{ base: 2, md: 0 }}>
            <Checkbox
              size={inputSize}
              fontFamily={'Fustat-Regular'}
              colorScheme="blue"
              isChecked={apiControls.include_first_day}
              onChange={(e) =>
                handleChange('include_first_day', e.target.checked)
              }>
              Include First Day
            </Checkbox>
          </FormControl>
        </Flex>
      </Flex>
    </Stack>
  )
}
