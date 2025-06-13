const getEnv = (app, local) => {
  const key = `GLOBAL_${app}`
  return window[key] ? window[key] : local
}

export const env = {
  apiUrl: () =>
    getEnv(
      `UI_API_URL`,
      // @ts-expect-error:next-line
      typeof envApiUrl == 'string'
        ? // @ts-expect-error:next-line
          envApiUrl
        : 'https://api.hebrewfeasts.com'
      // TODO: revert
      // : 'http://localhost:5000'
    )
}
