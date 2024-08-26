const axios = require('axios');

function padDate(dateString) {
  let parts = dateString.split('-');

  if (parts.length !== 3) {
    throw new Error('Invalid date format. Expected yyyy-mm-dd.');
  }

  let year = parts[0].padStart(4, '0'); // Ensure year is 4 digits
  let month = parts[1].padStart(2, '0'); // Ensure month is 2 digits
  let day = parts[2].padStart(2, '0'); // Ensure day is 2 digits

  return `${year}-${month}-${day}`;
}

// Start and end limited to one month
async function getAstronomyEvents(startDate, endDate) {
  const accessKey = '8fUbbY0pTy';
  const secretKey = 'eVNQ7qCvbF0rQZAj1rqE';
  const placeId = 'israel/jerusalem';
  const version = '3';
  const object = 'sun,moon'
  const types = 'all'; 

  // TODO: currently types is breaking due to `all` or `setrise` prior to AD 1550.
  // Valid types include phase,twilight,meridian

  const start = padDate(startDate)
  const end = padDate(endDate)

  const url = `https://api.xmltime.com/astronomy?accesskey=${accessKey}&secretkey=${secretKey}&version=${version}&prettyprint=1&out=js&object=${object}&placeid=${placeId}&startdt=${start}&enddt=${end}&types=${types}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    // Extracting the relevant phase events
    const { objects } = data.locations[0].astronomy
    const sun = objects.find(({ name }) => name === 'sun')
    const moon = objects.find(({ name }) => name === 'moon')

    const sun_events = []
    const moon_events = []

    const sun_types = ['antimeridian', 'twi18_start', 'twi12_start', 'twi6_start', 'rise', 'meridian', 'set', 'twi6_end', 'twi12_end', 'twi18_end']
    const moon_types = ['rise', 'meridian', 'set', 'newmoon', 'firstquarter', 'fullmoon', 'thirdquarter']

    sun.days.forEach(({ date, events }) => events
      .filter(({ type }) => sun_types.includes(type))
      .forEach(({ type, hour, min, sec, azimuth, altitude, distance }) => {
        sun_events.push({
          gregorian: date,
          type,
          hour,
          min,
          sec,
          azimuth,
          altitude,
          distance,
        })
      }))

    moon.days.forEach(({ date, events }) => events
      .filter(({ type }) => moon_types.includes(type))
      .forEach(({ type, hour, min, sec, azimuth, altitude, distance, illuminated, posangle }) => {
        moon_events.push({
          gregorian: date,
          type,
          hour,
          min,
          sec,
          azimuth,
          altitude,
          distance,
          illuminated,
          posangle,
        })
      }))

    return { sun_events, moon_events };
  } catch (error) {
    console.error('Error fetching astronomical events:', error);
    return [];
  }
}

module.exports = {
  getAstronomyEvents
}
