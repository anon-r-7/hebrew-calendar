import React from 'react'
import { Box, Flex, Grid, Text } from '@chakra-ui/react'

import type { BetweenResult } from '@ui/features/Calendar/types'

// A whole-number result divisible by any of these gets a label next to it.
const DIVISORS = [7, 12, 13, 49, 70, 90, 91, 360, 364, 1260, 2000, 2548, 8190]

interface Row {
  label: string
  note?: string
  // exact rational num/den so "whole number" is decided by arithmetic, not by rounding
  num: number
  den: number
}

const rows = ({ days, new_moons, new_moons_fraction, years_civil }: BetweenResult): Row[] => [
  { label: 'Days Between', num: days, den: 1 },
  { label: 'Half Days Between', num: days * 2, den: 1 },
  { label: 'Weeks Between', note: '÷ 7', num: days, den: 7 },
  { label: 'Years Between (Enochian)', note: '364-day years', num: days, den: 364 },
  { label: 'Months Between (Enochian)', note: '12 per 364-day year', num: days * 12, den: 364 },
  { label: 'Years Between (Revelation)', note: '360-day years', num: days, den: 360 },
  { label: 'Months Between (Revelation)', note: '30-day months', num: days, den: 30 },
  { label: 'Years Between (Civil)', note: 'Hebrew year', num: years_civil, den: 1 },
  { label: 'New Moons Between', note: 'month index', num: new_moons, den: 1 },
  {
    label: 'New Moons Between (fractional)',
    note: 'position within each month ÷ its length',
    // scaled to an integer over 10⁶ so the whole-number test stays exact arithmetic
    num: Math.round(new_moons_fraction * 1e6),
    den: 1e6
  },
  { label: 'New Moon Years', note: 'new moons ÷ 12', num: new_moons, den: 12 },
  {
    label: 'New Moon Years (fractional)',
    note: 'fractional new moons ÷ 12',
    num: Math.round(new_moons_fraction * 1e6),
    den: 12e6
  }
]

const isWhole = ({ num, den }: Row) => num % den === 0
const divisorsOf = (n: number) => (n > 0 ? DIVISORS.filter((d) => n % d === 0) : [])
const format = (row: Row) =>
  isWhole(row)
    ? (row.num / row.den).toLocaleString('en-US')
    : (row.num / row.den).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 4
      })

export const BreakdownTable = ({ result }: { result: BetweenResult }) => (
  <Box
    mt={4}
    borderRadius="lg"
    overflow="hidden"
    border="1px solid"
    borderColor="brand.border"
    boxShadow="brand.base"
    bg="brand.surfaceRaised">
    {rows(result).map((row, i) => {
      const whole = isWhole(row)
      const divisors = whole ? divisorsOf(row.num / row.den) : []
      return (
        <Grid
          key={row.label}
          templateColumns={{ base: '1fr', md: '280px 1fr' }}
          gap={{ base: 1, md: 4 }}
          px={{ base: 4, md: 8 }}
          py={3.5}
          w="100%"
          bg={i % 2 === 0 ? 'transparent' : 'brand.surface'}
          borderBottom="1px solid"
          borderColor="brand.borderMuted"
          transition="background .12s ease"
          _hover={{ bg: 'brand.backgroundAlt' }}>
          <Box>
            <Text fontSize="14px" fontWeight="500" color="brand.text">
              {row.label}
            </Text>
            {row.note ? (
              <Text fontSize="11px" color="brand.textSecondary">
                {row.note}
              </Text>
            ) : null}
          </Box>
          <Flex align="center" gap={2} wrap="wrap">
            <Text
              className="mono"
              fontSize="14px"
              fontWeight={whole ? '600' : '400'}
              color="brand.text">
              {format(row)}
            </Text>
            {divisors.map((d) => (
              <Text
                key={d}
                as="span"
                fontSize="10px"
                fontWeight="600"
                letterSpacing="0.08em"
                lineHeight="1"
                px={2}
                py={1}
                borderRadius="full"
                border="1px solid"
                borderColor="brand.feastBorder"
                bg="brand.feastBg"
                color="brand.feastText"
                className="mono">
                ÷ {d}
              </Text>
            ))}
          </Flex>
        </Grid>
      )
    })}
  </Box>
)
