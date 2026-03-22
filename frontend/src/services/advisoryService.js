import { api as authApi } from './authService'

export const getAdvisoryLoad = async (params = {}) => {
  const response = await authApi.get('/api/advisory/load', { params })
  const data = response?.data
  return {
    rows: response?.data?.data || [],
    summary: response?.data?.summary || {},
    filters: response?.data?.filters || {},
  }
}

export const getMyGroups = async () => {
  const response = await authApi.get('/api/advisory/my-groups')
  return response?.data?.data || []
}

export const getGroupMembers = async (groupId) => {
  const response = await authApi.get(`/api/advisory/groups/${groupId}/members`)
  return response?.data?.data || []
}

export const addGroupMember = async (groupId, payload) => {
  const response = await authApi.post(`/api/advisory/groups/${groupId}/members`, payload)
  return response?.data?.data || null
}

export const removeGroupMember = async (groupId, studentId) => {
  const response = await authApi.delete(`/api/advisory/groups/${groupId}/members/${studentId}`)
  return response?.data?.data || null
}

export const searchStudents = async (q) => {
  const response = await authApi.get('/api/advisory/students', { params: { q } })
  return response?.data?.data || []
}

export const createGroup = async (payload) => {
  const response = await authApi.post('/api/advisory/groups', payload)
  return response?.data?.data || null
}

export const deleteGroup = async (groupId) => {
  const response = await authApi.delete(`/api/advisory/groups/${groupId}`)
  return response?.data?.data || null
}

export const getCoordinatorTasks = async () => {
  const response = await authApi.get('/api/advisory/tasks')
  return response?.data?.data || []
}

export const getCoordinatorTerms = async () => {
  const response = await authApi.get('/api/advisory/terms')
  return response?.data?.data || []
}

export const toggleCoordinatorTaskLock = async (taskId) => {
  const response = await authApi.patch(`/api/advisory/tasks/${taskId}/lock-toggle`)
  return response?.data?.data || null
}

export const toggleCoordinatorTaskAutoLock = async (taskId) => {
  const response = await authApi.patch(`/api/advisory/tasks/${taskId}/auto-lock-toggle`)
  return response?.data?.data || null
}

export const createCoordinatorTask = async (payload) => {
  const response = await authApi.post('/api/advisory/tasks', payload)
  return response?.data?.data || null
}

export const updateCoordinatorTask = async (taskId, payload) => {
  const response = await authApi.put(`/api/advisory/tasks/${taskId}`, payload)
  return response?.data?.data || null
}

export const deleteCoordinatorTask = async (taskId) => {
  const response = await authApi.delete(`/api/advisory/tasks/${taskId}`)
  return response?.status === 204 || response?.data?.data || null
}

export const getReviewQueue = async () => {
  const response = await authApi.get('/api/advisory/review-queue')
  return response?.data?.data || []
}

export const updateSubmissionStatus = async (submissionId, status, remarks = '') => {
  const response = await authApi.put(`/api/advisory/submissions/${submissionId}/status`, {
    status,
    remarks,
  })
  return response?.data?.data || null
}

export const deleteSubmission = async (submissionId) => {
  const response = await authApi.delete(`/api/advisory/submissions/${submissionId}`)
  return response?.data?.data || null
}

export default {
  getAdvisoryLoad,
  getMyGroups,
  getGroupMembers,
  addGroupMember,
  removeGroupMember,
  getCoordinatorTasks,
  getCoordinatorTerms,
  toggleCoordinatorTaskLock,
  toggleCoordinatorTaskAutoLock,
  createCoordinatorTask,
  updateCoordinatorTask,
  deleteCoordinatorTask,
  getReviewQueue,
  updateSubmissionStatus,
  deleteSubmission,
}
