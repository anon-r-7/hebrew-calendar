import React, { useMemo, useState } from 'react'
import { Box, Flex, Input, Text } from '@chakra-ui/react'

import { AdminEvent, Candidate } from '@ui/api/admin'
import { HitRow, ScoreBadge } from './Hits'

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

/** ← previous / next → on a selected card; shows the neighbour's name, disabled at the ends */
const StepButton = ({ dir, target, onClick }: { dir: 'prev' | 'next'; target: AdminEvent | null; onClick: () => void }) => (
  <Text
    as="button"
    type="button"
    onClick={onClick}
    disabled={!target}
    title={target ? target.name : undefined}
    display="flex"
    alignItems="center"
    gap={1.5}
    minW={0}
    fontSize="11px"
    color={target ? 'brand.primary' : 'brand.gray'}
    cursor={target ? 'pointer' : 'default'}
    textAlign={dir === 'prev' ? 'left' : 'right'}
    flexDirection={dir === 'prev' ? 'row' : 'row-reverse'}
    _hover={target ? { color: 'brand.text' } : undefined}>
    <Text as="span" fontSize="14px" lineHeight="1" flex="none">
      {dir === 'prev' ? '←' : '→'}
    </Text>
    <Text as="span" noOfLines={1} minW={0}>
      {target ? target.name : dir === 'prev' ? 'First' : 'Last'}
    </Text>
  </Text>
)

/** A searchable list of events; the chosen one stays shown under the search box. */
export const EventPicker = ({
  label,
  events,
  value,
  onChange,
  filterFn,
  candidates,
  loading,
  error
}: {
  label: string
  events: AdminEvent[]
  value: AdminEvent | null
  onChange: (event: AdminEvent | null) => void
  // narrows the candidates (e.g. Event B against a chosen Event A); the count shown is after it
  filterFn?: (event: AdminEvent) => boolean
  // ranked mode: the list is the server's analysis of every candidate against Event A, best
  // first, each row showing its score and hits; `events` is ignored while this is set
  candidates?: Candidate[]
  loading?: boolean
  error?: string | null
}) => {
  const [query, setQuery] = useState('')
  const byUuid = useMemo(() => new Map((candidates || []).map((c) => [c.event.uuid, c])), [candidates])
  const { matches, total, narrowed } = useMemo(() => {
    const q = query.trim().toLowerCase()
    const base = candidates ? candidates.map((c) => c.event) : events
    const narrowed = filterFn ? base.filter(filterFn) : base
    const list = q
      ? narrowed.filter(
          (e) => e.name.toLowerCase().includes(q) || hebrewLabel(e).includes(q) || e.gregorian.includes(q)
        )
      : narrowed
    return { matches: list.slice(0, 80), total: list.length, narrowed }
  }, [events, candidates, query, filterFn])
  // prev/next through the (filtered) list in its own order, so you can step Event A along
  // and watch the Event B candidates change under the "only whole" filters
  const at = value ? narrowed.findIndex((e) => e.uuid === value.uuid) : -1
  const prev = at > 0 ? narrowed[at - 1] : null
  const next = at >= 0 && at < narrowed.length - 1 ? narrowed[at + 1] : null

  return (
    <Box w="full">
      <Flex justify="space-between" align="baseline" pl="2" pr="1" mb={2}>
        <Text fontSize="11" fontWeight="500">
          {label}
        </Text>
        {!value && (filterFn || candidates) ? (
          <Text fontSize="11px" color="brand.textSecondary">
            {loading ? 'analysing…' : `${total} ${total === 1 ? 'candidate' : 'candidates'}`}
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
          <Flex justify="space-between" align="center" gap={3} mt={2.5} pt={2} borderTop="1px solid" borderColor="brand.borderMuted">
            <StepButton dir="prev" target={prev} onClick={() => prev && onChange(prev)} />
            <Text fontSize="10px" letterSpacing="0.08em" color="brand.textSecondary" flex="none">
              {at >= 0 ? `${at + 1} / ${narrowed.length}` : ''}
            </Text>
            <StepButton dir="next" target={next} onClick={() => next && onChange(next)} />
          </Flex>
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
        {error ? (
          <Text px={3} py={2} fontSize="13px" color="red.400">
            {error}
          </Text>
        ) : loading && !matches.length ? (
          <Text px={3} py={2} fontSize="13px" color="brand.textSecondary">
            Analysing every event against {label.toLowerCase().replace('event b', 'Event A')}…
          </Text>
        ) : matches.length ? (
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
              <EventRow
                event={e}
                action={byUuid.get(e.uuid) ? <ScoreBadge score={byUuid.get(e.uuid)!.analysis.score} size="sm" /> : undefined}
              />
              {byUuid.get(e.uuid) ? <HitRow analysis={byUuid.get(e.uuid)!.analysis} max={3} compact mt={1.5} /> : null}
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
