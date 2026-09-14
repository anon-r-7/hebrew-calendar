import React, { useMemo, useState } from 'react'
import { Box, Flex, Input, Text } from '@chakra-ui/react'

import { AdminEvent } from '@ui/api/admin'

export const hebrewLabel = (e: { yy: number; mm: number; dd: number }) =>
  `${e.yy}-${String(e.mm).padStart(2, '0')}-${String(e.dd).padStart(2, '0')}`

/** one quiet small-caps line: weekday · holiday · holiday (holidays in gold, no pills) */
const DayLine = ({ event, mt }: { event: AdminEvent; mt?: number }) => (
  <Flex align="baseline" gap={1.5} mt={mt} wrap="wrap" fontSize="10px" fontWeight="500" letterSpacing="0.08em" textTransform="uppercase" lineHeight="1.4">
    <Text as="span" color="brand.textSecondary">
      {event.day_of_week}
    </Text>
    {(event.holidays || []).map((h) => (
      <React.Fragment key={h}>
        <Text as="span" color="brand.textSecondary">
          ·
        </Text>
        <Text as="span" color="brand.primary">
          {h}
        </Text>
      </React.Fragment>
    ))}
  </Flex>
)

/** Name as the title; labelled Hebrew · Gregorian on one line; weekday · holidays on the next. */
export const EventSummary = ({ event, compact }: { event: AdminEvent; compact?: boolean }) => (
  <Box minW={0}>
    <Text fontSize={compact ? '14px' : '15px'} fontWeight="500" color="brand.text" lineHeight="1.3">
      {event.name}
    </Text>
    <Flex align="baseline" gap={3} mt={1} wrap="wrap">
      <Flex align="baseline" gap={1.5}>
        <InlineLabel>Hebrew</InlineLabel>
        <Text className="mono" fontSize="12px" color="brand.text">
          {hebrewLabel(event)}
        </Text>
      </Flex>
      <Flex align="baseline" gap={1.5}>
        <InlineLabel>Gregorian</InlineLabel>
        <Text className="mono" fontSize="12px" color="brand.text">
          {event.gregorian}
        </Text>
      </Flex>
    </Flex>
    <DayLine event={event} mt={1} />
  </Box>
)

const InlineLabel = ({ children }: { children: React.ReactNode }) => (
  <Text as="span" fontSize="9px" fontWeight="600" letterSpacing="0.1em" textTransform="uppercase" color="brand.textSecondary">
    {children}
  </Text>
)

const Label = ({ children }: { children: React.ReactNode }) => (
  <Text fontSize="9px" fontWeight="600" letterSpacing="0.1em" textTransform="uppercase" color="brand.textSecondary" mb={0.5}>
    {children}
  </Text>
)

/** One event as a stacked block: name (+ action on the same line), description,
 *  labelled Hebrew ↔ Gregorian dates, then day · holidays */
export const EventRow = ({ event, action, fixedHeight }: { event: AdminEvent; action?: React.ReactNode; fixedHeight?: boolean }) => (
  <Box minW={0}>
    <Flex justify="space-between" align="baseline" gap={3}>
      <Text fontSize="14px" fontWeight="500" color="brand.text" lineHeight="1.3">
        {event.name}
      </Text>
      {action}
    </Flex>
    {/* selected cards keep a description line even when empty, so A and B match in height */}
    {event.description || fixedHeight ? (
      <Text fontSize="12px" color="brand.textSecondary" mt={0.5} minH={fixedHeight ? '18px' : undefined} noOfLines={fixedHeight ? 1 : undefined}>
        {event.description || '\u00a0'}
      </Text>
    ) : null}
    <Flex justify="space-between" gap={4} mt={2}>
      <Box>
        <Label>Hebrew</Label>
        <Text className="mono" fontSize="12px" color="brand.text">
          {hebrewLabel(event)}
        </Text>
      </Box>
      <Box textAlign="right">
        <Label>Gregorian</Label>
        <Text className="mono" fontSize="12px" color="brand.text">
          {event.gregorian}
        </Text>
      </Box>
    </Flex>
    <DayLine event={event} mt={1.5} />
  </Box>
)

/** A searchable list of events; the chosen one stays shown under the search box. */
export const EventPicker = ({
  label,
  events,
  value,
  onChange,
  filterFn
}: {
  label: string
  events: AdminEvent[]
  value: AdminEvent | null
  onChange: (event: AdminEvent | null) => void
  // narrows the candidates (e.g. Event B against a chosen Event A); the count shown is after it
  filterFn?: (event: AdminEvent) => boolean
}) => {
  const [query, setQuery] = useState('')
  const { matches, total } = useMemo(() => {
    const q = query.trim().toLowerCase()
    const narrowed = filterFn ? events.filter(filterFn) : events
    const list = q
      ? narrowed.filter(
          (e) => e.name.toLowerCase().includes(q) || hebrewLabel(e).includes(q) || e.gregorian.includes(q)
        )
      : narrowed
    return { matches: list.slice(0, 50), total: list.length }
  }, [events, query, filterFn])

  return (
    <Box w="full">
      <Flex justify="space-between" align="baseline" pl="2" pr="1" mb={2}>
        <Text fontSize="11" fontWeight="500">
          {label}
        </Text>
        {!value && filterFn ? (
          <Text fontSize="11px" color="brand.textSecondary">
            {total} {total === 1 ? 'match' : 'matches'}
          </Text>
        ) : null}
      </Flex>
      {value ? (
        <Box
          px={3}
          py={2.5}
          borderRadius="md"
          border="1px solid"
          borderColor="brand.primary"
          borderLeftWidth="3px"
          bg="brand.backgroundAlt">
          <EventRow
            event={value}
            fixedHeight
            action={
              <Text
                as="button"
                type="button"
                onClick={() => onChange(null)}
                fontSize="10px"
                fontWeight="600"
                letterSpacing="0.1em"
                textTransform="uppercase"
                color="brand.primary"
                flex="none"
                _hover={{ color: 'brand.text' }}>
                Change
              </Text>
            }
          />
        </Box>
      ) : null}
      {value ? null : (
        <>
      <Input
        size="sm"
        bg="brand.surfaceRaised"
        placeholder="Search events…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <Box
        mt={1}
        maxH="320px"
        overflowY="auto"
        border="1px solid"
        borderColor="brand.borderMuted"
        borderRadius="md"
        bg="brand.surfaceRaised">
        {matches.length ? (
          matches.map((e) => (
            <Box
              key={e.uuid}
              px={3}
              py={2}
              cursor="pointer"
              bg={value?.uuid === e.uuid ? 'brand.backgroundAlt' : 'transparent'}
              borderBottom="1px solid"
              borderColor="brand.borderMuted"
              _hover={{ bg: 'brand.backgroundAlt' }}
              onClick={() => onChange(e)}>
              <EventRow event={e} />
            </Box>
          ))
        ) : (
          <Text px={3} py={2} fontSize="13px" color="brand.textSecondary">
            No events match.
          </Text>
        )}
      </Box>
        </>
      )}
    </Box>
  )
}
