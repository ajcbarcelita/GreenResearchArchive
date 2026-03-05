import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

const api = axios.create({
  baseURL: API_BASE_URL,
})

export const listRepository = async (params = {}) => {
  const response = await api.get('/api/repository', { params })
  return response.data?.data || []
}

export const getCapstoneDetails = async (id) => {
  const response = await api.get(`/api/repository/${id}`)
  return response.data?.data || null
}

export default {
  listRepository,
  getCapstoneDetails,
}
