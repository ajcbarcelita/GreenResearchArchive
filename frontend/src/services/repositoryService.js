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

export const listCapstoneFiles = async (id) => {
  const response = await api.get(`/api/repository/${id}/files`)
  return response.data?.data || []
}

export const getCapstoneFileDownloadUrl = (fileId) => {
  return `${API_BASE_URL}/api/repository/files/${fileId}/download`
}

export const toggleSubmissionArchiveStatus = async (id) => {
  const response = await api.patch(`/api/repository/${id}/archive-toggle`)
  return response.data?.data || null
}

export default {
  listRepository,
  getCapstoneDetails,
  listCapstoneFiles,
  getCapstoneFileDownloadUrl,
  toggleSubmissionArchiveStatus,
}
