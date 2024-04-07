import React, { useEffect } from 'react'
import {
  Box,
  Container,
  VStack,
  Text,
  NumberInput,
  NumberInputField,
  Input,
  FormLabel,
  FormControl,
  Switch,
  Button,
  Select,
  SimpleGrid
} from '@chakra-ui/react'

const format = (value) => `$` + new Intl.NumberFormat().format(value)

export const Form = ({ store }) => {
  const onSubmit = () => {
    store.update({
      ...store.state,
      chat: [],
      question: '',
      formDisplay: false
    })
  }

  const setState = (property, value) => {
    store.update({
      ...store.state,
      form: {
        ...store.state.form,
        [property]: value
      }
    })
  }

  const setInputState = (property, type) => (e) => {
    const value = type === 'boolean' ? e.target.checked : e.target.value
    setState(property, value)
  }

  const setNumberState = (property) => (value) => {
    setState(property, value)
  }

  const onChange = (property, type) => setInputState(property, type)
  const onNumberChange = (property) => setNumberState(property)

  const {
    age,
    riskTolerance,
    debtOverFivePercent,
    income,
    debt,
    assets,
    disposableMonthlyIncome,
    hasRetirement,
    hasTraditionalIra,
    hasRothIra,
    hasGeneral,
    retirement,
    traditionalIra,
    rothIra,
    general
  } = store.state.form

  const setIsValid = (value) => {
    store.update({
      ...store.state,
      formValid: value
    })
  }

  const validateForm = () => {
    if (age === 0) return setIsValid(false)
    if (riskTolerance === '') return setIsValid(false)
    if (income === 0) return setIsValid(false)
    if (disposableMonthlyIncome === 0) return setIsValid(false)

    if (hasRetirement && retirement === 0) return setIsValid(false)
    if (hasTraditionalIra && traditionalIra === 0) return setIsValid(false)
    if (hasRothIra && rothIra === 0) return setIsValid(false)
    if (hasGeneral && general === 0) return setIsValid(false)

    setIsValid(true)
  }

  useEffect(() => {
    validateForm()
  }, [store.state.form])

  return (
    <Container centerContent maxW="container.xl" mb="20">
      <VStack spacing={6} align="stretch">
        <Text fontWeight="bold" size={12} color={'blue.500'}>
          Introduction
        </Text>
        <Text size={12} color={'white'}>
          Welcome to the alooola prototype RoboAdvisor. If this were in app, the
          AI would have access to any details about the user in the app. For the
          purposes of this prototype, let&apos;s collect some example
          information about our user.
        </Text>
        <Box>
          <Text fontWeight="bold" size={12} color={'blue.500'} mb="4">
            General Info
          </Text>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <FormControl id="age">
              <FormLabel>Age*</FormLabel>
              <Input
                isRequired
                type="number"
                value={age}
                onChange={onChange('age')}
              />
            </FormControl>

            <FormControl id="riskTolerance">
              <FormLabel>Risk Tolerance*</FormLabel>
              <Select
                isRequired
                value={riskTolerance}
                onChange={onChange('riskTolerance')}>
                <option value=""></option>
                <option value="conservative">Conservative</option>
                <option value="income">Income</option>
                <option value="moderate">Moderate</option>
                <option value="growth">Growth</option>
                <option value="aggressive">Aggressive</option>
              </Select>
            </FormControl>

            <FormControl id="income">
              <FormLabel>Annual Income*</FormLabel>
              <NumberInput
                isRequired
                value={format(income)}
                onChange={onNumberChange('income')}
                inputMode={'numeric'}
                allowMouseWheel={false}>
                <NumberInputField />
              </NumberInput>
            </FormControl>

            <FormControl id="disposableMonthlyIncome">
              <FormLabel>Disposable Monthly Income*</FormLabel>
              <NumberInput
                isRequired
                value={format(disposableMonthlyIncome)}
                onChange={onNumberChange('disposableMonthlyIncome')}
                inputMode={'numeric'}
                allowMouseWheel={false}>
                <NumberInputField />
              </NumberInput>
            </FormControl>

            <FormControl id="assets">
              <FormLabel>Total Assets</FormLabel>
              <NumberInput
                value={format(assets)}
                onChange={onNumberChange('assets')}
                inputMode={'numeric'}
                allowMouseWheel={false}>
                <NumberInputField />
              </NumberInput>
            </FormControl>

            <FormControl id="debt">
              <FormLabel>Total Debt</FormLabel>
              <NumberInput
                value={format(debt)}
                onChange={onNumberChange('debt')}
                inputMode={'numeric'}
                allowMouseWheel={false}>
                <NumberInputField />
              </NumberInput>
            </FormControl>

            <FormControl
              id="debtOverFivePercent"
              display="flex"
              alignItems="center">
              <FormLabel mb="0">Debt with interest higher than 5%?</FormLabel>
              <Switch
                isChecked={debtOverFivePercent}
                onChange={onChange('debtOverFivePercent', 'boolean')}
              />
            </FormControl>
          </SimpleGrid>
        </Box>

        <Box>
          <Text fontWeight="bold" size={12} color={'blue.500'} mb="4">
            Investment Accounts
          </Text>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <FormControl id="hasRetirement" display="flex" alignItems="center">
              <Switch
                mr="4"
                isChecked={hasRetirement}
                onChange={onChange('hasRetirement', 'boolean')}
              />
              <FormLabel mb="0">
                {!hasRetirement ? '401k?' : '401k: How much invested?'}
              </FormLabel>
            </FormControl>
            {hasRetirement ? (
              <FormControl id="retirement">
                <NumberInput
                  isRequired={!!hasRetirement}
                  value={format(retirement)}
                  onChange={onNumberChange('retirement')}
                  inputMode={'numeric'}
                  allowMouseWheel={false}>
                  <NumberInputField />
                </NumberInput>
              </FormControl>
            ) : (
              <Text></Text>
            )}

            <FormControl
              id="hasTraditionalIra"
              display="flex"
              alignItems="center">
              <Switch
                mr="4"
                isChecked={hasTraditionalIra}
                onChange={onChange('hasTraditionalIra', 'boolean')}
              />
              <FormLabel mb="0">
                {!hasTraditionalIra
                  ? 'Traditional IRA?'
                  : 'Traditional IRA: How much invested?'}
              </FormLabel>
            </FormControl>
            {hasTraditionalIra ? (
              <FormControl id="traditionalIra">
                <NumberInput
                  isRequired={!!hasTraditionalIra}
                  value={format(traditionalIra)}
                  onChange={onNumberChange('traditionalIra')}
                  inputMode={'numeric'}
                  allowMouseWheel={false}>
                  <NumberInputField />
                </NumberInput>
              </FormControl>
            ) : (
              <Text></Text>
            )}

            <FormControl id="hasRothIra" display="flex" alignItems="center">
              <Switch
                mr="4"
                isChecked={hasRothIra}
                onChange={onChange('hasRothIra', 'boolean')}
              />
              <FormLabel mb="0">
                {!hasRothIra ? 'Roth IRA?' : 'Roth IRA: How much invested?'}
              </FormLabel>
            </FormControl>
            {hasRothIra ? (
              <FormControl id="rothIra">
                <NumberInput
                  isRequired={!!hasRothIra}
                  value={format(rothIra)}
                  onChange={onNumberChange('rothIra')}
                  inputMode={'numeric'}
                  allowMouseWheel={false}>
                  <NumberInputField />
                </NumberInput>
              </FormControl>
            ) : (
              <Text></Text>
            )}

            <FormControl id="hasGeneral" display="flex" alignItems="center">
              <Switch
                mr="4"
                isChecked={hasGeneral}
                onChange={onChange('hasGeneral', 'boolean')}
              />
              <FormLabel mb="0">
                {!hasGeneral
                  ? 'General investment?'
                  : 'General Investments: How much invested?'}
              </FormLabel>
            </FormControl>
            {hasGeneral ? (
              <FormControl id="general">
                <NumberInput
                  isRequired={!!hasGeneral}
                  value={format(general)}
                  onChange={onNumberChange('general')}
                  inputMode={'numeric'}
                  allowMouseWheel={false}>
                  <NumberInputField />
                </NumberInput>
              </FormControl>
            ) : (
              <Text></Text>
            )}
          </SimpleGrid>
        </Box>

        <Button
          isDisabled={!store.state.formValid}
          background="blue.500"
          color="white"
          onClick={onSubmit}
          mt="4"
          _hover={{ bg: 'green.500' }}>
          Get Started
        </Button>
      </VStack>
    </Container>
  )
}
