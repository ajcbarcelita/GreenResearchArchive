import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'
const ACCESS_TOKEN_KEY = 'gra_access_token'

const api = axios.create({
  baseURL: API_BASE_URL,
})

const getAuthConfig = () => {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY)
  if (!token) return {}

  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
}

export const listUsersAdmin = async (params = {}) => {
  const response = await api.get('/api/admin/users', {
    ...getAuthConfig(),
    params,
  })

  return {
    users: response?.data?.users || [],
    filters: response?.data?.filters || { roles: [], programs: [] },
  }
}

export const getUsersAdminMeta = async () => {
  const response = await api.get('/api/admin/users/meta', getAuthConfig())

  return {
    roles: response?.data?.roles || [],
    programs: response?.data?.programs || [],
    studentRoleId: response?.data?.studentRoleId || null,
  }
}

export const updateUserAdmin = async (userId, payload) => {
  const response = await api.patch(`/api/admin/users/${userId}`, payload, getAuthConfig())
  return response?.data?.user || null
}

export default {
  listUsersAdmin,
  getUsersAdminMeta,
  updateUserAdmin,
}
