import React, { useEffect, useState, useCallback } from 'react'
import { Box } from '@chakra-ui/react'
import { useStore, useAsyncManager } from '@ui/hooks'
import { InitialState } from './types'
import { getDates } from '../methods/getDates' 

const initialState: InitialState = { dates: [] }

const defaultApiControls = {
  start: '2024-04-01',
  end: '2024-04-10',
  type: 'gregorian',
  with_events: true,
}

export const Home = () => {
  const store = useStore(initialState)
  const asyncManager = useAsyncManager()
  const [apiControls, setApiControls] = useState(defaultApiControls)
  const [debouncedApiControls, setDebouncedApiControls] = useState(apiControls);

  const parseQueryParams = () => {
    const searchParams = new URLSearchParams(window.location.search);
    return {
      start: searchParams.get('start') || defaultApiControls.start,
      end: searchParams.get('end') || defaultApiControls.end,
      type: searchParams.get('type') || defaultApiControls.type,
      with_events: searchParams.get('with_events') === 'false' ? false : defaultApiControls.with_events,
    }
  }

  useEffect(() => {
    const updateApiControls = () => {
      const params = parseQueryParams();
      setApiControls(params);
    };

    updateApiControls();

    window.addEventListener('popstate', updateApiControls);

    return () => {
      window.removeEventListener('popstate', updateApiControls);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedApiControls(apiControls);
    }, 500); // Debounce time 500 milliseconds

    return () => clearTimeout(timer);
  }, [apiControls]);

  useEffect(() => {
    getDates({ asyncManager, store, payload: debouncedApiControls });
  }, [debouncedApiControls]);

  const formatDate = (year, month, day) => `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

  const handleDateChange = (field, part, value) => {
    const dateParts = apiControls[field].split('-');
    if (part === 'year') {
      dateParts[0] = value;
    } else if (part === 'month') {
      dateParts[1] = value.padStart(2, '0');
    } else if (part === 'day') {
      dateParts[2] = value.padStart(2, '0');
    }
    setApiControls(prev => ({
      ...prev,
      [field]: dateParts.join('-'),
    }));
  };


  return (
    <Box w="100vw" minH="100vh" p={0} m={0} bg="#1A202C" color="white">
      <div>Enter Start Date:</div>
      <input
        type="number"
        placeholder="Year"
        style={{ color: 'black' }}
        value={apiControls.start.split('-')[0]}
        onChange={e => handleDateChange('start', 'year', e.target.value)}
      />
      <input
        type="number"
        placeholder="Month"
        style={{ color: 'black' }}
        value={apiControls.start.split('-')[1]}
        onChange={e => handleDateChange('start', 'month', e.target.value)}
      />
      <input
        type="number"
        placeholder="Day"
        style={{ color: 'black' }}
        value={apiControls.start.split('-')[2]}
        onChange={e => handleDateChange('start', 'day', e.target.value)}
      />

      <div>Enter End Date:</div>
      <input
        type="number"
        placeholder="Year"
        style={{ color: 'black' }}
        value={apiControls.end.split('-')[0]}
        onChange={e => handleDateChange('end', 'year', e.target.value)}
      />
      <input
        type="number"
        placeholder="Month"
        style={{ color: 'black' }}
        value={apiControls.end.split('-')[1]}
        onChange={e => handleDateChange('end', 'month', e.target.value)}
      />
      <input
        type="number"
        placeholder="Day"
        style={{ color: 'black' }}
        value={apiControls.end.split('-')[2]}
        onChange={e => handleDateChange('end', 'day', e.target.value)}
      />

      <br/>
      <br/>

      {store.state.dates.map(({ gregorian, yy, mm, dd, events }, i) => {
        return (
          <div key={i}>
            <span>Gregorian: {gregorian} - Hebrew {yy}-{mm}-{dd} ( {events.map(({ event }, k) => {
              return (
                <span key={k}>{event.name} </span>
              )
            })})</span>
            <br />
          </div>
        )
      })}
    </Box>
  )
}
