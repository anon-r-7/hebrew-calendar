import React, { useState, useEffect } from 'react'
import { Avatar, HStack, Box, Text, useBreakpointValue } from '@chakra-ui/react'
import Markdown from 'react-markdown'
import { markdownComponents } from './markdownComponents'

export const ChatMessage = ({ chat }) => {
  const [displayedMessage, setDisplayedMessage] = useState('')

  const userBgColor = '#2D3748' // Slightly darker background for user messages
  const botBgColor = 'transparent' // Transparent background for bot messages to show the primary background
  const bgColor = chat.type === 'user' ? userBgColor : botBgColor
  const textColor = chat.type === 'user' ? 'green.500' : 'blue.500'

  const nameColor = useBreakpointValue({
    base: textColor, // Color for 'base' and 'sm' breakpoints
    md: 'white' // Color for 'md' and larger breakpoints
  })

  const typeMessage = (message, index = 0) => {
    if (index < message.length) {
      setDisplayedMessage((prev) => prev + message[index])
      setTimeout(() => typeMessage(message, index + 1), 10) // Adjust typing speed here
    }
  }

  // Trigger typing effect when chat message changes
  useEffect(() => {
    if (chat.type === 'bot') {
      setDisplayedMessage('') // Clear previous message
      typeMessage(chat.message) // Start typing new message
    } else {
      setDisplayedMessage(chat.message) // Immediately show user messages
    }
  }, [chat])

  return (
    <HStack
      align="start"
      spacing={4}
      mb={0}
      w="full"
      bg={bgColor}
      p={2}
      borderRadius="lg">
      <Avatar
        size="sm"
        m={3}
        name={chat.type === 'user' ? 'You' : 'alooola'}
        bg={chat.type === 'user' ? 'green.500' : 'blue.500'} // Green for user, blue for bot
        display={['none', 'none', 'flex']} // Hide on base breakpoint, show on sm and above
      />
      <Box flex="1" p={3}>
        <Text fontWeight="bold" color={nameColor}>
          {chat.type === 'user' ? 'You' : 'alooola'}
        </Text>
        <Markdown components={markdownComponents}>{displayedMessage}</Markdown>
      </Box>
    </HStack>
  )
}
