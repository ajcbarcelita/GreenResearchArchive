import { verifyAccessToken } from '../services/tokenService.js'

const extractBearerToken = (authorizationHeader = '') => {
  const [scheme, token] = authorizationHeader.split(' ')
  if (!scheme || !token) return null
  if (scheme.toLowerCase() !== 'bearer') return null
  return token.trim()
}

export const requireAuth = (req, res, next) => {
  try {
    const rawAuthHeader = req.headers.authorization || ''
    const token = extractBearerToken(rawAuthHeader)

    if (!token) {
      return res.status(401).json({
        message: 'Missing or invalid Authorization header. Use Bearer <token>.',
      })
    }

    const claims = verifyAccessToken(token)
    req.auth = claims
    return next()
  } catch (error) {
    return res.status(401).json({
      message: 'Invalid or expired access token.',
    })
  }
}
