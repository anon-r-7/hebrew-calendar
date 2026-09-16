import React from 'react'
import { Box, Button, Flex, Grid, Text } from '@chakra-ui/react'

import { AdminPair } from '@ui/api/admin'
import { measureRows, isWhole, divisorsOf, format, Row } from '@ui/features/Tools/DaysBetween/components/BreakdownTable'
import { EventSummary } from './EventPicker'
import { HitRow, RungPosition, ScoreBadge } from './Hits'
import { OffsetBadge } from './ToleranceControl'

// solid for the headline, outline in the detail strip so the number stays the loudest thing
const Badge = ({ d, solid }: { d: number; solid?: boolean }) => (
  <Text
    as="span"
    className="mono"
    fontSize="9px"
    fontWeight="600"
    letterSpacing="0.06em"
    lineHeight="1"
    px={1.5}
    py={0.5}
    borderRadius="full"
    border="1px solid"
    borderColor={solid ? 'brand.feastBorder' : 'brand.primary'}
    bg={solid ? 'brand.feastBg' : 'transparent'}
    color={solid ? 'brand.feastText' : 'brand.primary'}>
    ÷{d}
  </Text>
)

/** one measure inside a column: value, its unit, then any divisor badges on their own line */
const Stat = ({ row, unit }: { row: Row; unit: string }) => {
  const divisors = isWhole(row) ? divisorsOf(row.num / row.den) : []
  return (
    <Box>
      <Flex align="baseline" gap={1.5}>
        <Text className="mono" fontSize="15px" fontWeight="600" color="brand.text" lineHeight="1.2">
          {format(row)}
        </Text>
        <Text fontSize="11px" color="brand.textSecondary">
          {unit}
        </Text>
      </Flex>
      {divisors.length ? (
        <Flex gap={1} mt={1} wrap="wrap">
          {divisors.map((d) => (
            <Badge key={d} d={d} />
          ))}
        </Flex>
      ) : null}
    </Box>
  )
}

// five columns, each a short caption over one or two stacked measures (days is the headline);
// new moons are the fractional reading (position within the month), the whole-month count is dropped
const COLUMNS: { caption: string; rows: { label: string; unit: string }[] }[] = [
  { caption: 'Revelation', rows: [{ label: 'Years Between (Revelation)', unit: 'years' }, { label: 'Months Between (Revelation)', unit: 'months' }] },
  { caption: 'Enochian', rows: [{ label: 'Years Between (Enochian)', unit: 'years' }, { label: 'Months Between (Enochian)', unit: 'months' }] },
  { caption: 'Hebrew', rows: [{ label: 'Years Between (Hebrew)', unit: 'years' }] },
  { caption: 'New moons', rows: [{ label: 'New Moons Between (fractional)', unit: 'moons' }, { label: 'New Moon Years (fractional)', unit: 'years' }] },
  { caption: 'Time', rows: [{ label: 'Weeks Between', unit: 'weeks' }, { label: 'Half Days Between', unit: 'half days' }] }
]

export const PairCard = ({
  pair,
  onDelete,
  onFavorite,
  highlightFavorite = true,
  showDetails = true,
  onToggle,
  tolerance = 0
}: {
  pair: AdminPair
  onDelete: () => void
  onFavorite: (favorite: boolean) => void
  showDetails?: boolean
  // the list's tolerance: at 0 every hit is exact and the offset column is not shown
  tolerance?: number
  // when given, clicking the card's header opens/closes its details (global Details off)
  onToggle?: () => void
  // off while the list is already filtered to favorites, where every card would glow
  highlightFavorite?: boolean
}) => {
  const rows = measureRows(pair.breakdown)
  const byLabel = Object.fromEntries(rows.map((r) => [r.label, r]))
  const days = byLabel['Days Between']
  const analysis = pair.analysis
  const best = analysis?.hits[0]
  return (
    <Box mb={3} borderRadius="lg" border="1px solid" borderColor={pair.favorite && highlightFavorite ? 'brand.primary' : 'brand.border'} bg="brand.surfaceRaised" boxShadow="brand.base" overflow="hidden">
      <Box
        position="relative"
        px={{ base: 4, md: 6 }}
        py={4}
        cursor={onToggle ? 'pointer' : 'default'}
        onClick={onToggle}
        _hover={onToggle ? { bg: 'brand.backgroundAlt' } : undefined}
        transition="background .12s ease">
        <Flex position="absolute" top={3} right={{ base: 2, md: 4 }} align="center" gap={1} onClick={(e) => e.stopPropagation()}>
          <Button
            size="xs"
            variant="ghost"
            aria-label={pair.favorite ? 'Remove from favorites' : 'Add to favorites'}
            title={pair.favorite ? 'Favorited' : 'Favorite'}
            color={pair.favorite ? 'brand.primary' : 'brand.textSecondary'}
            fontSize="16px"
            px={1}
            onClick={() => onFavorite(!pair.favorite)}>
            {pair.favorite ? '★' : '☆'}
          </Button>
          <Button size="xs" variant="ghost" color="brand.textSecondary" onClick={onDelete}>
            Delete
          </Button>
        </Flex>
        <Flex direction={{ base: 'column', md: 'row' }} align={{ base: 'stretch', md: 'center' }} gap={{ base: 3, md: 4 }} pr={{ base: 16, md: 20 }}>
          {/* phones: A above B with a small "to" rule; desktop: A → B inline */}
          {/* desktop: two equal fixed columns (A | → | B) so the arrow and B line up from card to card
              regardless of how long a name is; long names wrap inside their column */}
          <Grid
            flex="1"
            minW={0}
            templateColumns={{ base: '1fr', md: 'minmax(0, 1fr) 20px minmax(0, 1fr)' }}
            columnGap={{ base: 0, md: 3 }}
            rowGap={2}
            alignItems={{ base: 'stretch', md: 'center' }}>
            <EventSummary event={pair.a} compact />
            <Text color="brand.textSecondary" textAlign="center" display={{ base: 'none', md: 'block' }}>
              →
            </Text>
            <Flex align="center" gap={2} display={{ base: 'flex', md: 'none' }}>
              <Box flex="1" h="1px" bg="brand.borderMuted" />
              <Text fontSize="10px" letterSpacing="0.12em" textTransform="uppercase" color="brand.textSecondary">
                to
              </Text>
              <Box flex="1" h="1px" bg="brand.borderMuted" />
            </Flex>
            <EventSummary event={pair.b} compact />
          </Grid>
          {/* its own column between Event B and the numbers, so the badge lines up from card to
              card; only when the list is at ±1 … ±3 (at 0 every hit is exact) */}
          {tolerance > 0 ? (
            <Box flex="none" w={{ base: 'auto', md: '64px' }} textAlign={{ base: 'left', md: 'center' }}>
              <OffsetBadge offset={best ? best.offset : null} />
            </Box>
          ) : null}
          {/* fixed width on desktop: otherwise the badge row makes this column a different
              width on every card, which shifts the A | → | B grid from card to card */}
          <Box flex="none" w={{ base: 'auto', md: '240px' }} textAlign={{ base: 'left', md: 'right' }} pt={{ base: 1, md: 0 }} borderTop={{ base: '1px solid', md: 'none' }} borderColor="brand.borderMuted" mt={{ base: 1, md: 0 }}>
            <Flex align="baseline" gap={2} justify={{ base: 'flex-start', md: 'flex-end' }} mt={{ base: 2, md: 0 }}>
              <Text className="mono" fontFamily="heading" fontSize="30px" fontWeight="600" color="brand.primary" lineHeight="1">
                {format(days)}
              </Text>
              <Text fontSize="10px" letterSpacing="0.12em" textTransform="uppercase" color="brand.textSecondary">
                days
              </Text>
            </Flex>
            {analysis ? (
              <Flex align="baseline" gap={2} justify={{ base: 'flex-start', md: 'flex-end' }} mt={1.5}>
                <ScoreBadge score={analysis.score} />
                {best ? (
                  <Text className="mono" fontSize="12px" color={best.flags.includes('named') ? 'brand.primary' : 'brand.text'} title={best.detail || best.label}>
                    {best.label}
                  </Text>
                ) : (
                  <Text fontSize="11px" color="brand.textSecondary">
                    nothing within tolerance
                  </Text>
                )}
              </Flex>
            ) : null}
            {divisorsOf(days.num).length ? (
              <Flex justify={{ base: 'flex-start', md: 'flex-end' }} gap={1} mt={1.5} wrap="wrap">
                {divisorsOf(days.num).map((d) => (
                  <Badge key={d} d={d} solid />
                ))}
              </Flex>
            ) : null}
          </Box>
        </Flex>
      </Box>
      {showDetails && analysis ? (
        <Flex px={{ base: 4, md: 6 }} py={3} borderTop="1px solid" borderColor="brand.borderMuted" align="center" gap={4} wrap="wrap">
          <Text fontSize="10px" fontWeight="600" letterSpacing="0.1em" textTransform="uppercase" color="brand.textSecondary">
            Cycles
          </Text>
          {/* the hits are the whole story; the rung position only when no hit already says it */}
          {analysis.hits.length ? <HitRow analysis={analysis} /> : null}
          {!analysis.hits.some((h) => h.family === 'ladder') ? <RungPosition analysis={analysis} /> : null}
          {!analysis.hits.length ? (
            <Text fontSize="11px" color="brand.textSecondary">
              nothing at this tolerance
            </Text>
          ) : null}
        </Flex>
      ) : null}
      {showDetails ? (
      <Grid
        templateColumns={{ base: 'repeat(2, 1fr)', md: 'repeat(5, 1fr)' }}
        columnGap={{ base: 4, md: 6 }}
        rowGap={2.5}
        alignItems="start"
        px={{ base: 4, md: 6 }}
        py={4}
        borderTop="1px solid"
        borderColor="brand.borderMuted">
        {COLUMNS.map(({ caption }, c) => (
          <Text
            key={caption}
            gridColumn={{ base: (c % 2) + 1, md: c + 1 }}
            gridRow={{ base: Math.floor(c / 2) * 3 + 1, md: 1 }}
            pt={{ base: c >= 2 ? 4 : 0, md: 0 }}
            fontSize="10px"
            fontWeight="600"
            letterSpacing="0.1em"
            textTransform="uppercase"
            color="brand.textSecondary">
            {caption}
          </Text>
        ))}
        {[0, 1].map((r) =>
          COLUMNS.map(({ caption, rows: cells }, c) => (
            <Box key={`${caption}-${r}`} gridColumn={{ base: (c % 2) + 1, md: c + 1 }} gridRow={{ base: Math.floor(c / 2) * 3 + 2 + r, md: 2 + r }}>
              {cells[r] ? <Stat row={byLabel[cells[r].label]} unit={cells[r].unit} /> : null}
            </Box>
          ))
        )}
      </Grid>
      ) : null}
    </Box>
  )
}
