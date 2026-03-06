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

export const listProgramsAdmin = async (params = {}) => {
  const response = await api.get('/api/admin/programs', {
    ...getAuthConfig(),
    params,
  })

  return response?.data?.programs || []
}

export const createProgramAdmin = async (payload) => {
  const response = await api.post('/api/admin/programs', payload, getAuthConfig())
  return response?.data?.program || null
}

export const updateProgramAdmin = async (programId, payload) => {
  const response = await api.patch(`/api/admin/programs/${programId}`, payload, getAuthConfig())
  return response?.data?.program || null
}

export const deleteProgramAdmin = async (programId) => {
  const response = await api.delete(`/api/admin/programs/${programId}`, getAuthConfig())
  return response?.data || {}
}

export default {
  listProgramsAdmin,
  createProgramAdmin,
  updateProgramAdmin,
  deleteProgramAdmin,
}
