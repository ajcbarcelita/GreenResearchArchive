import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'
const ACCESS_TOKEN_KEY = 'gra_access_token'
const USER_KEY = 'gra_user'

const api = axios.create({
  baseURL: API_BASE_URL,
})

const getStoredAccessToken = () => localStorage.getItem(ACCESS_TOKEN_KEY)

const setAccessToken = (token) => {
  if (!token) return
  localStorage.setItem(ACCESS_TOKEN_KEY, token)
  api.defaults.headers.common.Authorization = `Bearer ${token}`
}

export const clearSession = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  delete api.defaults.headers.common.Authorization
}

const bootstrapAuthHeader = () => {
  const token = getStoredAccessToken()
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`
  }
}

bootstrapAuthHeader()

export const getStoredUser = () => {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null

  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export const authenticateWithGoogle = async (idToken) => {
  console.log('[authService] authenticateWithGoogle called')
  console.log('[authService] API_BASE_URL:', API_BASE_URL)
  console.log('[authService] idToken:', idToken ? `${idToken.substring(0, 50)}...` : 'EMPTY')

  const response = await api.post('/api/auth/google', {
    idToken,
  })

  const { accessToken, user } = response.data || {}
  if (accessToken) {
    setAccessToken(accessToken)
  }

  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  }

  console.log('[authService] Response:', response.data)
  return response.data
}

export const getMyProfile = async () => {
  const response = await api.get('/api/auth/me')
  return response.data
}

