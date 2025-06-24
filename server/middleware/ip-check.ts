import { getRequestIP } from 'h3'

export default defineEventHandler((event) => {
  const { allowedIps } = useRuntimeConfig(event)

  // Bypass check in development
  if (process.env.NODE_ENV === 'development') {
    return
  }

  const requestIp = getRequestIP(event)

  if (!requestIp || !Array.from(allowedIps).includes(requestIp)) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden',
    })
  }
}) 