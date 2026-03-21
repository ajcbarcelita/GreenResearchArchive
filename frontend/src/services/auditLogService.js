import api from './api'

export const getAuditLogs = async (params = {}) => {
  const { data } = await api.get('/api/audit-logs', { params })
  return {
    rows: data?.data || [],
    summary: data?.summary || {},
    filters: data?.filters || {},
  }
}

export default {
  getAuditLogs,
}
