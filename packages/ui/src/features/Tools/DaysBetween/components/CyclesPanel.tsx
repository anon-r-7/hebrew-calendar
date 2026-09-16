import React from 'react'
import { Box, Flex, Text } from '@chakra-ui/react'

import { Analysis } from '@ui/api/admin'
import { HitRow, RungPosition, ScoreBadge } from '@ui/features/Admin/components/Hits'

/** The cycles-engine reading of a span on the public Days Between tool: rungs of 8190, hits, score. */
export const CyclesPanel = ({ analysis }: { analysis: Analysis | null | undefined }) => {
  if (!analysis) return null
  return (
    <Box mt={6} bg="brand.surfaceRaised" border="1px solid" borderColor="brand.border" borderRadius="lg" boxShadow="brand.base" px={{ base: 4, md: 6 }} py={4}>
      <Flex align="baseline" gap={4} wrap="wrap" mb={analysis.hits.length ? 3 : 0}>
        <Text fontSize="10px" fontWeight="600" letterSpacing="0.14em" textTransform="uppercase" color="brand.textSecondary">
          Cycles of 8190
        </Text>
        <RungPosition analysis={analysis} />
        <Text fontSize="11px" color="brand.textSecondary">
          {analysis.hebrew_years} Hebrew years{analysis.same_month_day ? ' · same date' : ''}
        </Text>
        <Box ml="auto">
          <ScoreBadge score={analysis.score} />
        </Box>
      </Flex>
      {analysis.hits.length ? (
        <HitRow analysis={analysis} />
      ) : (
        <Text fontSize="12px" color="brand.textSecondary" mt={2}>
          Nothing within ±3 days of a rung, a whole year count, or a jubilee.
        </Text>
      )}
    </Box>
  )
}
