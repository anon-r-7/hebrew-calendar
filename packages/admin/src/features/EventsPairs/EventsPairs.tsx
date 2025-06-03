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
  VStack
} from '@chakra-ui/react'
import { IconType } from 'react-icons'
import { FiFilter, FiLoader, FiRefreshCw, FiStar } from 'react-icons/fi'
import { AiFillStar } from 'react-icons/ai'

import { useStore } from '@admin/hooks/useStore'
import { useAsyncManager } from '@admin/hooks/useAsyncManager'
import { Loading } from '@admin/components/Loading'

import { getPairs, updatePair, postSync, getSync } from './methods/api'
import { InitialState } from './types'
import { GetPairsParams } from '@admin/api/events/interface'

/* -------------------------------------------------------------------------- */
/*                                Constants                                   */
/* -------------------------------------------------------------------------- */
const initialState: InitialState = {
  syncing: false,
  pairs: [],
  meta: {
    count: { total: 0, current: 0 },
    page: { current: 1, next: null, prev: null, limit: 50 }
  }
}

const PAGE_SIZE_OPTIONS = [50, 100, 200]

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

  /* ----------- Filters (UI state & API-side params kept in sync) ----------- */
  const [filters, setFilters] = useState<GetPairsParams>({
    favorite: false,
    name: '',
    tags: '',
    order: 'gregorian_desc'
  })

  const handleFilterChange = (field: keyof GetPairsParams, value: any) => {
    setFilters((prev) => ({ ...prev, [field]: value }))
    setPage(1) // always reset to first page when filters change
  }

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
  }, [page, size, filters])

  /* ------------------------------ Effects -------------------------------- */
  useEffect(() => {
    if (syncingRef.current && !store.state.syncing) {
      fetchPairs()
    }
    syncingRef.current = store.state.syncing
  }, [store.state.syncing])

  useEffect(() => {
    fetchPairs()
  }, [fetchPairs])

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
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
            <Input
              placeholder="Name contains…"
              value={filters.name ?? ''}
              onChange={(e) => handleFilterChange('name', e.target.value)}
            />

            <Input
              placeholder="Tags CSV"
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
                handleFilterChange('favorite', e.target.checked || undefined)
              }>
              Favorites only
            </Checkbox>

            <Checkbox
              isChecked={!!filters.exact_weeks}
              onChange={(e) =>
                handleFilterChange('exact_weeks', e.target.checked || undefined)
              }>
              Exact weeks
            </Checkbox>

            {/* More filters can be added here on demand */}
          </SimpleGrid>
        </Box>
      </Collapse>

      {/* ---------------------------- Desktop ---------------------------- */}
      <Box display={{ base: 'none', md: 'block' }} overflowX="auto">
        <Table variant="simple" size="sm">
          <Thead>
            <Tr>
              <Th>A (Gregorian)</Th>
              <Th>B (Gregorian)</Th>
              <Th isNumeric>Diff&nbsp;(days)</Th>
              <Th isNumeric>Weeks</Th>
              <Th>Names</Th>
              <Th>Tags</Th>
              <Th isNumeric>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {store.state.pairs.map((p) => {
              const [a, b] = p.dates
              const names = p.dates.map((d) => d.name).join(' / ')
              const tags =
                a.user?.tags ??
                b.user?.tags ??
                a.system?.short_name ??
                b.system?.short_name ??
                '—'

              return (
                <Tr key={p.events_pairs_uuid} _hover={{ bg: 'brand.surface' }}>
                  <Td>{a.gregorian.formatted}</Td>
                  <Td>{b.gregorian.formatted}</Td>
                  <Td isNumeric>{p.calculations.diff}</Td>
                  <Td isNumeric>{p.calculations.weeks}</Td>
                  <Td>{names}</Td>
                  <Td>{tags}</Td>
                  <Td isNumeric>
                    <HStack justify="flex-end">
                      <IconButton
                        icon={
                          p.favorite ? (
                            <Icon as={castIcon(AiFillStar)} boxSize={4} />
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
                    </HStack>
                  </Td>
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
                <Text fontWeight="bold">{a.gregorian.formatted}</Text>
                {p.favorite && (
                  <Icon as={castIcon(AiFillStar)} color="yellow.400" />
                )}
              </HStack>
              <Collapse in={isExpanded} animateOpacity>
                <VStack spacing={2} align="start" mt={2} fontSize="sm">
                  <Text>
                    <b>B&nbsp;(Greg.) :</b> {b.gregorian.formatted}
                  </Text>
                  <Text>
                    <b>Diff&nbsp;(days) :</b> {p.calculations.diff}
                  </Text>
                  <Text>
                    <b>Weeks :</b> {p.calculations.weeks}
                  </Text>
                  <Text>
                    <b>Names :</b> {p.dates.map((d) => d.name).join(' / ')}
                  </Text>
                  <HStack pt={2} spacing={2} alignSelf="flex-end">
                    <IconButton
                      icon={
                        p.favorite ? (
                          <Icon as={castIcon(AiFillStar)} boxSize={4} />
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
            items.push(1, 'dots', page - 1, page, page + 1, 'dots', totalPages)
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
  )
}
