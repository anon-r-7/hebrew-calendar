import React, { useRef, useState, useEffect } from 'react'
import {
  Box,
  Text,
  Textarea,
  Button,
  Container,
  HStack,
  VStack
} from '@chakra-ui/react'
import { useAsyncManager } from '@ui/hooks'
import { askQuestion } from '../methods'
import { scrollToBottom } from './utils'
import { ChatMessage } from './'

export const Chat = ({ store }) => {
  const asyncManager = useAsyncManager()
  const lastScrollHeight = useRef(document.documentElement.scrollHeight)
  const [submitCount, setSubmitCount] = useState(0)
  const [question, setQuestion] = useState('')

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault() // Prevent default Enter key action
      onSubmit()
    }
  }

  const checkForNewMessages = () => {
    const currentScrollHeight = document.documentElement.scrollHeight
    if (currentScrollHeight > lastScrollHeight.current) {
      scrollToBottom()
      lastScrollHeight.current = currentScrollHeight
    }
  }

  useEffect(() => {
    const interval = setInterval(checkForNewMessages, 1000) // check every second
    return () => clearInterval(interval)
  }, [])

  const onChange = (event) => setQuestion(event.target.value)

  const onSubmit = () => {
    askQuestion({
      payload: {
        question: question.trim(),
        userId: 1,
        form: store.state.form
      },
      store,
      asyncManager
    })

    setQuestion('')
    setSubmitCount(submitCount + 1)
  }

  return (
    <VStack spacing={4} align="stretch">
      <Container maxW="container.xl" mb="20">
        <Box w="100%" p={store.state.isBotTyping ? 0 : 4}>
          <>
            {store.state.chat.map((chat, index) => (
              <ChatMessage key={index} chat={chat} />
            ))}
            {store.state.isBotTyping && (
              <Box display="flex" alignItems="center" mt={4}>
                <Text color="gray.500">alooola is typing...</Text>
              </Box>
            )}
          </>
        </Box>
        <HStack mt={1}>
          <Textarea
            autoFocus
            key={submitCount}
            mr={2}
            value={question}
            onChange={onChange}
            onKeyPress={handleKeyPress}
            placeholder="Ask us a question..."
            bg="gray.700"
            borderColor="gray.600"
            _placeholder={{ color: 'gray.300' }}
            resize="vertical" // Disables resizing of the textarea
            height="auto" // Adjusts height based on content
            minH="48px" // Minimum height
            maxH="200px" // Maximum height (for about 4 lines)
          />
          <Button
            bg="green.500"
            _hover={{ bg: 'green.600' }}
            onClick={onSubmit}
            isLoading={asyncManager.loading}
            loadingText="Looooking up Answers"
            px="6">
            Ask
          </Button>
        </HStack>
      </Container>
    </VStack>
  )
}
