import api from './api' // Assuming you have an Axios instance set up here

export const getDashboardAnalytics = async () => {
  const response = await api.get('/api/admin/dashboard')
  return response.data
}

export const revokeSpecificSession = async (sessionId) => {
  const response = await api.post(`/api/admin/dashboard/sessions/${sessionId}/revoke`)
  return response.data
}
