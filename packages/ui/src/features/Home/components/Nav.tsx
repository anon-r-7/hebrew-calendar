import React from 'react'
import { Box, Text, Flex, Heading, IconButton } from '@chakra-ui/react'
import { SettingsIcon } from '@chakra-ui/icons'

export const Nav = ({ store }) => {
  const onClick = () => {
    store.update({
      ...store.state,
      formDisplay: true
    })
  }

  return (
    <Flex
      w="100%"
      p={4}
      bg="transparent"
      align="center"
      justifyContent="space-between"
      top={0}
      zIndex={1}>
      <Box p="2">
        <Text fontSize="xl" fontWeight="bold" mt={2} color="white">
          alooola
        </Text>
      </Box>

      <Heading
        fontSize="4xl"
        color="white"
        fontFamily="'Playfair Display', serif"
        mt={-2}>
        RoboAdvisor
      </Heading>

      <Box p="2">
        {store.state.formValid && (
          <IconButton
            icon={<SettingsIcon />}
            onClick={onClick}
            aria-label="Settings"
            variant="ghost"
            color="white"
            disabled={!store.state.formValid}
            _hover={{ bg: 'green.500' }}
          />
        )}
      </Box>
    </Flex>
  )
}
