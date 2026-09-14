import React from 'react'
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Box,
  Button,
  Flex,
  Grid,
  Text,
  useDisclosure
} from '@chakra-ui/react'

import { AdminPair } from '@ui/api/admin'
import { measureRows, isWhole, divisorsOf, format, Row } from '@ui/features/Tools/DaysBetween/components/BreakdownTable'
import { EventSummary } from './EventPicker'

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

// six columns, each a short caption over one or two stacked measures (days is the headline)
const COLUMNS: { caption: string; rows: { label: string; unit: string }[] }[] = [
  { caption: 'Time', rows: [{ label: 'Half Days Between', unit: 'half days' }, { label: 'Weeks Between', unit: 'weeks' }] },
  { caption: 'Enochian', rows: [{ label: 'Years Between (Enochian)', unit: 'years' }, { label: 'Months Between (Enochian)', unit: 'months' }] },
  { caption: 'Revelation', rows: [{ label: 'Years Between (Revelation)', unit: 'years' }, { label: 'Months Between (Revelation)', unit: 'months' }] },
  { caption: 'Civil', rows: [{ label: 'Years Between (Civil)', unit: 'years' }] },
  { caption: 'New moons', rows: [{ label: 'New Moons Between', unit: 'moons' }, { label: 'New Moon Years', unit: 'years' }] },
  { caption: 'New moons · fractional', rows: [{ label: 'New Moons Between (fractional)', unit: 'moons' }, { label: 'New Moon Years (fractional)', unit: 'years' }] }
]

export const PairCard = ({
  pair,
  onDelete,
  onFavorite,
  onIncludeFirst,
  highlightFavorite = true,
  showDetails = true,
  onToggle
}: {
  pair: AdminPair
  onDelete: () => void
  onFavorite: (favorite: boolean) => void
  onIncludeFirst: (include: boolean) => Promise<void>
  showDetails?: boolean
  // when given, clicking the card's header opens/closes its details (global Details off)
  onToggle?: () => void
  // off while the list is already filtered to favorites, where every card would glow
  highlightFavorite?: boolean
}) => {
  const rows = measureRows(pair.breakdown)
  const byLabel = Object.fromEntries(rows.map((r) => [r.label, r]))
  const days = byLabel['Days Between']
  const confirm = useDisclosure()
  const cancelRef = React.useRef<HTMLButtonElement>(null)
  const [busy, setBusy] = React.useState(false)
  const flip = async () => {
    setBusy(true)
    try {
      await onIncludeFirst(!pair.include_first_day)
      confirm.onClose()
    } finally {
      setBusy(false)
    }
  }
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
            templateColumns={{ base: '1fr', md: 'minmax(0, 1fr) 24px minmax(0, 1fr)' }}
            columnGap={{ base: 0, md: 4 }}
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
            <Text
              as="button"
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                confirm.onOpen()
              }}
              display="block"
              fontSize="10px"
              letterSpacing="0.12em"
              textTransform="uppercase"
              color={pair.include_first_day ? 'brand.primary' : 'brand.textSecondary'}
              mt={1}
              ml={{ base: 0, md: 'auto' }}
              borderBottom="1px dotted"
              borderColor="currentColor"
              title="Change whether the first day is counted"
              _hover={{ color: 'brand.text' }}>
              {pair.include_first_day ? 'incl. first day' : 'excl. first day'}
            </Text>
            <AlertDialog isOpen={confirm.isOpen} leastDestructiveRef={cancelRef} onClose={confirm.onClose} isCentered>
              <AlertDialogOverlay>
                <AlertDialogContent bg="brand.surfaceRaised" borderColor="brand.border" borderWidth="1px">
                  <AlertDialogHeader fontFamily="heading" fontSize="lg" color="brand.text">
                    {pair.include_first_day ? 'Stop counting the first day?' : 'Count the first day?'}
                  </AlertDialogHeader>
                  <AlertDialogBody fontSize="14px" color="brand.textSecondary">
                    Every measure on this pair will be recomputed — days becomes{' '}
                    <Text as="span" className="mono" color="brand.text">
                      {(pair.breakdown.days + (pair.include_first_day ? -1 : 1)).toLocaleString('en-US')}
                    </Text>
                    .
                  </AlertDialogBody>
                  <AlertDialogFooter gap={2}>
                    <Button ref={cancelRef} size="sm" variant="ghost" onClick={confirm.onClose}>
                      Cancel
                    </Button>
                    <Button size="sm" bg="brand.primary" color="brand.onPrimary" isLoading={busy} onClick={flip} sx={{ ':hover': { bg: 'brand.primaryLight' } }}>
                      {pair.include_first_day ? 'Exclude it' : 'Include it'}
                    </Button>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialogOverlay>
            </AlertDialog>
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
      {showDetails ? (
      <Grid
        templateColumns={{ base: 'repeat(2, 1fr)', md: 'repeat(6, 1fr)' }}
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
