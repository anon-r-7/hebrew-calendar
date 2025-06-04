import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react'
import {
  Box,
  Button,
  Checkbox,
  Collapse,
  Flex,
  HStack,
  Icon,
  IconButton,
  Input,
  Select as ChakraSelect,
  SimpleGrid,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  Text,
  Stack,
  NumberInput,
  NumberInputField,
  RadioGroup,
  Radio,
  VStack
} from '@chakra-ui/react'
import { IconType } from 'react-icons'
import { FiFilter, FiLoader, FiRefreshCw, FiStar } from 'react-icons/fi'
import { AiFillStar } from 'react-icons/ai'

import { useStore } from '@admin/hooks/useStore'
import { useAsyncManager } from '@admin/hooks/useAsyncManager'
import { Loading } from '@admin/components/Loading'
import { NavBar } from '@admin/components/NavBar'

import {
  getPairs,
  updatePair,
  postSync,
  getSync,
  getFilterMeta
} from './methods/api'
import { InitialState } from './types'
import { GetPairsParams } from '@admin/api/events/interface'

/* -------------------------------------------------------------------------- */
/*                                Utils                                       */
/* -------------------------------------------------------------------------- */

const isValidDateFormat = (value: string) =>
  /^\d{4}-\d{2}-\d{2}( BC)?$/.test(value)

/* -------------------------------------------------------------------------- */
/*                                Constants                                   */
/* -------------------------------------------------------------------------- */
const initialState: InitialState = {
  syncing: false,
  pairs: [],
  meta: {
    count: { total: 0, current: 0 },
    page: { current: 1, next: null, prev: null, limit: 50 }
  },
  filterMeta: {
    events: [],
    users: [],
    entries: []
  }
}

const PAGE_SIZE_OPTIONS = [50, 100, 200]

const initialGregorianFilters = {
  gregorian: '',
  gregorian_from: '',
  gregorian_to: '',
  gregorian_before: '',
  gregorian_after: '',

  valid_gregorian: false,
  valid_gregorian_from: false,
  valid_gregorian_to: false,
  valid_gregorian_before: false,
  valid_gregorian_after: false
}

/* -------------------------------------------------------------------------- */
/*                                 Component                                  */
/* -------------------------------------------------------------------------- */
export const EventsPairs: React.FC = () => {
  const store = useStore(initialState)
  const asyncManager = useAsyncManager()

  const syncingRef = useRef(store.state.syncing)

  /* -------------------------------- State --------------------------------- */
  const [page, setPage] = useState<number>(1)
  const [size, setSize] = useState<number>(PAGE_SIZE_OPTIONS[0])

  const [showFilters, setShowFilters] = useState(false)
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>(
    {}
  )
  const toggleExpanded = (uuid: string) =>
    setExpandedItems((prev) => ({ ...prev, [uuid]: !prev[uuid] }))

  const [gregorianSelection, setGregorianSelection] = useState('exact')
  const [gregorianSource, setGregorianSource] = useState('user')

  const [gregorianFilters, setGregorianFilters] = useState(
    initialGregorianFilters
  )

  const updateGregorianFilter = (key, value) => {
    setGregorianFilters((prev) => ({
      ...prev,
      [key]: value,
      [`valid_${key}`]: isValidDateFormat(value)
    }))
  }

  /* ----------- Filters (UI state & API-side params kept in sync) ----------- */
  const [filters, setFilters] = useState<GetPairsParams>({
    // ─ quick flags & search
    favorite: undefined,
    name: '',
    tags: '',
    order: 'gregorian_desc',

    // ─ numeric
    weeks: '',
    revelation_years: '',
    enochian_years: '',
    exact_weeks: undefined,
    exact_rev_years: undefined,
    exact_enoch_years: undefined,

    // ─ gregorian group
    gregorian_source: 'user', // default
    gregorian: '',
    gregorian_from: '',
    gregorian_to: '',
    gregorian_before: '',
    gregorian_after: '',

    exclude_before_feasts: undefined,
    exclude_after_feasts: undefined,

    // ─ IDs
    events_pairs_uuid: '',
    events_entry_uuid: '',
    hebrew_events_uuid: '',
    created_by_uuid: ''
  })

  const handleFilterChange = <K extends keyof GetPairsParams>(
    field: K,
    value: GetPairsParams[K]
  ) => {
    setFilters((prev) => ({ ...prev, [field]: value }))
    setPage(1)
  }

  /* -------------------------------- Refs  --------------------------------- */
  const lastFiltersRef = useRef<string>(JSON.stringify(filters))
  const lastPageRef = useRef<number>(page)
  const lastSizeRef = useRef<number>(size)
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  /* ------------------------------ Callbacks -------------------------------- */
  const fetchPairs = useCallback(() => {
    getPairs({
      asyncManager,
      store,
      payload: {
        page,
        limit: size,
        ...filters
      }
    })
  }, [asyncManager, store, page, size, filters])

  const init = async () => {
    await getFilterMeta({
      asyncManager,
      store
    })
    fetchPairs()
  }

  /* ------------------------------ Effects -------------------------------- */
  useEffect(() => {
    if (syncingRef.current && !store.state.syncing) {
      fetchPairs()
    }
    syncingRef.current = store.state.syncing
  }, [store.state.syncing])

  useEffect(() => {
    const filtersString = JSON.stringify(filters)
    const filtersChanged = filtersString !== lastFiltersRef.current

    const pageChanged = page !== lastPageRef.current
    const sizeChanged = size !== lastSizeRef.current

    if (!filtersChanged && !pageChanged && !sizeChanged) return undefined

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }

    debounceTimeoutRef.current = setTimeout(() => {
      lastFiltersRef.current = filtersString
      lastPageRef.current = page
      lastSizeRef.current = size
      fetchPairs()
    }, 300)

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [filters, page, size, fetchPairs])

  useEffect(() => {
    init()
  }, [])

  /* ---- Poll sync status while the backend is still working ---- */
  const pollSyncStatus = useCallback(async () => {
    await getSync({ asyncManager, store })
  }, [fetchPairs])

  const handleSync = useCallback(async () => {
    await postSync({ asyncManager, store })

    const id = setInterval(async () => {
      if (syncingRef.current) {
        await pollSyncStatus()
      } else {
        clearInterval(id)
      }
    }, 15000)
  }, [pollSyncStatus])

  /* ----------------------------- Pagination -------------------------------- */
  const totalPages = useMemo(() => {
    const total = store.state.meta.count.total ?? page * size
    return Math.max(1, Math.ceil(total / size))
  }, [store.state.meta.count.total, page, size])

  /* --------------------------- CRUD Handlers ------------------------------- */
  const handleToggleFavorite = async (
    events_pairs_uuid: string,
    favorite: boolean
  ) => {
    await updatePair({
      asyncManager,
      store,
      events_pairs_uuid,
      payload: { favorite: !favorite }
    })
  }

  /* ------------------------ Icon Caster helper ----------------------------- */
  const castIcon = (icon: IconType) => icon as unknown as React.ElementType

  /* ------------------------------------------------------------------------ */
  /*                                 RENDER                                   */
  /* ------------------------------------------------------------------------ */
  return (
    <>
      <NavBar />
      <Box p={4}>
        <Loading loading={asyncManager.loading} />

        {/* Top bar – Sync & Filter toggler */}
        <Flex
          mb={6}
          justify="space-between"
          direction={{ base: 'column', md: 'row' }}
          gap={4}>
          <Button
            color={'black'}
            leftIcon={
              store.state.syncing ? (
                <Icon as={castIcon(FiLoader)} boxSize={4} className="spin" />
              ) : (
                <Icon as={castIcon(FiRefreshCw)} boxSize={4} />
              )
            }
            onClick={handleSync}
            colorScheme={store.state.syncing ? 'orange' : 'brand'}
            isDisabled={store.state.syncing}
            alignSelf={{ base: 'flex-start', md: 'auto' }}>
            {store.state.syncing ? 'Syncing…' : 'Sync Pairs'}
          </Button>

          <Button
            leftIcon={<Icon as={castIcon(FiFilter)} boxSize={4} />}
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}>
            Filters
          </Button>
        </Flex>

        {/* --------------------------- Filters UI --------------------------- */}
        <Collapse in={showFilters}>
          <Box
            mb={8}
            p={4}
            borderWidth="1px"
            borderRadius="md"
            bg="brand.surface">
            <Stack spacing={6}>
              {/* ➊ — Quick search & flags */}
              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                <Input
                  placeholder="Name contains…"
                  value={filters.name ?? ''}
                  onChange={(e) => handleFilterChange('name', e.target.value)}
                />

                <Input
                  placeholder="Tags (Comma Separated)"
                  value={filters.tags ?? ''}
                  onChange={(e) => handleFilterChange('tags', e.target.value)}
                />

                <ChakraSelect
                  value={filters.order}
                  onChange={(e) =>
                    handleFilterChange('order', e.target.value as any)
                  }>
                  <option value="gregorian_desc">Newest first</option>
                  <option value="gregorian">Oldest first</option>
                  <option value="diff">Smallest diff</option>
                  <option value="diff_desc">Largest diff</option>
                </ChakraSelect>

                <Checkbox
                  isChecked={!!filters.favorite}
                  onChange={(e) =>
                    handleFilterChange(
                      'favorite',
                      e.target.checked ? true : undefined
                    )
                  }>
                  Favorites only
                </Checkbox>

                <Checkbox
                  isChecked={!!filters.exclude_before_feasts}
                  onChange={(e) =>
                    handleFilterChange(
                      'exclude_before_feasts',
                      e.target.checked ? true : undefined
                    )
                  }>
                  Exclude “before” feasts
                </Checkbox>

                <Checkbox
                  isChecked={!!filters.exclude_after_feasts}
                  onChange={(e) =>
                    handleFilterChange(
                      'exclude_after_feasts',
                      e.target.checked ? true : undefined
                    )
                  }>
                  Exclude “after” feasts
                </Checkbox>
              </SimpleGrid>

              {/* ➋ — Numeric + exact flags */}
              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                <NumberInput
                  value={filters.weeks ?? ''}
                  onChange={(valueStr) => {
                    handleFilterChange('weeks', valueStr === '' ? '' : valueStr)
                  }}>
                  <NumberInputField placeholder="Weeks =" />
                </NumberInput>

                <NumberInput
                  value={filters.revelation_years ?? ''}
                  onChange={(valueStr) => {
                    handleFilterChange(
                      'revelation_years',
                      valueStr === '' ? '' : valueStr
                    )
                  }}>
                  <NumberInputField placeholder="Revelation years =" />
                </NumberInput>

                <NumberInput
                  value={filters.enochian_years ?? ''}
                  onChange={(valueStr) => {
                    handleFilterChange(
                      'enochian_years',
                      valueStr === '' ? '' : valueStr
                    )
                  }}>
                  <NumberInputField placeholder="Enochian years =" />
                </NumberInput>

                <Checkbox
                  isChecked={!!filters.exact_weeks}
                  onChange={(e) =>
                    handleFilterChange(
                      'exact_weeks',
                      e.target.checked ? true : undefined
                    )
                  }>
                  Exact weeks
                </Checkbox>

                <Checkbox
                  isChecked={!!filters.exact_rev_years}
                  onChange={(e) =>
                    handleFilterChange(
                      'exact_rev_years',
                      e.target.checked ? true : undefined
                    )
                  }>
                  Exact revelation years
                </Checkbox>

                <Checkbox
                  isChecked={!!filters.exact_enoch_years}
                  onChange={(e) =>
                    handleFilterChange(
                      'exact_enoch_years',
                      e.target.checked ? true : undefined
                    )
                  }>
                  Exact enochian years
                </Checkbox>
              </SimpleGrid>

              {/* ➌ — Gregorian filter (mutually exclusive) */}
              <Box>
                <Text mb={2} fontWeight="bold">
                  Gregorian date filter
                </Text>

                {/* radio chooses the mode */}
                <RadioGroup
                  value={gregorianSelection}
                  onChange={(value) => {
                    setFilters((prev) => ({
                      ...prev,
                      gregorian: '',
                      gregorian_from: '',
                      gregorian_to: '',
                      gregorian_before: '',
                      gregorian_after: ''
                    }))
                    setPage(1)
                    setGregorianFilters(initialGregorianFilters)
                    setGregorianSelection(value)
                  }}>
                  <HStack spacing={8}>
                    <Radio value="exact">Exact date</Radio>
                    <Radio value="range">Range</Radio>
                    <Radio value="before">Before</Radio>
                    <Radio value="after">After</Radio>
                  </HStack>
                </RadioGroup>

                {/* source selector */}
                <HStack mt={2} spacing={4}>
                  <ChakraSelect
                    w="300px"
                    value={gregorianSource}
                    onChange={(e) => setGregorianSource(e.target.value)}>
                    <option value="user">user</option>
                    <option value="system">system</option>
                  </ChakraSelect>

                  {/* date inputs, rendered conditionally by mode */}
                  {gregorianSelection === 'exact' && (
                    <Input
                      type="text"
                      placeholder="YYYY-MM-DD [BC]"
                      value={gregorianFilters.gregorian}
                      onChange={(e) =>
                        updateGregorianFilter('gregorian', e.target.value)
                      }
                      isInvalid={gregorianFilters.valid_gregorian === false}
                    />
                  )}

                  {gregorianSelection === 'range' && (
                    <>
                      <Input
                        type="text"
                        placeholder="From"
                        value={gregorianFilters.gregorian_from}
                        onChange={(e) =>
                          updateGregorianFilter(
                            'gregorian_from',
                            e.target.value
                          )
                        }
                        isInvalid={
                          gregorianFilters.valid_gregorian_from === false
                        }
                      />
                      <Input
                        type="text"
                        placeholder="To"
                        value={gregorianFilters.gregorian_to}
                        onChange={(e) =>
                          updateGregorianFilter('gregorian_to', e.target.value)
                        }
                        isInvalid={
                          gregorianFilters.valid_gregorian_to === false
                        }
                      />
                    </>
                  )}

                  {gregorianSelection === 'before' && (
                    <Input
                      type="text"
                      placeholder="≤ Date"
                      value={gregorianFilters.gregorian_before}
                      onChange={(e) =>
                        updateGregorianFilter(
                          'gregorian_before',
                          e.target.value
                        )
                      }
                      isInvalid={
                        gregorianFilters.valid_gregorian_before === false
                      }
                    />
                  )}

                  {gregorianSelection === 'after' && (
                    <Input
                      type="text"
                      placeholder="≥ Date"
                      value={gregorianFilters.gregorian_after}
                      onChange={(e) =>
                        updateGregorianFilter('gregorian_after', e.target.value)
                      }
                      isInvalid={
                        gregorianFilters.valid_gregorian_after === false
                      }
                    />
                  )}
                  <Button
                    color="brand.primary"
                    onClick={() => {
                      const payload: any = { gregorian_source: gregorianSource }

                      if (gregorianSelection === 'exact') {
                        payload.gregorian = gregorianFilters.gregorian
                      } else if (gregorianSelection === 'range') {
                        payload.gregorian_from = gregorianFilters.gregorian_from
                        payload.gregorian_to = gregorianFilters.gregorian_to
                      } else if (gregorianSelection === 'before') {
                        payload.gregorian_before =
                          gregorianFilters.gregorian_before
                      } else if (gregorianSelection === 'after') {
                        payload.gregorian_after =
                          gregorianFilters.gregorian_after
                      }

                      setFilters((prev) => ({
                        ...prev,
                        ...payload
                      }))
                      setPage(1)
                    }}
                    isDisabled={
                      (gregorianSelection === 'exact' &&
                        !gregorianFilters.valid_gregorian) ||
                      (gregorianSelection === 'range' &&
                        (!gregorianFilters.valid_gregorian_from ||
                          !gregorianFilters.valid_gregorian_to)) ||
                      (gregorianSelection === 'before' &&
                        !gregorianFilters.valid_gregorian_before) ||
                      (gregorianSelection === 'after' &&
                        !gregorianFilters.valid_gregorian_after)
                    }>
                    Set Dates
                  </Button>
                </HStack>
              </Box>

              {/* ➍ — ID / UUID filters */}
              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                {/*<Input
                  placeholder="Pair UUID"
                  value={filters.events_pairs_uuid ?? ''}
                  onChange={(e) =>
                    handleFilterChange('events_pairs_uuid', e.target.value)
                  }
                />*/}
                <ChakraSelect
                  placeholder="Select Entry"
                  value={filters.events_entry_uuid ?? ''}
                  onChange={(e) =>
                    handleFilterChange(
                      'events_entry_uuid',
                      e.target.value === '' ? '' : e.target.value
                    )
                  }>
                  <option value="">—</option>
                  {store.state.filterMeta.entries.map((entry) => (
                    <option key={entry.uuid} value={entry.uuid}>
                      {entry.name}
                    </option>
                  ))}
                </ChakraSelect>

                <ChakraSelect
                  placeholder="Select Hebrew Event"
                  value={filters.hebrew_events_uuid ?? ''}
                  onChange={(e) =>
                    handleFilterChange(
                      'hebrew_events_uuid',
                      e.target.value === '' ? '' : e.target.value
                    )
                  }>
                  <option value="">—</option>
                  {store.state.filterMeta.events.map((event) => (
                    <option key={event.uuid} value={event.uuid}>
                      {event.name}
                    </option>
                  ))}
                </ChakraSelect>

                <ChakraSelect
                  placeholder="Select Creator"
                  value={filters.created_by_uuid ?? ''}
                  onChange={(e) =>
                    handleFilterChange(
                      'created_by_uuid',
                      e.target.value === '' ? '' : e.target.value
                    )
                  }>
                  <option value="">—</option>
                  {store.state.filterMeta.users.map((user) => (
                    <option key={user.uuid} value={user.uuid}>
                      {user.name}
                    </option>
                  ))}
                </ChakraSelect>
              </SimpleGrid>
            </Stack>
          </Box>
        </Collapse>

        {/* ---------------------------- Desktop ---------------------------- */}
        <Box display={{ base: 'none', md: 'block' }} overflowX="auto">
          <Table variant="simple" size="sm">
            <Thead fontSize="xs">
              {/* ──────────────── Row 1 – group labels ──────────────── */}
              <Tr>
                <Th px={1} rowSpan={2}>
                  Fav
                </Th>

                <Th
                  px={1}
                  colSpan={5}
                  textAlign="center"
                  borderLeft="1px solid"
                  borderRight="1px solid"
                  borderColor="gray.200">
                  Distance
                </Th>

                <Th
                  px={1}
                  colSpan={3}
                  textAlign="center"
                  borderLeft="1px solid"
                  borderRight="1px solid"
                  borderColor="gray.200">
                  Evenly Divisible
                </Th>

                {/* group labels */}
                <Th
                  px={1}
                  colSpan={6}
                  textAlign="center"
                  borderLeft="1px solid"
                  borderRight="1px solid"
                  borderColor="gray.200">
                  Side A
                </Th>
                <Th
                  px={1}
                  colSpan={6}
                  textAlign="center"
                  borderRight="1px solid"
                  borderColor="gray.200">
                  Side B
                </Th>

                {/* actions */}
                <Th isNumeric px={1} rowSpan={2}></Th>
              </Tr>

              {/* ──────────────── Row 2 – column labels ─────────────── */}
              <Tr>
                <Th
                  isNumeric
                  px={1}
                  rowSpan={2}
                  borderLeft="1px solid"
                  borderColor="gray.200">
                  ½-days
                </Th>
                <Th isNumeric px={1} rowSpan={2}>
                  Days
                </Th>
                <Th isNumeric px={1} rowSpan={2}>
                  Weeks
                </Th>
                <Th isNumeric px={1} rowSpan={2}>
                  Rev yrs
                </Th>
                <Th isNumeric px={1} rowSpan={2}>
                  Enoch yrs
                </Th>

                <Th
                  px={1}
                  rowSpan={2}
                  textAlign="center"
                  borderLeft="1px solid"
                  borderColor="gray.200">
                  Weeks
                </Th>
                <Th px={1} rowSpan={2} textAlign="center">
                  Rev Yrs
                </Th>
                <Th px={1} rowSpan={2} textAlign="center">
                  Enoch Yrs
                </Th>

                {/* Side A */}
                <Th px={1} borderLeft="1px solid" borderColor="gray.200">
                  Name
                </Th>
                {/*<Th px={1}>Desc</Th>*/}
                {/*<Th px={1}>Src</Th>*/}
                <Th px={1}>Weekday</Th>
                <Th px={1}>Gregorian</Th>
                <Th px={1}>Hebrew</Th>
                <Th px={1}>Tags</Th>
                <Th px={1} borderRight="1px solid" borderColor="gray.200">
                  By
                </Th>

                {/* Side B */}
                <Th px={1}>Name</Th>
                {/*<Th px={1}>Desc</Th>*/}
                {/*<Th px={1}>Src</Th>*/}
                <Th px={1}>Weekday</Th>
                <Th px={1}>Gregorian</Th>
                <Th px={1}>Hebrew</Th>
                <Th px={1}>Tags</Th>
                <Th px={1} borderRight="1px solid" borderColor="gray.200">
                  By
                </Th>
              </Tr>
            </Thead>

            <Tbody>
              {store.state.pairs.map((p) => {
                const [a, b] = p.dates
                const tagsA = a.user?.tags ?? a.system?.short_name ?? '—'
                const tagsB = b.user?.tags ?? b.system?.short_name ?? '—'

                return (
                  <Tr
                    key={p.events_pairs_uuid}
                    _hover={{ bg: 'brand.surface' }}>
                    {/* ─── Global ─── */}
                    <Td px={1}>
                      <IconButton
                        icon={
                          p.favorite ? (
                            <Icon
                              as={castIcon(AiFillStar)}
                              boxSize={4}
                              color="yellow.400"
                            />
                          ) : (
                            <Icon as={castIcon(FiStar)} boxSize={4} />
                          )
                        }
                        size="sm"
                        aria-label="toggle favorite"
                        variant="ghost"
                        onClick={() =>
                          handleToggleFavorite(p.events_pairs_uuid, p.favorite)
                        }
                      />
                    </Td>
                    <Td
                      isNumeric
                      px={1}
                      borderLeft="1px solid"
                      borderColor="gray.200">
                      {p.calculations.half_days}
                    </Td>
                    <Td isNumeric px={1}>
                      {p.calculations.diff}
                    </Td>
                    <Td isNumeric px={1}>
                      {p.calculations.weeks.toFixed(4)}
                    </Td>
                    <Td isNumeric px={1}>
                      {p.calculations.revelation_years.toFixed(4)}
                    </Td>
                    <Td isNumeric px={1}>
                      {p.calculations.enochian_years.toFixed(4)}
                    </Td>
                    <Td
                      px={1}
                      textAlign="center"
                      borderLeft="1px solid"
                      borderColor="gray.200">
                      {p.isExact.weeks ? '✓' : ''}
                    </Td>
                    <Td px={1} textAlign="center">
                      {p.isExact.revelation_years ? '✓' : ''}
                    </Td>
                    <Td px={1} textAlign="center">
                      {p.isExact.enochian_years ? '✓' : ''}
                    </Td>

                    {/* ─── Side A ─── */}
                    <Td px={1} borderLeft="1px solid" borderColor="gray.200">
                      {a.name}
                      {a.system?.event_day && ` (Day ${a.system?.event_day})`}
                    </Td>
                    {/*<Td px={1}>{a.user?.description}</Td>*/}
                    {/*<Td px={1}>{a.source}</Td>*/}
                    <Td px={1}>{a.day_of_week}</Td>
                    <Td px={1}>{a.gregorian.formatted}</Td>
                    <Td px={1}>{a.hebrew.formatted}</Td>
                    <Td px={1}>{tagsA}</Td>
                    <Td px={1} borderRight="1px solid" borderColor="gray.200">
                      {a.user?.created_by.first_name ?? '—'}
                    </Td>

                    {/* ─── Side B ─── */}
                    <Td px={1}>
                      {b.name}
                      {b.system?.event_day && ` (Day ${b.system?.event_day})`}
                    </Td>
                    {/*<Td px={1}>{b.user?.description}</Td>*/}
                    {/*<Td px={1}>{b.source}</Td>*/}
                    <Td px={1}>{b.day_of_week}</Td>
                    <Td px={1}>{b.gregorian.formatted}</Td>
                    <Td px={1}>{b.hebrew.formatted}</Td>
                    <Td px={1}>{tagsB}</Td>
                    <Td px={1} borderRight="1px solid" borderColor="gray.200">
                      {b.user?.created_by.first_name ?? '—'}
                    </Td>

                    {/* actions column already covered by row-span header */}
                    <Td px={1} isNumeric />
                  </Tr>
                )
              })}
            </Tbody>
          </Table>
        </Box>

        {/* ----------------------------- Mobile ---------------------------- */}
        <VStack display={{ base: 'flex', md: 'none' }} spacing={4} mt={4}>
          {store.state.pairs.map((p) => {
            const isExpanded = !!expandedItems[p.events_pairs_uuid]
            const [a, b] = p.dates
            const tagsA = a.user?.tags ?? a.system?.short_name ?? '—'
            const tagsB = b.user?.tags ?? b.system?.short_name ?? '—'

            return (
              <Box
                key={p.events_pairs_uuid}
                w="full"
                borderWidth="1px"
                borderRadius="md"
                p={4}
                onClick={() => toggleExpanded(p.events_pairs_uuid)}
                cursor="pointer">
                <HStack justify="space-between" mb={2}>
                  <Text fontWeight="bold">
                    {a.gregorian.formatted} vs. {b.gregorian.formatted}
                  </Text>
                  {p.favorite && (
                    <Icon as={castIcon(AiFillStar)} color="yellow.400" />
                  )}
                </HStack>
                <Collapse in={isExpanded} animateOpacity>
                  <VStack spacing={2} align="start" mt={2} fontSize="sm">
                    {/* ➊ — Global metrics */}

                    {/* ➋ — Distance */}
                    <Text mt={2} fontWeight="bold">
                      — Distance —
                    </Text>
                    <Text>
                      <b>½-days:</b> {p.calculations.half_days}
                    </Text>
                    <Text>
                      <b>Days</b> {p.calculations.diff}
                    </Text>
                    <Text>
                      <b>Weeks:</b> {p.calculations.weeks.toFixed(4)}
                    </Text>
                    <Text>
                      <b>Rev&nbsp;years:</b>{' '}
                      {p.calculations.revelation_years.toFixed(4)}
                    </Text>
                    <Text>
                      <b>Enoch&nbsp;years:</b>{' '}
                      {p.calculations.enochian_years.toFixed(4)}
                    </Text>

                    {/* ➋ — Evenly Divisible */}
                    <Text mt={2} fontWeight="bold">
                      — Evenly Divisible —
                    </Text>
                    <Text>
                      <b>Weeks:</b> {p.isExact.weeks ? '✓' : '-'}
                    </Text>
                    <Text>
                      <b>Rev&nbsp;Yrs:</b>{' '}
                      {p.isExact.revelation_years ? '✓' : '—'}
                    </Text>
                    <Text>
                      <b>Enoch&nbsp;Yrs:</b>{' '}
                      {p.isExact.enochian_years ? '✓' : '—'}
                    </Text>

                    {/* ➋ — Side A */}
                    <Text mt={2} fontWeight="bold">
                      — Side A —
                    </Text>
                    <Text>
                      <b>Name:</b> {a.name}
                      {a.system?.event_day && ` (Day ${a.system?.event_day})`}
                    </Text>
                    {/*<Text>
                      <b>Description:</b> {a.user?.description}
                    </Text>*/}
                    {/*<Text>
                      <b>Source:</b> {a.source}
                    </Text>*/}
                    <Text>
                      <b>Day of week:</b> {a.day_of_week}
                    </Text>
                    <Text>
                      <b>Gregorian:</b> {a.gregorian.formatted}
                    </Text>
                    <Text>
                      <b>Hebrew:</b> {a.hebrew.formatted}
                    </Text>
                    <Text>
                      <b>Tags:</b> {tagsA}
                    </Text>
                    <Text>
                      <b>Created&nbsp;by:</b>{' '}
                      {a.user?.created_by.first_name ?? '—'}
                    </Text>

                    {/* ➌ — Side B */}
                    <Text mt={2} fontWeight="bold">
                      — Side B —
                    </Text>
                    <Text>
                      <b>Name:</b> {b.name}
                      {b.system?.event_day && ` (Day ${b.system?.event_day})`}
                    </Text>
                    {/*<Text>
                      <b>Description:</b> {b.user?.description}
                    </Text>*/}
                    {/*<Text>
                      <b>Source:</b> {b.source}
                    </Text>*/}
                    <Text>
                      <b>Day of week:</b> {b.day_of_week}
                    </Text>
                    <Text>
                      <b>Gregorian:</b> {b.gregorian.formatted}
                    </Text>
                    <Text>
                      <b>Hebrew:</b> {b.hebrew.formatted}
                    </Text>
                    <Text>
                      <b>Tags:</b> {tagsB}
                    </Text>
                    <Text>
                      <b>Created&nbsp;by:</b>{' '}
                      {b.user?.created_by.first_name ?? '—'}
                    </Text>
                    <HStack pt={2} spacing={2} alignSelf="flex-end">
                      <IconButton
                        icon={
                          p.favorite ? (
                            <Icon
                              as={castIcon(AiFillStar)}
                              boxSize={4}
                              color="yellow.400"
                            />
                          ) : (
                            <Icon as={castIcon(FiStar)} boxSize={4} />
                          )
                        }
                        size="sm"
                        aria-label="toggle favorite"
                        variant="ghost"
                        onClick={(evt) => {
                          evt.stopPropagation()
                          handleToggleFavorite(p.events_pairs_uuid, p.favorite)
                        }}
                      />
                    </HStack>
                  </VStack>
                </Collapse>
              </Box>
            )
          })}
        </VStack>

        {/* --------------------------- Pagination --------------------------- */}
        <HStack spacing={1} mt={4} justify="flex-end">
          <Button
            size="sm"
            variant="ghost"
            isDisabled={page === 1}
            onClick={() => setPage((p) => p - 1)}>
            Prev
          </Button>
          {(() => {
            const items: (number | 'dots')[] = []

            if (totalPages <= 7) {
              // Small range → show all
              for (let i = 1; i <= totalPages; i++) items.push(i)
            } else if (page <= 4) {
              // Near the start
              items.push(1, 2, 3, 4, 5, 'dots', totalPages)
            } else if (page >= totalPages - 3) {
              // Near the end
              items.push(
                1,
                'dots',
                totalPages - 4,
                totalPages - 3,
                totalPages - 2,
                totalPages - 1,
                totalPages
              )
            } else {
              // In the middle
              items.push(
                1,
                'dots',
                page - 1,
                page,
                page + 1,
                'dots',
                totalPages
              )
            }

            return items.map((item, idx) =>
              item === 'dots' ? (
                <Text key={`dots-${idx}`} px={2}>
                  …
                </Text>
              ) : (
                <Button
                  key={item}
                  size="sm"
                  variant={item === page ? 'solid' : 'ghost'}
                  onClick={() => setPage(item)}>
                  {item}
                </Button>
              )
            )
          })()}
          <Button
            size="sm"
            variant="ghost"
            isDisabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
          <ChakraSelect
            size="sm"
            w="80px"
            value={size}
            onChange={(e) => {
              setSize(parseInt(e.target.value, 10))
              setPage(1)
            }}>
            {PAGE_SIZE_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </ChakraSelect>
        </HStack>
      </Box>
    </>
  )
}
