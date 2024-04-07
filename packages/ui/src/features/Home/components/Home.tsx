import React from 'react'
import { Box } from '@chakra-ui/react'
import { useStore } from '@ui/hooks'
import { Nav, Chat, Form, initialState } from './'

export const Home = () => {
  const store = useStore(initialState)

  return (
    <Box w="100vw" minH="100vh" p={0} m={0} bg="#1A202C" color="white">
      <Nav store={store} />
      {store.state.formDisplay ? (
        <Form store={store} />
      ) : (
        <Chat store={store} />
      )}
    </Box>
  )
}
