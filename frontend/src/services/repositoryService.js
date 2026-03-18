import axios from 'axios'
import { api as authApi } from './authService'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

const api = axios.create({
  baseURL: API_BASE_URL,
})

export const listRepository = async (params = {}) => {
  const { data } = await api.get('/api/repository', { params })
  // Accessing .data twice because your old code used response.data.data
  return data?.data || []
}

export const getCapstoneDetails = async (id) => {
  const { data } = await api.get(`/api/repository/${id}`)
  return data?.data || null
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

export const submitCapstoneComment = async (id, remarks) => {
  const response = await authApi.post(`/api/repository/${id}/comments`, { remarks })
  return response.data?.data || null
}

export const listCapstoneComments = async (id) => {
  const response = await authApi.get(`/api/repository/${id}/comments`)
  return response.data?.data || []
}

export default {
  listRepository,
  getCapstoneDetails,
  listCapstoneFiles,
  getCapstoneFileDownloadUrl,
  toggleSubmissionArchiveStatus,
  submitCapstoneComment,
  listCapstoneComments,
}
