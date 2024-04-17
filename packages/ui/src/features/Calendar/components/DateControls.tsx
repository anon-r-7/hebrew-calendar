import React from 'react'

export const DateControls = ({ apiControls, setApiControls, onSubmit }) => {
  const handleDateChange = (field, part, value) => {
    const dateParts = apiControls[field].split('-')
    if (part === 'year') {
      dateParts[0] = value
    } else if (part === 'month') {
      dateParts[1] = value.padStart(2, '0')
    }
    setApiControls((prev) => ({
      ...prev,
      [field]: dateParts.join('-')
    }))
  }

  return (
    <>
      <div>Enter Start Date:</div>
      <input
        type="number"
        placeholder="Year"
        style={{ color: 'black' }}
        value={apiControls.start.split('-')[0]}
        onChange={(e) => handleDateChange('start', 'year', e.target.value)}
      />
      <input
        type="number"
        placeholder="Month"
        style={{ color: 'black' }}
        value={apiControls.start.split('-')[1]}
        onChange={(e) => handleDateChange('start', 'month', e.target.value)}
      />
      <button onClick={onSubmit}>Calculate</button>
    </>
  )
}
