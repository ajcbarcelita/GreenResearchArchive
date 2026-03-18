import api from './api'

export const listRepository = async (params = {}) => {
  const { data } = await api.get('/api/repository', { params })
  // Accessing .data twice because your old code used response.data.data
  return data?.data || []
}

export const getCapstoneDetails = async (id) => {
  const { data } = await api.get(`/api/repository/${id}`)
  return data?.data || null
}

export default {
  listRepository,
  getCapstoneDetails,
}