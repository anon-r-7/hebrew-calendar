import React from 'react'
import {
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useColorModeValue
} from '@chakra-ui/react'

export const Error = ({ asyncManager }) =>
  asyncManager.error && (
    <Alert
      status="error"
      my="6"
      bg={useColorModeValue('red.600', 'red.700')} // Darker red background in dark mode
      color="white" // White text color
      borderRadius="md">
      <AlertIcon color="white" />
      <AlertTitle mr={2}>Error</AlertTitle>
      <AlertDescription>{asyncManager.error}</AlertDescription>
    </Alert>
  )
