import React, { useState } from 'react'
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Input,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Select
} from '@chakra-ui/react'

import { isHebrewLeapYear } from '@ui/utils/date'
import { AdminEvent, NewEvent } from '@ui/api/admin'
import { DatePrefill } from '@ui/utils/prefill'

const today = () => new Date().toISOString().split('T')[0].split('-')

// an existing event opens the form in Gregorian with its own values
const fromEvent = (e: AdminEvent): DatePrefill => ({
  type: 'gregorian',
  date: String(e.gregorian).replace(/\s*BC$/, ''),
  era: String(e.gregorian).includes('BC') ? 'bc' : 'ad'
})

export const EventForm = ({
  onSubmit,
  initial,
  editing,
  onCancel
}: {
  onSubmit: (event: NewEvent) => void
  initial?: DatePrefill | null
  editing?: AdminEvent | null
  onCancel?: () => void
}) => {
  const seed = editing ? fromEvent(editing) : initial
  const [y, m, d] = seed ? seed.date.split('-') : today()
  const [name, setName] = useState(editing?.name || '')
  const [description, setDescription] = useState(editing?.description || '')
  const [type, setType] = useState<'gregorian' | 'hebrew'>(seed?.type || 'gregorian')
  const [era, setEra] = useState<'ad' | 'bc'>(seed?.era || 'ad')
  const [year, setYear] = useState(y)
  const [month, setMonth] = useState(String(Number(m)))
  const [day, setDay] = useState(String(Number(d)))

  const numberInput = (label: string, value: string, set: (v: string) => void, min: number, max: number, w: string, wBase: string) => (
    <FormControl w={{ base: wBase, md: w }} flex="none">
      <FormLabel fontSize="11" pl="2">
        {label}
      </FormLabel>
      <NumberInput bg="brand.surfaceRaised" size="sm" min={min} max={max} value={value} onChange={set} precision={0}>
        <NumberInputField px={2} />
        <NumberInputStepper>
          <NumberIncrementStepper />
          <NumberDecrementStepper />
        </NumberInputStepper>
      </NumberInput>
    </FormControl>
  )

  // queue it and clear the text fields at once; the date stays for the next entry
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    const date = `${year}-${String(Number(month)).padStart(2, '0')}-${String(Number(day)).padStart(2, '0')}`
    onSubmit({ name: name.trim(), description, type, date, era })
    if (!editing) {
      setName('')
      setDescription('')
    }
  }

  return (
    <Box as="form" onSubmit={submit}>
      <Flex direction={{ base: 'column', md: 'row' }} gap={4} mb={4}>
        <FormControl>
          <FormLabel fontSize="11" pl="2">
            NAME
          </FormLabel>
          <Input size="sm" bg="brand.surfaceRaised" value={name} onChange={(e) => setName(e.target.value)} isRequired />
        </FormControl>
        <FormControl>
          <FormLabel fontSize="11" pl="2">
            DESCRIPTION
          </FormLabel>
          <Input size="sm" bg="brand.surfaceRaised" value={description} onChange={(e) => setDescription(e.target.value)} />
        </FormControl>
      </Flex>
      <Flex direction="row" gap={{ base: 2, md: 4 }} align="flex-end" wrap="wrap">
        <FormControl w={{ base: '128px', md: '140px' }} flex="none">
          <FormLabel fontSize="11" pl="2">
            CALENDAR
          </FormLabel>
          <Select size="sm" bg="brand.surfaceRaised" value={type} onChange={(e) => setType(e.target.value as any)}>
            <option value="gregorian">Gregorian</option>
            <option value="hebrew">Hebrew</option>
          </Select>
        </FormControl>
        {type === 'gregorian' ? (
          <FormControl w={{ base: '68px', md: '84px' }} flex="none">
            <FormLabel fontSize="11" pl="2">
              ERA
            </FormLabel>
            <Select size="sm" bg="brand.surfaceRaised" sx={{ '& > select': { paddingInlineEnd: '1.4rem', paddingInlineStart: '0.5rem' } }} value={era} onChange={(e) => setEra(e.target.value as any)}>
              <option value="ad">AD</option>
              <option value="bc">BC</option>
            </Select>
          </FormControl>
        ) : null}
        {numberInput('YEAR', year, setYear, 1, type === 'gregorian' ? (era === 'ad' ? 4200 : 4004) : 8203, '120px', '92px')}
        {numberInput('MONTH', month, setMonth, 1, type === 'hebrew' && isHebrewLeapYear(year) ? 13 : 12, '90px', '66px')}
        {numberInput('DAY', day, setDay, 1, type === 'hebrew' ? 30 : 31, '90px', '66px')}
        <Button
          type="submit"
          size="sm"
          bg="brand.primary"
          color="brand.onPrimary"
          fontWeight="500"
          borderRadius="md"
          px={6}
          w={{ base: '100%', md: 'auto' }}
          mt={{ base: 2, md: 0 }}
          sx={{ ':hover': { bg: 'brand.primaryLight' } }}>
          {editing ? 'Save changes' : 'Add event'}
        </Button>
        {editing && onCancel ? (
          <Button size="sm" variant="ghost" color="brand.textSecondary" onClick={onCancel} mt={{ base: 2, md: 0 }}>
            Cancel
          </Button>
        ) : null}
      </Flex>
    </Box>
  )
}
