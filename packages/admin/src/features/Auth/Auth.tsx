import React, { useState } from 'react'
import { Box, Input, Button, VStack, Heading, useToast } from '@chakra-ui/react'

import api from '@admin/api/auth'

export const Auth = ({ onSubmit }: { onSubmit: (token: string) => void }) => {
  const toast = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const response = await api.login({ email, password })

      if (response?.token) {
        onSubmit(response.token)
      } else {
        throw new Error(response?.message)
      }
    } catch (err: any) {
      toast({
        title: 'Login failed',
        description: 'Invalid credentials',
        status: 'error',
        duration: 4000,
        isClosable: true
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box
      h="100vh"
      bg="gray.50"
      display="flex"
      alignItems="center"
      justifyContent="center">
      <Box bg="white" p={8} borderRadius="md" boxShadow="lg" w="full" maxW="md">
        <Heading mb={6} size="lg" textAlign="center">
          Sign In
        </Heading>
        <form onSubmit={handleSubmit}>
          <VStack spacing={4} align="stretch">
            <Input
              placeholder="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              isRequired
            />
            <Input
              placeholder="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              isRequired
            />
            <Button type="submit" colorScheme="blue" isLoading={loading}>
              Login
            </Button>
          </VStack>
        </form>
      </Box>
    </Box>
  )
}
