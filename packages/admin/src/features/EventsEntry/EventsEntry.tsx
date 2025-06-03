import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react'
import {
  Box,
  Button,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  Flex,
  HStack,
  IconButton,
  Input,
  Select as ChakraSelect,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  Text,
  useBreakpointValue,
  useDisclosure,
  VStack,
  Icon,
  useToast,
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  Collapse
} from '@chakra-ui/react'
import { IconType } from 'react-icons'
import { FiEdit, FiTrash2, FiPlus, FiSave } from 'react-icons/fi'

import { useStore } from '@admin/hooks/useStore'
import { useAsyncManager } from '@admin/hooks/useAsyncManager'
import { Loading } from '@admin/components/Loading'
import { getDateFromParts } from '@admin/utils/date'

import {
  getUsers,
  createEntry,
  deleteEntry,
  getEntries,
  updateEntry
} from './methods/api'
import { Entry, InitialState } from './types'

/* -------------------------------------------------------------------------- */
/*                                Constants                                   */
/* -------------------------------------------------------------------------- */

const initialState: InitialState = {
  users: [],
  entries: [],
  total: 0
}

const PAGE_SIZE_OPTIONS = [500, 1000]

/* -------------------------------------------------------------------------- */
/*                              Create Helpers                                */
/* -------------------------------------------------------------------------- */

type DraftEntry = {
  id: string // local UID for list keys
  type: 'gregorian' | 'hebrew'
  yy: string
  mm: string
  dd: string
  era: 'AD' | 'BC'
  name: string
  description: string
  tags: string
}

const emptyDraft = (): DraftEntry => ({
  id: crypto.randomUUID(),
  type: 'gregorian',
  yy: '',
  mm: '',
  dd: '',
  era: 'AD',
  name: '',
  description: '',
  tags: ''
})

/* -------------------------------------------------------------------------- */
/*                                 Component                                  */
/* -------------------------------------------------------------------------- */

export const EventsEntry: React.FC = () => {
  const store = useStore(initialState)
  const asyncManager = useAsyncManager()
  const toast = useToast()

  const {
    isOpen: isDrawerOpen,
    onOpen: openDrawer,
    onClose: closeDrawer
  } = useDisclosure()

  const {
    isOpen: isAlertOpen,
    onOpen: openAlert,
    onClose: closeAlert
  } = useDisclosure()
  const cancelRef = useRef(null)
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)

  /* -------------------------------- State --------------------------------- */

  const [page, setPage] = useState(1)
  const [size, setSize] = useState(PAGE_SIZE_OPTIONS[0])
  const [createdBy, setCreatedBy] = useState<string | undefined>()

  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>(
    {}
  )
  const toggleExpanded = (uuid: string) =>
    setExpandedItems((prev) => ({ ...prev, [uuid]: !prev[uuid] }))

  // Editing state
  const [editing, setEditing] = useState<Entry | null>(null)

  // Batch create state
  const [drafts, setDrafts] = useState<DraftEntry[]>([])

  /* ------------------------------ Callbacks -------------------------------- */

  const fetch = useCallback(() => {
    getEntries({
      asyncManager,
      store,
      payload: {
        page,
        size,
        ...(createdBy ? { created_by: createdBy } : {})
      }
    })
  }, [page, size, createdBy])

  const init = async () => {
    await getUsers({ asyncManager, store })
    await fetch()
  }

  useEffect(() => {
    fetch()
  }, [createdBy, page, size])

  useEffect(() => {
    init()
  }, [])

  /* ----------------------------- Pagination -------------------------------- */

  const totalPages = useMemo(() => {
    // API should return total count; fallback to "size" to avoid /0
    const count = (store.state as any)?.total ?? page * size
    return Math.max(1, Math.ceil(count / size))
  }, [store.state, size, page])

  /* --------------------------- CRUD Handlers ------------------------------- */

  const handleUpdate = async () => {
    if (!editing) return
    await updateEntry({
      asyncManager,
      store,
      uuid: editing.uuid,
      payload: {
        name: editing.name,
        description: editing.description,
        tags: editing.tags
      }
    })
    setEditing(null)
    closeDrawer()
  }

  const handleDelete = async (uuid: string) => {
    await deleteEntry({ asyncManager, store, uuid })
  }

  /* -------------------------- Delete Confirmation ---------------------------- */

  const confirmDelete = (uuid: string) => {
    setPendingDelete(uuid)
    openAlert()
  }

  const onDeleteConfirmed = async () => {
    if (pendingDelete) {
      await handleDelete(pendingDelete)
      setPendingDelete(null)
      closeAlert()
    }
  }

  /* -------------------------- Batch Create Flow ---------------------------- */

  const addDraft = () => setDrafts((prev) => [...prev, emptyDraft()])
  const removeDraft = (id: string) =>
    setDrafts((prev) => prev.filter((d) => d.id !== id))

  const updateDraft = <K extends keyof DraftEntry>(
    id: string,
    key: K,
    value: DraftEntry[K]
  ) => {
    setDrafts((prev) =>
      prev.map((d) => (d.id === id ? { ...d, [key]: value } : d))
    )
  }

  const saveDrafts = async () => {
    const newEntries = []
    const failedDrafts = []

    asyncManager.start()

    for (const d of drafts) {
      try {
        const date = getDateFromParts(d)
        const entry = await createEntry({
          payload: {
            date,
            type: d.type,
            name: d.name,
            description: d.description,
            tags: d.tags
          }
        })
        if (entry?.uuid) {
          newEntries.push(entry)
        } else {
          failedDrafts.push(d)
        }
      } catch {
        failedDrafts.push(d)
      }
    }

    if (newEntries.length > 0) {
      store.update({
        entries: [...newEntries, ...store.state.entries]
      })
    }

    asyncManager.success()

    setDrafts(failedDrafts)
    if (!failedDrafts.length) {
      closeDrawer()
    } else {
      toast({
        title: 'The following events failed to create',
        description: 'Trying editting and creating again',
        status: 'error',
        duration: 8000,
        isClosable: true
      })
    }
  }

  /* ------------------------ Responsive Drawer Side ------------------------- */
  const drawerPlacement = useBreakpointValue<
    'bottom' | 'top' | 'left' | 'right'
  >({
    base: 'bottom',
    md: 'right'
  })

  /* ------------------------ Icon Caster ------------------------- */
  const castIcon = (icon: IconType) => icon as unknown as React.ElementType

  /* -------------------------------------------------------------------------- */
  /*                               Renderers                                   */
  /* -------------------------------------------------------------------------- */

  const renderPagination = () => (
    <HStack spacing={1} mt={4} justify="flex-end">
      <Button
        size="sm"
        variant="ghost"
        isDisabled={page === 1}
        onClick={() => setPage((p) => p - 1)}>
        Prev
      </Button>
      {Array.from({ length: totalPages }).map((_, i) => {
        const n = i + 1
        return (
          <Button
            key={n}
            size="sm"
            variant={n === page ? 'solid' : 'ghost'}
            onClick={() => setPage(n)}>
            {n}
          </Button>
        )
      })}
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
  )

  /* -------------------------------------------------------------------------- */

  return (
    <Box p={4}>
      <Loading loading={asyncManager.loading} />

      {/* Top Actions */}
      <Flex
        mb={12}
        justify="space-between"
        direction={{ base: 'column', md: 'row' }}
        gap={4}>
        <HStack>
          <Text width={175} fontWeight="bold">
            Created By
          </Text>
          <ChakraSelect
            placeholder="All"
            maxW="200px"
            onChange={(e) => {
              setCreatedBy(e.target.value || undefined)
              setPage(1)
            }}>
            {/* Replace with real user list */}
            {store?.state?.users?.map?.((u: any) => (
              <option key={u.uuid} value={u.uuid}>
                {u.first_name} {u.last_name}
              </option>
            ))}
          </ChakraSelect>
        </HStack>

        <Button
          leftIcon={<Icon as={castIcon(FiPlus)} boxSize={4} />}
          onClick={openDrawer}
          alignSelf={{ base: 'flex-start', md: 'auto' }}>
          Create Date
        </Button>
      </Flex>

      {/* Entries Table - Desktop View */}
      <Box display={{ base: 'none', md: 'block' }} overflowX="auto">
        <Table variant="simple" size="sm">
          <Thead>
            <Tr>
              <Th>Gregorian</Th>
              <Th>Hebrew</Th>
              <Th>Name</Th>
              <Th>Description</Th>
              <Th>Tags</Th>
              <Th>Creator</Th>
              <Th>Processed</Th>
              <Th isNumeric>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {store.state.entries.map((e) => (
              <Tr key={e.uuid} _hover={{ bg: 'brand.surface' }}>
                <Td>{e.hebrew_date.gregorian}</Td>
                <Td>{e.hebrew_date.hebrew}</Td>
                <Td>{e.name}</Td>
                <Td>{e.description}</Td>
                <Td>{e.tags}</Td>
                <Td>{e.created_by.first_name}</Td>
                <Td>{e.processed ? 'TRUE' : 'FALSE'}</Td>
                <Td isNumeric>
                  <HStack justify="flex-end">
                    <IconButton
                      icon={<Icon as={castIcon(FiEdit)} boxSize={4} />}
                      size="sm"
                      aria-label="edit"
                      variant="ghost"
                      onClick={() => {
                        setEditing(e)
                        openDrawer()
                      }}
                    />
                    <IconButton
                      icon={<Icon as={castIcon(FiTrash2)} boxSize={4} />}
                      size="sm"
                      aria-label="delete"
                      variant="ghost"
                      onClick={() => confirmDelete(e.uuid)}
                    />
                  </HStack>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>

      {/* Entries Table - Mobile View */}
      <VStack display={{ base: 'flex', md: 'none' }} spacing={4} mt={4}>
        {store.state.entries.map((e) => {
          const isExpanded = !!expandedItems[e.uuid]

          return (
            <Box
              key={e.uuid}
              w="full"
              borderWidth="1px"
              borderRadius="md"
              p={4}
              onClick={() => toggleExpanded(e.uuid)}
              cursor="pointer">
              <HStack justify="space-between" mb={2}>
                <Text fontWeight="bold">{e.hebrew_date.gregorian}</Text>
                <Text>{e.name}</Text>
              </HStack>
              <Collapse in={isExpanded} animateOpacity>
                <VStack spacing={2} align="start" mt={2} fontSize="sm">
                  <Text>
                    <b>Hebrew:</b> {e.hebrew_date.hebrew}
                  </Text>
                  <Text>
                    <b>Description:</b> {e.description}
                  </Text>
                  <Text>
                    <b>Tags:</b> {e.tags}
                  </Text>
                  <Text>
                    <b>Creator:</b> {e.created_by.first_name}
                  </Text>
                  <Text>
                    <b>Processed:</b> {e.processed ? 'TRUE' : 'FALSE'}
                  </Text>
                  <HStack pt={2} spacing={2} alignSelf="flex-end">
                    <IconButton
                      icon={<Icon as={castIcon(FiEdit)} boxSize={4} />}
                      size="sm"
                      aria-label="edit"
                      variant="ghost"
                      onClick={(e_) => {
                        e_.stopPropagation()
                        setEditing(e)
                        openDrawer()
                      }}
                    />
                    <IconButton
                      icon={<Icon as={castIcon(FiTrash2)} boxSize={4} />}
                      size="sm"
                      aria-label="delete"
                      variant="ghost"
                      onClick={(e_) => {
                        e_.stopPropagation()
                        confirmDelete(e.uuid)
                      }}
                    />
                  </HStack>
                </VStack>
              </Collapse>
            </Box>
          )
        })}
      </VStack>

      {/* Pagination */}
      {renderPagination()}

      {/* Drawer for Edit / Create */}
      <Drawer
        isOpen={isDrawerOpen}
        placement={drawerPlacement ?? 'bottom'}
        size="sm"
        onClose={() => {
          setEditing(null)
          setDrafts([])
          closeDrawer()
        }}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerHeader>
            {editing ? 'Edit Entry' : 'Create Entries'}
          </DrawerHeader>
          <DrawerBody>
            {editing && (
              <VStack spacing={4}>
                <Input
                  placeholder="Name"
                  value={editing.name}
                  onChange={(e) =>
                    setEditing({ ...editing, name: e.target.value })
                  }
                />
                <Input
                  placeholder="Description"
                  value={editing.description}
                  onChange={(e) =>
                    setEditing({ ...editing, description: e.target.value })
                  }
                />
                <Input
                  placeholder="Tags"
                  value={editing.tags}
                  onChange={(e) =>
                    setEditing({ ...editing, tags: e.target.value })
                  }
                />
              </VStack>
            )}

            {!editing && (
              <VStack spacing={6} align="stretch">
                {drafts.map((d, idx) => (
                  <Box key={d.id} p={4} borderWidth="1px" borderRadius="md">
                    <HStack mb={3} justify="space-between">
                      <Text fontWeight="bold">Entry {idx + 1}</Text>
                      <IconButton
                        size="sm"
                        icon={<Icon as={castIcon(FiTrash2)} boxSize={4} />}
                        aria-label="remove"
                        variant="ghost"
                        onClick={() => removeDraft(d.id)}
                      />
                    </HStack>

                    <Flex gap={3} wrap="wrap" mb={3}>
                      <Input
                        placeholder="Name"
                        flex="1"
                        value={d.name}
                        onChange={(e) =>
                          updateDraft(d.id, 'name', e.target.value)
                        }
                      />
                    </Flex>

                    <Flex gap={3} wrap="wrap" mb={3}>
                      <Input
                        placeholder="Description"
                        flex="2"
                        value={d.description}
                        onChange={(e) =>
                          updateDraft(d.id, 'description', e.target.value)
                        }
                      />
                    </Flex>

                    <Flex gap={3} wrap="wrap" mb={3}>
                      <Box flexBasis="calc(50% - 0.5rem)">
                        <ChakraSelect
                          value={d.type}
                          onChange={(e) =>
                            updateDraft(
                              d.id,
                              'type',
                              e.target.value as 'hebrew' | 'gregorian'
                            )
                          }>
                          <option value="gregorian">Gregorian</option>
                          <option value="hebrew">Hebrew</option>
                        </ChakraSelect>
                      </Box>
                      {d.type === 'gregorian' ? (
                        <Box flexBasis="calc(50% - 0.5rem)">
                          <ChakraSelect
                            value={d.era}
                            onChange={(e) =>
                              updateDraft(
                                d.id,
                                'era',
                                e.target.value as 'AD' | 'BC'
                              )
                            }>
                            <option value="AD">AD</option>
                            <option value="BC">BC</option>
                          </ChakraSelect>
                        </Box>
                      ) : null}
                    </Flex>

                    <Flex gap={3} wrap="wrap" mb={3}>
                      <Box flexBasis="calc(33% - 0.5rem)">
                        <Input
                          placeholder="YY"
                          value={d.yy}
                          onChange={(e) =>
                            updateDraft(d.id, 'yy', e.target.value)
                          }
                        />
                      </Box>
                      <Box flexBasis="calc(33% - 0.5rem)">
                        <Input
                          placeholder="MM"
                          value={d.mm}
                          onChange={(e) =>
                            updateDraft(d.id, 'mm', e.target.value)
                          }
                        />
                      </Box>
                      <Box flexBasis="calc(33% - 0.5rem)">
                        <Input
                          placeholder="DD"
                          value={d.dd}
                          onChange={(e) =>
                            updateDraft(d.id, 'dd', e.target.value)
                          }
                        />
                      </Box>
                    </Flex>

                    <Flex gap={3} wrap="wrap" mb={3}>
                      <Input
                        placeholder="Tags"
                        flex="1"
                        value={d.tags}
                        onChange={(e) =>
                          updateDraft(d.id, 'tags', e.target.value)
                        }
                      />
                    </Flex>
                  </Box>
                ))}
                <Button
                  variant="outline"
                  leftIcon={<Icon as={castIcon(FiPlus)} boxSize={4} />}
                  onClick={addDraft}>
                  Add another
                </Button>
              </VStack>
            )}
          </DrawerBody>
          <DrawerFooter>
            <HStack w="full" justify="space-between">
              <Button variant="ghost" onClick={closeDrawer}>
                Cancel
              </Button>
              {editing ? (
                <Button
                  leftIcon={<Icon as={castIcon(FiSave)} boxSize={4} />}
                  onClick={handleUpdate}>
                  Save Changes
                </Button>
              ) : (
                <Button
                  leftIcon={<Icon as={castIcon(FiSave)} boxSize={4} />}
                  isDisabled={!drafts.length}
                  onClick={saveDrafts}>
                  Save Entries
                </Button>
              )}
            </HStack>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
      <AlertDialog
        isOpen={isAlertOpen}
        leastDestructiveRef={cancelRef}
        onClose={closeAlert}>
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Confirm Deletion
            </AlertDialogHeader>
            <AlertDialogBody>
              Are you sure? This action cannot be undone.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={closeAlert}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={onDeleteConfirmed} ml={3}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  )
}
