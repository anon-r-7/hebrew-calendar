import React, { useEffect, useMemo, useState } from 'react'
import { Box, Flex, Grid, Select, Text } from '@chakra-ui/react'

import admin, { AdminEvent, CycleGroup, Projection } from '@ui/api/admin'
import { hebrewLabel } from './components/EventPicker'
import { HitRow, ScoreBadge, offsetLabel } from './components/Hits'
import { OffsetBadge, ToleranceControl } from './components/ToleranceControl'

// the period menu: fractions of the rung (small to large), the rung, its notable multiples, then
// the year layers. The ladder section follows the 8190-family choices only.
const PERIOD_GROUPS: { group: string; options: { value: string; label: string }[] }[] = [
  {
    group: 'Fractions of 8190',
    options: [
      { value: '630', label: '630 — 1/13 rung' },
      { value: '819', label: '819 — 1/10 rung' },
      { value: '910', label: '910 — 1/9 rung' },
      { value: '1170', label: '1170 — 1/7 rung' },
      { value: '1365', label: '1365 — 1/6 rung' },
      { value: '1638', label: '1638 — 1/5 rung' },
      { value: '2730', label: '2730 — 1/3 rung' },
      { value: '4095', label: '4095 — 1/2 rung' }
    ]
  },
  { group: 'The rung', options: [{ value: '8190', label: '8190 — the rung (22.5 y364 · 22.75 y360)' }] },
  {
    group: 'Multiples of 8190',
    options: [
      { value: '32760', label: 'k = 4 — 32,760 (90 y364 = 91 y360)' },
      { value: '131040', label: 'k = 16 — 131,040 (360 y364 = 364 y360)' },
      { value: '360360', label: 'k = 44 — 360,360 (990 y364 = 1001 y360)' },
      { value: '458640', label: 'k = 56 — 458,640 (1260 y364)' },
      { value: '737100', label: 'k = 90 — 737,100 (2025 y364 = 2047.5 y360)' },
      { value: '745290', label: 'k = 91 — 745,290 (2047.5 y364 = 2070.25 y360)' }
    ]
  },
  {
    group: 'Other periods',
    options: [
      { value: '2548', label: '2548 — 7 × 364, a week of Enochian years' },
      { value: '1260', label: '1260 — half of 2520' }
    ]
  },
  {
    group: 'Years',
    options: [
      { value: '360', label: 'Revelation years (360 days)' },
      { value: '364', label: 'Enochian years (364 days)' },
      { value: 'y49', label: 'Hebrew years: jubilee (mod 49)' },
      { value: 'y7', label: 'Hebrew years: sabbatical (mod 7)' }
    ]
  }
]
const RUNG = 8190
type CyclesView = 'residues' | 'ladder' | 'from'
const VIEWS: { value: CyclesView; label: string }[] = [
  { value: 'ladder', label: 'Ladder' },
  { value: 'residues', label: 'Event groupings' },
  { value: 'from', label: 'Events' }
]
// the ladder steps by days, so every day period qualifies; the year periods have none
const onLadder = (period: string) => Number(period) > 0

const Label = ({ children }: { children: React.ReactNode }) => (
  <Text fontSize="11" fontWeight="500" pl="2" mb={1}>
    {children}
  </Text>
)

const Caption = ({ children }: { children: React.ReactNode }) => (
  <Text fontSize="10px" fontWeight="600" letterSpacing="0.1em" textTransform="uppercase" color="brand.textSecondary">
    {children}
  </Text>
)

const EventLine = ({ event }: { event: AdminEvent }) => (
  <Box minW={0}>
    <Text fontSize="14px" fontWeight="500" color="brand.text" lineHeight="1.3" noOfLines={1}>
      {event.name}
    </Text>
    <Text className="mono" fontSize="11px" color="brand.textSecondary">
      {hebrewLabel(event)} · {event.gregorian}
    </Text>
  </Box>
)

/**
 * Cycles: same-rung groups (events a whole number of periods apart from each other, read from
 * an anchor) and the anchor's projection along the named rungs of 8190.
 */
export const Cycles = ({ events, tol, onTolChange }: { events: AdminEvent[]; tol: number; onTolChange: (t: number) => void }) => {
  const [period, setPeriod] = useState('8190')
  // which section is open; remembered per browser and untouched by period / anchor / tolerance
  const [view, setViewState] = useState<CyclesView>(() => {
    try {
      const v = localStorage.getItem('cycles_view')
      return v === 'ladder' || v === 'from' || v === 'residues' ? v : 'residues'
    } catch {
      return 'residues'
    }
  })
  const setView = (v: CyclesView) => {
    setViewState(v)
    try {
      localStorage.setItem('cycles_view', v)
    } catch {}
  }
  const [anchor, setAnchor] = useState('creation1')
  const [groups, setGroups] = useState<CycleGroup[] | null>(null)
  const [meta, setMeta] = useState<{ period: number; year_mode: boolean; anchor: string } | null>(null)
  const [projection, setProjection] = useState<Projection | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const anchors = useMemo(() => [...events].sort((x, y) => Number(x.day_index) - Number(y.day_index)), [events])

  useEffect(() => {
    let stale = false
    setBusy(true)
    setError(null)
    // groupings are anchor-independent (shifting the anchor shifts every residue equally), so they
    // are always read from Creation day 1 — that keeps the k column stable while the anchor is hidden
    Promise.all([admin.cycles(period, tol, 'creation1'), admin.project(anchor, period, tol)])
      .then(([c, p]) => {
        if (stale) return
        setGroups(c.groups)
        setMeta({ period: c.period, year_mode: c.year_mode, anchor: c.anchor.name })
        setProjection(p)
      })
      .catch((err: any) => {
        if (stale) return
        setGroups([])
        setProjection(null)
        setError(err?.response?.data?.message || err?.message || 'Could not load cycles')
      })
      .finally(() => !stale && setBusy(false))
    return () => {
      stale = true
    }
  }, [period, tol, anchor])

  const unit = meta?.year_mode ? 'years' : 'days'

  return (
    <Box>
      <Flex align="center" gap={2} mb={4}>
        <Text fontSize="11" fontWeight="500" color="brand.textSecondary">
          VIEW
        </Text>
        <Flex border="1px solid" borderColor="brand.border" borderRadius="md" overflow="hidden" bg="brand.surfaceRaised">
          {VIEWS.map((v) => (
            <Text
              key={v.value}
              as="button"
              type="button"
              onClick={() => setView(v.value)}
              fontSize="12px"
              fontWeight="600"
              px={3}
              py={1}
              bg={view === v.value ? 'brand.primary' : 'transparent'}
              color={view === v.value ? 'brand.onPrimary' : 'brand.textSecondary'}
              _hover={view === v.value ? undefined : { color: 'brand.text' }}>
              {v.label}
            </Text>
          ))}
        </Flex>
      </Flex>
      <Flex gap={3} wrap="wrap" align="flex-end" mb={5}>
        <Box>
          <Label>PERIOD</Label>
          <Select size="sm" bg="brand.surfaceRaised" w={{ base: '100%', md: '360px' }} value={period} onChange={(e) => setPeriod(e.target.value)}>
            {PERIOD_GROUPS.map((g) => (
              <optgroup key={g.group} label={g.group}>
                {g.options.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </Select>
        </Box>
        {view === 'residues' ? null : (
        <Box>
          <Label>ANCHOR</Label>
          <Select size="sm" bg="brand.surfaceRaised" w={{ base: '100%', md: '300px' }} value={anchor} onChange={(e) => setAnchor(e.target.value)}>
            <option value="creation1">Creation day 1 (1-08-01)</option>
            <option value="creation8">Creation day 8 (second week)</option>
            {anchors.map((e) => (
              <option key={e.uuid} value={e.uuid}>
                {e.name} — {hebrewLabel(e)}
              </option>
            ))}
          </Select>
        </Box>
        )}
        {view === 'ladder' ? null : (
          <Box pb={1}>
            <ToleranceControl value={tol} onChange={onTolChange} />
          </Box>
        )}
        {busy ? (
          <Text fontSize="11px" color="brand.textSecondary" pb={2}>
            working…
          </Text>
        ) : null}
      </Flex>

      {error ? (
        <Text fontSize="13px" color="red.400" mb={4}>
          {error} — is the API running with the cycles endpoints?
        </Text>
      ) : null}


      {/* ---- ladder: the anchor stepped along the period, as dates, with holidays and nearby events */}
      {view === 'ladder' && !onLadder(period) ? (
        <Text fontSize="13px" color="brand.textSecondary" mb={8}>
          The ladder steps forward in days from the anchor, so it needs a day period. Pick one above.
        </Text>
      ) : null}
      {view === 'ladder' && onLadder(period) && projection ? (
        <>
          {projection.truncated ? (
            <Text fontSize="12px" color="brand.textSecondary" mb={3}>
              first 500 steps
            </Text>
          ) : null}
          {projection.forward.length === 0 ? (
            <Text fontSize="13px" color="brand.textSecondary" mb={8}>
              No step of {projection.period.toLocaleString('en-US')} days from {projection.anchor.name} has an event within two weeks.
            </Text>
          ) : null}
          <Box bg="brand.surfaceRaised" border="1px solid" borderColor="brand.border" borderRadius="lg" boxShadow="brand.base" overflow="hidden" mb={8} display={projection.forward.length ? 'block' : 'none'}>
            <Grid templateColumns={{ base: '60px 1fr 1fr', md: '60px 120px 120px 110px 150px 1fr' }} gap={3} px={4} py={2} bg="brand.backgroundAlt" borderBottom="1px solid" borderColor="brand.primary">
              <Caption>{projection.kind === 'rung' || projection.kind === 'multiple' ? 'k' : 'step'}</Caption>
              <Caption>Revelation</Caption>
              <Caption>Enochian</Caption>
              <Box display={{ base: 'none', md: 'block' }}>
                <Caption>Hebrew</Caption>
              </Box>
              <Box display={{ base: 'none', md: 'block' }}>
                <Caption>Gregorian</Caption>
              </Box>
              <Box display={{ base: 'none', md: 'block' }}>
                <Caption>events ±14 days</Caption>
              </Box>
            </Grid>
            {projection.forward.map((f) => (
              <Grid
                key={f.k}
                templateColumns={{ base: '60px 1fr 1fr', md: '60px 120px 120px 110px 150px 1fr' }}
                gap={3}
                px={4}
                py={2.5}
                alignItems="baseline"
                borderBottom="1px solid"
                borderColor="brand.borderMuted"
                bg={f.near.length || f.holidays.length ? 'brand.goldSoft' : 'transparent'}>
                <Text className="mono" fontSize="13px" fontWeight="600" color="brand.primary" title={`${f.k} rungs of 8190`}>
                  {projection.kind === 'rung' || projection.kind === 'multiple' ? f.k : f.step}
                </Text>
                <Text className="mono" fontSize="12px" color="brand.text" title={f.label}>
                  {f.y360.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                </Text>
                <Box>
                  <Text className="mono" fontSize="12px" color="brand.text" title={f.label}>
                    {f.y364.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                  </Text>
                  <Text className="mono" fontSize="11px" color="brand.textSecondary" display={{ base: 'block', md: 'none' }}>
                    {f.date ? `${f.date.yy}-${String(f.date.mm).padStart(2, '0')}-${String(f.date.dd).padStart(2, '0')} · ${f.date.gregorian}${f.date.era === 'bc' ? ' BC' : ''}` : 'beyond the table'}
                  </Text>
                </Box>
                <Text className="mono" fontSize="12px" color="brand.text" display={{ base: 'none', md: 'block' }}>
                  {f.date ? `${f.date.yy}-${String(f.date.mm).padStart(2, '0')}-${String(f.date.dd).padStart(2, '0')}` : '—'}
                </Text>
                <Text className="mono" fontSize="12px" color="brand.text" display={{ base: 'none', md: 'block' }}>
                  {f.date ? `${f.date.gregorian}${f.date.era === 'bc' ? ' BC' : ''}` : '—'}
                </Text>
                <Box gridColumn={{ base: '1 / -1', md: 'auto' }}>
                  {f.holidays.length ? (
                    <Text fontSize="10px" fontWeight="500" letterSpacing="0.08em" textTransform="uppercase" color="brand.primary" lineHeight="1.6">
                      {f.holidays.join(' · ')}
                    </Text>
                  ) : null}
                  {f.near.map((n) => (
                    <Text key={n.event.uuid} fontSize="12px" color="brand.text">
                      {n.event.name}
                      <Text as="span" className="mono" color="brand.textSecondary" ml={1.5}>
                        {n.offset ? offsetLabel(n.offset) : 'exact'}
                      </Text>
                    </Text>
                  ))}
                </Box>
              </Grid>
            ))}
          </Box>
        </>
      ) : null}

      {/* ---- residues: events that share the same leftover after whole periods, i.e. whole periods apart */}
      {view !== 'residues' ? null : groups && groups.length ? (
        <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={3} mb={8}>
          {groups.map((g) => (
            <Box key={g.residue} bg="brand.surfaceRaised" border="1px solid" borderColor={g.size >= 3 ? 'brand.primary' : 'brand.border'} borderRadius="lg" boxShadow="brand.base" overflow="hidden">
              <Flex px={4} py={2} bg="brand.backgroundAlt" borderBottom="1px solid" borderColor="brand.borderMuted" align="baseline" gap={3}>
                <Caption>residue {g.residue}</Caption>
                <Text fontSize="12px" color="brand.text">
                  {g.size} events
                </Text>
              </Flex>
              {g.members.map((m) => (
                <Flex key={m.event.uuid} px={4} py={2.5} gap={3} align="center" borderBottom="1px solid" borderColor="brand.borderMuted">
                  <EventLine event={m.event} />
                  {tol > 0 ? (
                    <Box ml="auto" flex="none" w="64px" textAlign="right">
                      <OffsetBadge offset={m.offset} size="sm" neutral={!m.offset} />
                    </Box>
                  ) : null}
                  <Box ml={tol > 0 ? 0 : 'auto'} textAlign="right" flex="none" w={{ base: '96px', md: '120px' }}>
                    <Text className="mono" fontSize="12px" color="brand.text">
                      {m.k} × {meta?.period || period}
                    </Text>
                    <Text className="mono" fontSize="10px" color="brand.textSecondary">
                      {m.span.toLocaleString('en-US')} {unit}
                    </Text>
                  </Box>
                </Flex>
              ))}
            </Box>
          ))}
        </Grid>
      ) : (
        <Text fontSize="13px" color="brand.textSecondary" mb={8}>
          {groups
            ? `No two events are a whole number of ${(meta?.period || Number(period) || RUNG).toLocaleString('en-US')} ${unit} apart at this tolerance.`
            : 'Loading…'}
        </Text>
      )}

      {/* ---- every event read from the anchor, best first (±3 days) */}
      {view === 'from' && projection ? (
        <Box bg="brand.surfaceRaised" border="1px solid" borderColor="brand.border" borderRadius="lg" boxShadow="brand.base" overflow="hidden">
          <Grid templateColumns={{ base: '1fr', md: '280px 150px 56px 1fr' }} gap={3} px={4} py={2} bg="brand.backgroundAlt" borderBottom="1px solid" borderColor="brand.primary">
            <Caption>event</Caption>
            <Box display={{ base: 'none', md: 'block' }}>
              <Caption>from {projection.anchor.name}</Caption>
            </Box>
            <Box display={{ base: 'none', md: 'block' }}>
              <Caption>score</Caption>
            </Box>
            <Box display={{ base: 'none', md: 'block' }}>
              <Caption>also true of this span</Caption>
            </Box>
          </Grid>
          {projection.events.map((x) => (
            <Grid
              key={x.event.uuid}
              templateColumns={{ base: '1fr', md: '280px 150px 56px 1fr' }}
              gap={3}
              px={4}
              py={2.5}
              alignItems="flex-start"
              borderBottom="1px solid"
              borderColor="brand.borderMuted"
              bg={x.on_period ? 'brand.goldSoft' : 'transparent'}>
              <Box minW={0}>
                <EventLine event={x.event} />
                <Text className="mono" fontSize="10px" color="brand.textSecondary">
                  {x.days.toLocaleString('en-US')} days {x.direction}
                </Text>
              </Box>
              <Flex align="center" gap={2} minW={0}>
                <Text className="mono" fontSize="12px" color={x.on_period ? 'brand.text' : 'brand.textSecondary'} whiteSpace="nowrap">
                  {x.step.m.toLocaleString('en-US')} × {projection.period.toLocaleString('en-US')}
                  {x.step.unit === 'years' ? ' yrs' : ''}
                </Text>
                {/* the badge is on the tolerance scale; a miss of 385 days is just a distance */}
                {Math.abs(x.step.offset) <= 3 ? (
                  <OffsetBadge offset={x.step.offset} size="sm" />
                ) : (
                  <Text className="mono" fontSize="11px" color="brand.textSecondary" whiteSpace="nowrap">
                    {x.step.offset > 0 ? '+' : '−'}
                    {Math.abs(x.step.offset).toLocaleString('en-US')}
                    {x.step.unit === 'years' ? 'y' : 'd'}
                  </Text>
                )}
              </Flex>
              <Box>
                {x.analysis.hits.length ? (
                  <ScoreBadge score={x.analysis.score} size="sm" />
                ) : (
                  <Text fontSize="12px" color="brand.textSecondary">
                    —
                  </Text>
                )}
              </Box>
              <Box flex="1" minW={0}>
                <HitRow analysis={x.analysis} compact max={5} />
              </Box>
            </Grid>
          ))}
        </Box>
      ) : null}
    </Box>
  )
}
