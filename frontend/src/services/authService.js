import api from './api.js'

const ACCESS_TOKEN_KEY = 'gra_access_token'
const USER_KEY = 'gra_user'

// --- access token helpers ---
const getStoredAccessToken = () => localStorage.getItem(ACCESS_TOKEN_KEY)
export const hasAccessToken = () => Boolean(getStoredAccessToken())
export const needsProfileCompletion = (user) => !user?.lastLogin

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

// bootstrap header if token in storage
const bootstrapAuthHeader = () => {
  const token = getStoredAccessToken()
  if (token) api.defaults.headers.common.Authorization = `Bearer ${token}`
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

// --- automatic refresh on 401 ---
api.interceptors.response.use(
  (resp) => resp,
  async (error) => {
    const originalRequest = error.config
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      try {
        // refresh endpoint uses cookie -- no body required
        const refreshResp = await api.post('/api/auth/refresh')
        const newAccessToken = refreshResp?.data?.accessToken
        if (newAccessToken) {
          setAccessToken(newAccessToken)
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
          return api(originalRequest)
        }
      } catch (e) {
        // refresh failed -> clear client state
        clearSession()
        throw error
      }
    }
    throw error
  },
)

// --- auth actions ---
export const authenticateWithGoogle = async (idToken) => {
  const response = await api.post('/api/auth/google', { idToken })
  const { accessToken, user } = response.data || {}
  if (accessToken) setAccessToken(accessToken)
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user))
  return response.data
}

export const getMyProfile = async () => {
  const response = await api.get('/api/auth/me')
  return response.data
}

export const getDegreePrograms = async () => {
  const response = await api.get('/api/auth/programs')
  return response.data
}

export const completeProfile = async (payload) => {
  const response = await api.post('/api/auth/complete-profile', payload)
  const accessToken = response?.data?.accessToken
  const user = response?.data?.user
  if (accessToken) setAccessToken(accessToken)
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user))
  return response.data
}

export const logout = async () => {
  try {
    await api.post('/api/auth/logout')
  } catch {
    // ignore
  } finally {
    clearSession()
  }
}

export { api }
export default api
