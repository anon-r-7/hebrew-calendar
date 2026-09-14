import React, { useEffect, useState } from 'react'
import { useHistory } from 'react-router-dom'
import { Box, Button, Flex, FormControl, FormLabel, Heading, Input, Text, useTheme } from '@chakra-ui/react'

import { Routes } from '@ui/Routes'
import auth from '@ui/api/auth'
import { getToken, setToken } from '@ui/api/client'

export const Login = () => {
  const history = useHistory()
  const theme = useTheme()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // already signed in: straight to the admin page
  useEffect(() => {
    if (getToken()) history.replace(Routes.Events)
  }, [history])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const { token } = await auth.login({ email: email.trim(), password })
      setToken(token)
      window.dispatchEvent(new Event('AUTH_LOGIN'))
      history.replace(Routes.Events)
    } catch {
      setError('Invalid email or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Flex direction="row" justify="center" background="brand.background" minH="70vh">
      <Flex direction="column" pt={16} px={4} w="full" maxW={{ base: '100%', md: theme.sizes.container.xl }} align="center">
        <Box
          as="form"
          onSubmit={onSubmit}
          w="full"
          maxW="380px"
          bg="brand.surfaceRaised"
          border="1px solid"
          borderColor="brand.border"
          borderRadius="lg"
          boxShadow="brand.base"
          p={8}>
          <Heading size="md" fontWeight="700" color="brand.primary" mb={6}>
            Sign in
          </Heading>
          <FormControl id="email" mb={4}>
            <FormLabel fontSize="11" pl="2">
              EMAIL
            </FormLabel>
            <Input type="email" bg="brand.surface" value={email} onChange={(e) => setEmail(e.target.value)} isRequired />
          </FormControl>
          <FormControl id="password" mb={6}>
            <FormLabel fontSize="11" pl="2">
              PASSWORD
            </FormLabel>
            <Input type="password" bg="brand.surface" value={password} onChange={(e) => setPassword(e.target.value)} isRequired />
          </FormControl>
          {error ? (
            <Text fontSize="13px" color="red.400" mb={4}>
              {error}
            </Text>
          ) : null}
          <Button
            type="submit"
            w="full"
            isLoading={loading}
            bg="brand.primary"
            color="brand.onPrimary"
            fontWeight="500"
            borderRadius="md"
            sx={{ ':hover': { bg: 'brand.primaryLight' } }}>
            Sign in
          </Button>
        </Box>
      </Flex>
    </Flex>
  )
}
