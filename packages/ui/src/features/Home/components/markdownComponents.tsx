import React from 'react'
import { Text } from '@chakra-ui/react'

export const markdownComponents = {
  p: (props) => <Text mb={4} mt={4} {...props} />, // Adding margin-bottom to paragraphs
  li: (props) => <li style={{ marginBottom: 4 }} {...props} />, // Adding margin-bottom to lists
  ol: (props) => <ol style={{ marginLeft: 18, marginBottom: 4 }} {...props} />, // Adding margin-bottom to lists
  ul: (props) => <ol style={{ marginLeft: 18, marginBottom: 4 }} {...props} /> // Adding margin-bottom to lists
}
