import React from 'react';
import { Flex, Box, Heading, Button, NumberInput, NumberInputField, NumberInputStepper, NumberIncrementStepper, NumberDecrementStepper } from '@chakra-ui/react';

export const DateControls = ({ apiControls, setApiControls, onSubmit }) => {
  const handleDateChange = (field, part, value) => {
    const dateParts = apiControls[field].split('-');
    if (part === 'year') {
      dateParts[0] = value;
    } else if (part === 'month') {
      dateParts[1] = value.padStart(2, '0');
    }
    setApiControls(prev => ({
      ...prev,
      [field]: dateParts.join('-')
    }));
  };

  return (
      <Flex>
        <NumberInput bg="white" size="sm" max={2075} min={1} onChange={(valueString) => handleDateChange('start', 'year', valueString)} value={apiControls.start.split('-')[0]} mr={2}>
          <NumberInputField />
          <NumberInputStepper>
            <NumberIncrementStepper
              sx={{
              '& > svg': { // Targeting the SVG element directly
                width: '8px', // Adjust the width as needed
                height: '8px' // Adjust the height as needed
              }
            }} />
            <NumberDecrementStepper
              sx={{
              '& > svg': { // Targeting the SVG element directly
                width: '8px', // Adjust the width as needed
                height: '8px' // Adjust the height as needed
              }
            }} />
          </NumberInputStepper>
        </NumberInput>
        <NumberInput bg="white" size="sm" max={12} min={1} onChange={(valueString) => handleDateChange('start', 'month', valueString.padStart(2, '0'))} value={parseInt(apiControls.start.split('-')[1], 10)} precision={0}>
          <NumberInputField />
          <NumberInputStepper>
            <NumberIncrementStepper
              sx={{
              '& > svg': { // Targeting the SVG element directly
                width: '8px', // Adjust the width as needed
                height: '8px' // Adjust the height as needed
              }
            }} />
            <NumberDecrementStepper
              sx={{
              '& > svg': { // Targeting the SVG element directly
                width: '8px', // Adjust the width as needed
                height: '8px' // Adjust the height as needed
              }
            }} />
          </NumberInputStepper>
        </NumberInput>
        <Button size="sm" onClick={onSubmit} bg="blue.700" color="white" ml={2}>Calculate</Button>
      </Flex>
  );
};
