import api from './api.js'

export const getLiveSubmissions = async (filters = {}) => {
  const response = await api.get('/api/coordinator/submissions/live', { params: filters })
  return response?.data?.data || []
}

export const getPendingValidations = async () => {
  const response = await api.get('/api/coordinator/submissions/pending-validation')
  return response?.data?.data || []
}

export const updateSubmissionStatus = async (submissionId, status, remarks = '') => {
  const response = await api.put(`/api/coordinator/submissions/${submissionId}/status`, {
    status,
    remarks,
  })
  return response?.data?.data || null
}

export const getAnalyticsData = async () => {
  const response = await api.get('/api/coordinator/analytics/overview')
  return response?.data?.data || {}
}

export const getKeywordPopularity = async () => {
  const response = await api.get('/api/coordinator/analytics/keywords')
  return response?.data?.data || []
}

export const getResearchTrends = async () => {
  const response = await api.get('/api/coordinator/analytics/trends')
  return response?.data?.data || []
}

export const getAdviserWorkload = async () => {
  const response = await api.get('/api/coordinator/analytics/advisers')
  return response?.data?.data || []
}

export const getRepositoryHealth = async () => {
  const response = await api.get('/api/coordinator/analytics/health')
  return response?.data?.data || {}
}

export const getPerformanceIndicators = async () => {
  const response = await api.get('/api/coordinator/analytics/performance')
  return response?.data?.data || []
}

export const lockSubmission = async (submissionId, locked) => {
  const response = await api.put(`/api/coordinator/submissions/${submissionId}/lock`, { locked })
  return response?.data?.data || null
}

export const getSubmissionDetails = async (submissionId) => {
  const response = await api.get(`/api/coordinator/submissions/${submissionId}`)
  return response?.data?.data || null
}

export const getPrograms = async () => {
  const response = await api.get('/api/coordinator/programs')
  return response?.data?.data || []
}

export const getAdvisers = async () => {
  const response = await api.get('/api/coordinator/advisers')
  return response?.data?.data || []
}

export default {
  getLiveSubmissions,
  getPendingValidations,
  updateSubmissionStatus,
  lockSubmission,
  getSubmissionDetails,
  getPrograms,
  getAdvisers,
  getAnalyticsData,
  getKeywordPopularity,
  getResearchTrends,
  getAdviserWorkload,
  getRepositoryHealth,
  getPerformanceIndicators,
}
