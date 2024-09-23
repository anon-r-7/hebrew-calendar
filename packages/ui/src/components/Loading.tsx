import React from 'react'
import { Box, Spinner } from '@chakra-ui/react'

export const Loading = ({ loading }) => {
  return (
    loading && (
      <Box
        position="fixed"
        top="0"
        left="0"
        width="100vw"
        height="100vh"
        backgroundColor="rgba(0, 0, 0, 0.2)" // Dimmed background overlay
        display="flex"
        justifyContent="center"
        alignItems="center"
        zIndex="9999" // Ensure it's on top of everything
      >
        <Spinner size="xl" color="white" />
      </Box>
    )
  )
}
