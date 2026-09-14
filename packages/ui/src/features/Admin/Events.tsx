import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useHistory, useLocation } from 'react-router-dom'
import { readDatePrefill } from '@ui/utils/prefill'
import { Box, Button, Checkbox, Flex, Grid, Input, Tab, TabList, TabPanel, TabPanels, Tabs, Text, useBreakpointValue, useTheme } from '@chakra-ui/react'

import { Routes } from '@ui/Routes'
import { useAuth } from '@ui/hooks/useAuth'
import auth from '@ui/api/auth'
import admin, { AdminEvent, AdminPair, NewEvent, PAIR_FIELDS, PairFilter } from '@ui/api/admin'
import { Select, Switch } from '@chakra-ui/react'
import { getToken } from '@ui/api/client'
import { DIVISORS } from '@ui/features/Tools/DaysBetween/components/BreakdownTable'
import { PairCard } from './components/PairCard'
import { breakdown, isWholeNumber } from '@ui/utils/breakdown'
import { EventForm } from './components/EventForm'
import { EventPicker, EventSummary, hebrewLabel } from './components/EventPicker'


const Card = ({ children }: { children: React.ReactNode }) => (
  <Box bg="brand.surfaceRaised" border="1px solid" borderColor="brand.border" borderRadius="lg" boxShadow="brand.base" p={{ base: 4, md: 6 }}>
    {children}
  </Box>
)

const WHOLE_KEYS = ['weeks', 'years_364', 'years_360', 'new_moons']

// a labelled switch in the site's gold
const ToggleSwitch = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) => (
  <Flex as="label" align="center" gap={2} cursor="pointer" userSelect="none">
    <Switch
      size="md"
      isChecked={checked}
      onChange={(e) => onChange(e.target.checked)}
      sx={{
        // off state uses the faint-ink token so the track reads on both grounds
        '.chakra-switch__track': { bg: 'brand.gray' },
        '.chakra-switch__track[data-checked]': { bg: 'brand.primary' },
        '.chakra-switch__track[data-focus-visible]': { boxShadow: 'none' }
      }}
    />
    <Text fontSize="14px" color={checked ? 'brand.text' : 'brand.textSecondary'}>
      {label}
    </Text>
  </Flex>
)

// the round + that opens a create form (rotates to an × while open)
const PlusToggle = ({ open, label, onClick }: { open: boolean; label: string; onClick: () => void }) => (
  <Button
    aria-label={open ? `Close ${label.toLowerCase()}` : label}
    title={open ? 'Close' : label}
    onClick={onClick}
    flex="none"
    w="40px"
    h="40px"
    minW="40px"
    p={0}
    display="grid"
    placeItems="center"
    borderRadius="full"
    bg={open ? 'brand.primary' : 'brand.surfaceRaised'}
    color={open ? 'brand.onPrimary' : 'brand.text'}
    border="1px solid"
    borderColor={open ? 'brand.primary' : 'brand.border'}
    transform={open ? 'rotate(45deg)' : 'none'}
    transition="transform .16s ease, background .16s ease, border-color .16s ease"
    _hover={{ borderColor: 'brand.primary', bg: open ? 'brand.primaryLight' : 'brand.surfaceRaised' }}>
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  </Button>
)

const format = (n: number, digits = 0) =>
  n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: digits })

export const Events = () => {
  const history = useHistory()
  const { search: query } = useLocation()
  const theme = useTheme()
  const isMobile = useBreakpointValue({ base: true, md: false })
  // opened from a calendar day with new=1: the Events tab, form prefilled with that date
  const prefill = useMemo(() => readDatePrefill(query, 'date'), [query])
  useEffect(() => {
    if (prefill) setShowForm(true)
  }, [prefill])
  const [ready, setReady] = useState(false)
  const [events, setEvents] = useState<AdminEvent[]>([])
  const [pairs, setPairs] = useState<AdminPair[]>([])
  const [search, setSearch] = useState('')
  const [a, setA] = useState<AdminEvent | null>(null)
  const [b, setB] = useState<AdminEvent | null>(null)
  const [includeFirst, setIncludeFirst] = useState(true)
  // helpers for finding an Event B worth pairing: computed in the browser against the chosen A
  const [onlyWhole, setOnlyWhole] = useState<string[]>([])
  const toggleIn = (list: any[], set: (v: any[]) => void, item: any) =>
    set(list.includes(item) ? list.filter((x) => x !== item) : [...list, item])
  // events Event A is already paired with (any direction), fetched fresh whenever A changes or
  // a pair is saved/removed, so the Event B list only offers new combinations
  const [pairedWithA, setPairedWithA] = useState<Set<string>>(new Set())
  useEffect(() => {
    if (!a) {
      setPairedWithA(new Set())
      return
    }
    let stale = false
    admin
      .listPairs({ event: a.uuid, limit: 1000 })
      .then((list) => {
        if (stale) return
        setPairedWithA(new Set(list.map((p) => (p.a.uuid === a.uuid ? p.b.uuid : p.a.uuid))))
      })
      .catch(() => {})
    return () => {
      stale = true
    }
  }, [a, pairs])
  const candidateFilter = useMemo(() => {
    if (!a) return undefined
    return (e: AdminEvent) => {
      if (e.uuid === a.uuid || pairedWithA.has(e.uuid)) return false
      const calc = breakdown(a, e, includeFirst)
      const wholeOf: Record<string, number> = {
        weeks: calc.weeks,
        years_364: calc.years_364,
        years_360: calc.years_360,
        new_moons: calc.new_moons_fraction
      }
      // OR: any one of the chosen measures coming out whole is enough
      return onlyWhole.length === 0 || onlyWhole.some((k) => isWholeNumber(wholeOf[k]))
    }
  }, [a, includeFirst, onlyWhole, pairedWithA])
  const [showForm, setShowForm] = useState(false)
  const [showPairForm, setShowPairForm] = useState(false)
  const [tab, setTab] = useState(0)
  // with the global Details switch off, one card at a time can be opened by clicking it
  const [expanded, setExpanded] = useState<string | null>(null)
  // global for the page: show or hide every card's detail strip (remembered per browser)
  const [showDetails, setShowDetails] = useState<boolean>(() => {
    try {
      return localStorage.getItem('pairs_show_details') !== 'false'
    } catch {
      return true
    }
  })
  const toggleDetails = () => {
    setShowDetails((v) => {
      try {
        localStorage.setItem('pairs_show_details', String(!v))
      } catch {}
      return !v
    })
  }
  const [editing, setEditing] = useState<AdminEvent | null>(null)
  const startEdit = (e: AdminEvent) => {
    setEditing(e)
    setShowForm(true)
  }
  const stopEdit = () => setEditing(null)

  // events and pairs are saved in the background so you can keep going; the panel in the
  // corner shows each job's progress and clears finished ones after a moment
  type Job = { id: number; kind: 'event' | 'pair'; name: string; status: 'queued' | 'saving' | 'saved' | 'failed'; error?: string }
  const [jobs, setJobs] = useState<Job[]>([])
  const nextId = React.useRef(1)
  const setJob = (id: number, patch: Partial<Job>) =>
    setJobs((list) => list.map((j) => (j.id === id ? { ...j, ...patch } : j)))
  const runJob = (kind: Job['kind'], name: string, work: () => Promise<unknown>) => {
    const id = nextId.current++
    setJobs((list) => [...list, { id, kind, name, status: 'queued' }])
    ;(async () => {
      setJob(id, { status: 'saving' })
      try {
        await work()
        setJob(id, { status: 'saved' })
        await load()
        setTimeout(() => setJobs((list) => list.filter((j) => j.id !== id)), 4000)
      } catch (err: any) {
        setJob(id, { status: 'failed', error: err?.response?.data?.message || 'Could not save' })
      }
    })()
  }
  const enqueue = (event: NewEvent, uuid?: string) =>
    runJob('event', event.name, () => (uuid ? admin.updateEvent(uuid, event) : admin.createEvent(event)))

  const { logout: endSession } = useAuth()
  const logout = useCallback(() => {
    endSession()
    history.replace(Routes.Login)
  }, [endSession, history])

  // pairs list filter: measure + range / whole / divisible-by, and a sort; runs server-side
  const [filter, setFilter] = useState<PairFilter>({ sort: 'created_at', dir: 'desc' })
  const filterRef = React.useRef(filter)
  filterRef.current = filter
  const load = useCallback(async () => {
    const [ev, pr] = await Promise.all([admin.listEvents(), admin.listPairs(filterRef.current)])
    setEvents(ev)
    setPairs(pr)
  }, [])
  const firstRun = React.useRef(true)
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false
      return
    }
    admin.listPairs(filter).then(setPairs).catch(() => undefined)
  }, [filter])
  const setF = (patch: Partial<PairFilter>) => setFilter((f) => ({ ...f, ...patch }))

  // session gate: no token, or a token the API rejects, goes back to the login page
  useEffect(() => {
    if (!getToken()) {
      history.replace(Routes.Login)
      return
    }
    auth
      .me()
      .then(load)
      .then(() => setReady(true))
      .catch(logout)
    window.addEventListener('AUTH_LOGOUT', logout)
    return () => window.removeEventListener('AUTH_LOGOUT', logout)
    // once, on mount: this is the session gate, not something to re-run on re-render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  type SortKey = 'name' | 'gregorian' | 'hebrew'
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'hebrew', dir: 1 })
  const toggleSort = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === 1 ? -1 : 1 } : { key, dir: 1 }))

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const list = q
      ? events.filter((e) => e.name.toLowerCase().includes(q) || hebrewLabel(e).includes(q) || e.gregorian.includes(q))
      : [...events]
    // both date columns order chronologically (day_index), which is what a date sort means
    const cmp =
      sort.key === 'name'
        ? (a: AdminEvent, b: AdminEvent) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
        : (a: AdminEvent, b: AdminEvent) => Number(a.day_index) - Number(b.day_index)
    return list.sort((a, b) => cmp(a, b) * sort.dir)
  }, [events, search, sort])

  const removeEvent = async (uuid: string) => {
    if (!window.confirm('Delete this event and every pair that uses it?')) return
    await admin.deleteEvent(uuid)
    await load()
  }

  const savePair = () => {
    if (!a || !b) return
    const pair = { a: a.uuid, b: b.uuid, include_first_day: includeFirst }
    // keep Event A so the next pair can be made against the same anchor; only B resets,
    // and it leaves the Event B list immediately rather than after the save lands
    setB(null)
    setPairedWithA((set) => new Set(set).add(pair.b))
    runJob('pair', `${a.name} → ${b.name}`, () => admin.createPair(pair))
  }

  const favoritePair = async (uuid: string, favorite: boolean) => {
    const updated = await admin.setPairFavorite(uuid, favorite)
    setPairs((list) => list.map((p) => (p.uuid === uuid ? { ...p, favorite: updated.favorite } : p)))
  }

  const includeFirstPair = async (uuid: string, include: boolean) => {
    try {
      const updated = await admin.updatePair(uuid, { include_first_day: include })
      setPairs((list) => list.map((p) => (p.uuid === uuid ? updated : p)))
    } catch (err: any) {
      window.alert(err?.response?.data?.message || 'Could not update the pair.')
    }
  }

  const removePair = async (uuid: string) => {
    if (!window.confirm('Delete this pair?')) return
    await admin.deletePair(uuid)
    await load()
  }

  if (!ready) return null

  return (
    <Flex direction="row" justify="center" background="brand.background">
      <Flex direction="column" pt={6} pb={16} px={{ base: 4, md: 0 }} w="full" maxW={{ base: '100%', md: theme.sizes.container.xl }}>
        <Tabs variant="unstyled" colorScheme="yellow" index={tab} onChange={setTab}>
          <TabList gap={6} borderBottom="1px solid" borderColor="brand.border" alignItems="center">
            {['Events', 'Event Pairs'].map((label) => (
              <Tab
                key={label}
                px={0}
                pb={3}
                fontFamily="heading"
                fontSize={{ base: 'md', md: 'lg' }}
                fontWeight="700"
                color="brand.textSecondary"
                borderBottom="2px solid"
                borderColor="transparent"
                mb="-1px"
                _selected={{ color: 'brand.primary', borderColor: 'brand.primary' }}
                _focus={{ boxShadow: 'none' }}
                _focusVisible={{ boxShadow: 'none' }}>
                {label}
              </Tab>
            ))}
            <Box ml="auto" pb={2}>
              {tab === 0 ? (
                <PlusToggle
                  open={showForm}
                  label="New event"
                  onClick={() => {
                    setShowForm((v) => !v)
                    stopEdit()
                  }}
                />
              ) : (
                <PlusToggle open={showPairForm} label="New pair" onClick={() => setShowPairForm((v) => !v)} />
              )}
            </Box>
          </TabList>
          <TabPanels>
          <TabPanel px={0} pt={6}>
          <Flex align="center" gap={3} mb={5}>
            <Input
              size="md"
              h="40px"
              bg="brand.surfaceRaised"
              borderColor="brand.border"
              borderRadius="md"
              placeholder="Search events…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </Flex>
          {showForm ? (
            <Box mb={5}>
              <Card>
                <EventForm
                  key={editing ? editing.uuid : 'new'}
                  initial={prefill}
                  editing={editing}
                  onCancel={stopEdit}
                  onSubmit={(event) => {
                    enqueue(event, editing?.uuid)
                    if (editing) stopEdit()
                  }}
                />
              </Card>
            </Box>
          ) : null}
          <Box borderRadius="lg" overflow="hidden" border="1px solid" borderColor="brand.border" boxShadow="brand.base" bg="brand.surfaceRaised">
            <Grid
              templateColumns={{ base: '1fr', md: '1fr 130px 130px 110px 190px 90px 70px' }}
              gap={4}
              px={{ base: 4, md: 6 }}
              py={3}
              display={{ base: 'none', md: 'grid' }}
              bg="brand.backgroundAlt"
              borderBottom="1px solid"
              borderColor="brand.primary">
              {[
                { label: 'Event', key: 'name' as SortKey },
                { label: 'Hebrew', key: 'hebrew' as SortKey },
                { label: 'Gregorian', key: 'gregorian' as SortKey },
                { label: 'Day' },
                { label: 'Holidays' },
                { label: 'By' },
                { label: '' }
              ].map(({ label, key }) => (
                <Text
                  key={label}
                  as={key ? 'button' : 'span'}
                  onClick={key ? () => toggleSort(key) : undefined}
                  textAlign="left"
                  fontSize="11px"
                  fontWeight="600"
                  letterSpacing="0.08em"
                  textTransform="uppercase"
                  color={key && sort.key === key ? 'brand.primary' : 'brand.textSecondary'}
                  cursor={key ? 'pointer' : 'default'}
                  _hover={key ? { color: 'brand.text' } : undefined}>
                  {label}
                  {key && sort.key === key ? (sort.dir === 1 ? ' ↑' : ' ↓') : ''}
                </Text>
              ))}
            </Grid>
            {filtered.length ? (
              filtered.map((e) =>
                isMobile ? (
                  // phone: a compact card — title + delete, dates, weekday · holidays, creator
                  <Box key={e.uuid} px={4} py={3.5} borderBottom="1px solid" borderColor="brand.borderMuted">
                    <Flex justify="space-between" align="flex-start" gap={3}>
                      <Box>
                        <Text fontSize="15px" fontWeight="600" color="brand.text" lineHeight="1.3" cursor="pointer" onClick={() => startEdit(e)}>
                          {e.name}
                        </Text>
                        {e.description ? (
                          <Text fontSize="12px" color="brand.textSecondary" mt={0.5}>
                            {e.description}
                          </Text>
                        ) : null}
                      </Box>
                      <Button size="xs" variant="ghost" color="brand.textSecondary" flex="none" mt={-1} mr={-2} onClick={() => removeEvent(e.uuid)}>
                        Delete
                      </Button>
                    </Flex>
                    <Text className="mono" fontSize="13px" color="brand.text" mt={2}>
                      {hebrewLabel(e)}
                      <Text as="span" color="brand.textSecondary" mx={2}>
                        ·
                      </Text>
                      {e.gregorian}
                    </Text>
                    <Text fontSize="13px" color="brand.textSecondary" mt={1}>
                      {e.day_of_week}
                      {(e.holidays || []).map((h) => (
                        <React.Fragment key={h}>
                          <Text as="span" mx={2}>
                            ·
                          </Text>
                          <Text as="span" color="brand.primary">
                            {h}
                          </Text>
                        </React.Fragment>
                      ))}
                    </Text>
                  </Box>
                ) : (
                <Grid
                  key={e.uuid}
                  templateColumns={{ base: '1fr', md: '1fr 130px 130px 110px 190px 90px 70px' }}
                  gap={{ base: 1, md: 4 }}
                  px={{ base: 4, md: 6 }}
                  py={4}
                  alignItems="start"
                  bg="transparent"
                  borderBottom="1px solid"
                  borderColor="brand.borderMuted"
                  transition="background .12s ease"
                  _hover={{ bg: 'brand.backgroundAlt' }}>
                  <Box cursor="pointer" onClick={() => startEdit(e)} title="Edit">
                    <Text fontSize="15px" fontWeight="500" color="brand.text" lineHeight="1.3" _hover={{ color: 'brand.primary' }}>
                      {e.name}
                    </Text>
                    {e.description ? (
                      <Text fontSize="12px" color="brand.textSecondary" mt={0.5}>
                        {e.description}
                      </Text>
                    ) : null}
                  </Box>
                  <Text className="mono" fontSize="14px" color="brand.text">
                    {hebrewLabel(e)}
                  </Text>
                  <Text className="mono" fontSize="14px" color="brand.text">
                    {e.gregorian}
                  </Text>
                  <Text fontSize="14px" color="brand.text">
                    {e.day_of_week}
                  </Text>
                  <Box>
                    {(e.holidays || []).map((h) => (
                      <Text key={h} fontSize="13px" color="brand.primary" lineHeight="1.5">
                        {h}
                      </Text>
                    ))}
                  </Box>
                  <Text fontSize="14px" color="brand.textSecondary">
                    {e.created_by_name || '—'}
                  </Text>
                  <Button size="xs" variant="ghost" color="brand.textSecondary" justifySelf="end" onClick={() => removeEvent(e.uuid)}>
                    Delete
                  </Button>
                </Grid>
                )
              )
            ) : (
              <Text px={6} py={4} fontSize="13px" color="brand.textSecondary">
                {events.length ? 'No events match.' : 'No events yet — press + to add one.'}
              </Text>
            )}
          </Box>
          </TabPanel>
          <TabPanel px={0} pt={6}>
          {showPairForm ? (
          <Box mb={6}>
          <Card>
            <Flex gap={{ base: 4, md: 8 }} wrap="wrap" align="flex-start" mb={6}>
              <Box>
                <Text fontSize="10px" fontWeight="600" letterSpacing="0.1em" textTransform="uppercase" color="brand.textSecondary" mb={2}>
                  Counting
                </Text>
                <ToggleSwitch label="Include first day" checked={includeFirst} onChange={setIncludeFirst} />
              </Box>
              <Box>
                <Flex align="baseline" gap={3} mb={2}>
                  <Text fontSize="10px" fontWeight="600" letterSpacing="0.1em" textTransform="uppercase" color="brand.textSecondary">
                    Only whole (any of)
                  </Text>
                  <Text
                    as="button"
                    type="button"
                    fontSize="10px"
                    fontWeight="600"
                    letterSpacing="0.1em"
                    textTransform="uppercase"
                    color="brand.primary"
                    _hover={{ color: 'brand.text' }}
                    onClick={() => setOnlyWhole(onlyWhole.length === WHOLE_KEYS.length ? [] : [...WHOLE_KEYS])}>
                    {onlyWhole.length === WHOLE_KEYS.length ? 'None' : 'All'}
                  </Text>
                </Flex>
                <Flex gap={4} wrap="wrap">
                  {[
                    { key: 'weeks', label: 'Weeks' },
                    { key: 'years_364', label: 'Enochian years' },
                    { key: 'years_360', label: 'Revelation years' },
                    { key: 'new_moons', label: 'New moons' }
                  ].map(({ key, label }) => (
                    <ToggleSwitch key={key} label={label} checked={onlyWhole.includes(key)} onChange={() => toggleIn(onlyWhole, setOnlyWhole, key)} />
                  ))}
                </Flex>
              </Box>
            </Flex>
            <Flex direction={{ base: 'column', md: 'row' }} gap={6}>
              <EventPicker label="EVENT A" events={events} value={a} onChange={setA} />
              <EventPicker label="EVENT B" events={events} value={b} onChange={setB} filterFn={candidateFilter} />
            </Flex>
            <Flex mt={8} direction="column" align="center" gap={2}>
              <Button
                size="sm"
                isDisabled={!a || !b || a.uuid === b.uuid}
                onClick={savePair}
                bg="brand.primary"
                color="brand.onPrimary"
                fontWeight="500"
                borderRadius="md"
                px={8}
                sx={{ ':hover': { bg: 'brand.primaryLight' } }}>
                Save pair
              </Button>
              {a && b && a.uuid === b.uuid ? (
                <Text fontSize="13px" color="brand.textSecondary">
                  Pick two different events.
                </Text>
              ) : null}
            </Flex>
          </Card>
          </Box>
          ) : null}
          {/* row 1: view switches, sort, new pair */}
          <Flex align="center" gap={{ base: 4, md: 6 }} mb={4} wrap="wrap">
            <ToggleSwitch label="Details" checked={showDetails} onChange={toggleDetails} />
            <ToggleSwitch label="★ Favorites" checked={!!filter.favorite} onChange={(v) => setF({ favorite: v })} />
            <Flex ml="auto" align="center" gap={2}>
              <Text fontSize="11" fontWeight="500" color="brand.textSecondary" pr={1}>
                SORT
              </Text>
              <Select size="sm" bg="brand.surfaceRaised" w={{ base: '150px', md: '200px' }} value={filter.sort || 'created_at'} onChange={(e) => setF({ sort: e.target.value })}>
                <option value="created_at">Newest</option>
                {PAIR_FIELDS.map(({ key, label }) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </Select>
              <Select size="sm" bg="brand.surfaceRaised" w="70px" value={filter.dir || 'desc'} onChange={(e) => setF({ dir: e.target.value as 'asc' | 'desc' })}>
                <option value="desc">↓</option>
                <option value="asc">↑</option>
              </Select>
            </Flex>
          </Flex>

          <Flex mb={4} gap={2} wrap="wrap" align="flex-end">
            <Box>
              <Text fontSize="11" fontWeight="500" pl="2" mb={1}>
                MEASURE
              </Text>
              <Select
                size="sm"
                bg="brand.surfaceRaised"
                w="220px"
                value={filter.field || ''}
                onChange={(e) => setF({ field: e.target.value || undefined, min: '', max: '', divisible_by: undefined, whole: false })}>
                <option value="">Any</option>
                {PAIR_FIELDS.map(({ key, label }) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </Select>
            </Box>
            {filter.field ? (
              <>
                <Box>
                  <Text fontSize="11" fontWeight="500" pl="2" mb={1}>
                    MIN
                  </Text>
                  <Input size="sm" bg="brand.surfaceRaised" w="90px" type="number" value={filter.min || ''} onChange={(e) => setF({ min: e.target.value })} />
                </Box>
                <Box>
                  <Text fontSize="11" fontWeight="500" pl="2" mb={1}>
                    MAX
                  </Text>
                  <Input size="sm" bg="brand.surfaceRaised" w="90px" type="number" value={filter.max || ''} onChange={(e) => setF({ max: e.target.value })} />
                </Box>
                <Box>
                  <Text fontSize="11" fontWeight="500" pl="2" mb={1}>
                    DIVISIBLE BY
                  </Text>
                  <Select size="sm" bg="brand.surfaceRaised" w="110px" value={filter.divisible_by || ''} onChange={(e) => setF({ divisible_by: e.target.value || undefined })}>
                    <option value="">—</option>
                    {DIVISORS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </Select>
                </Box>
                <Box pb={1} pl={2}>
                  <ToggleSwitch label="Whole number" checked={!!filter.whole} onChange={(v) => setF({ whole: v })} />
                </Box>
              </>
            ) : null}
          </Flex>

          <Box>
            {pairs.length ? (
              pairs.map((p) => (
                <PairCard
                  key={p.uuid}
                  pair={p}
                  highlightFavorite={!filter.favorite}
                  showDetails={showDetails || expanded === p.uuid}
                  onToggle={showDetails ? undefined : () => setExpanded((cur) => (cur === p.uuid ? null : p.uuid))}
                  onDelete={() => removePair(p.uuid)}
                  onFavorite={(fav) => favoritePair(p.uuid, fav)}
                  onIncludeFirst={(inc) => includeFirstPair(p.uuid, inc)}
                />
              ))
            ) : (
              <Text fontSize="13px" color="brand.textSecondary">
                {filter.field || filter.q ? 'No pairs match this filter.' : 'No pairs yet — pick two events above.'}
              </Text>
            )}
          </Box>
          </TabPanel>
          </TabPanels>
        </Tabs>
      </Flex>

      {jobs.length ? (
        <Box
          position="fixed"
          right={{ base: 3, md: 6 }}
          bottom={{ base: 3, md: 6 }}
          zIndex={50}
          w={{ base: 'calc(100% - 24px)', md: '300px' }}
          bg="brand.surfaceRaised"
          border="1px solid"
          borderColor="brand.border"
          borderRadius="lg"
          boxShadow="brand.lift"
          overflow="hidden">
          <Text px={4} py={2} fontSize="10px" fontWeight="600" letterSpacing="0.12em" textTransform="uppercase" color="brand.textSecondary" bg="brand.backgroundAlt" borderBottom="1px solid" borderColor="brand.borderMuted">
            {jobs.every((j) => j.kind === 'pair') ? 'Saving pairs' : jobs.every((j) => j.kind === 'event') ? 'Saving events' : 'Saving'}
          </Text>
          {jobs.map((j) => (
            <Flex key={j.id} px={4} py={2} align="center" gap={3} borderBottom="1px solid" borderColor="brand.borderMuted">
              <Box
                flex="none"
                w="8px"
                h="8px"
                borderRadius="full"
                bg={j.status === 'saved' ? 'green.400' : j.status === 'failed' ? 'red.400' : 'brand.primary'}
                opacity={j.status === 'queued' ? 0.4 : 1}
              />
              <Text flex="1" fontSize="13px" color="brand.text" noOfLines={1}>
                {j.name}
              </Text>
              <Text fontSize="11px" color={j.status === 'failed' ? 'red.400' : 'brand.textSecondary'} flex="none">
                {j.status === 'failed' ? j.error : j.status}
              </Text>
              {j.status === 'failed' ? (
                <Button size="xs" variant="ghost" onClick={() => setJobs((list) => list.filter((x) => x.id !== j.id))}>
                  ×
                </Button>
              ) : null}
            </Flex>
          ))}
        </Box>
      ) : null}
    </Flex>
  )
}
