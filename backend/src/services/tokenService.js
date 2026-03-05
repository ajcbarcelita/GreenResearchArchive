import jwt from 'jsonwebtoken'

const getJwtConfig = () => {
  const secret = process.env.JWT_ACCESS_SECRET
  const expiresIn = process.env.JWT_ACCESS_EXPIRES_IN || '15m'

  if (!secret) {
    const error = new Error('JWT_ACCESS_SECRET is not configured')
    error.statusCode = 500
    throw error
  }

  return { secret, expiresIn }
}

export const signAccessToken = (user) => {
  const { secret, expiresIn } = getJwtConfig()

  const payload = {
    sub: String(user.user_id),
    email: user.email,
    roleId: user.role_id,
    roleName: user.role_name,
  }

  return jwt.sign(payload, secret, { expiresIn })
}

export const verifyAccessToken = (token) => {
  const { secret } = getJwtConfig()
  return jwt.verify(token, secret)
}
