import api from './api' // Import your "Self-Healing" instance

export const listProgramsAdmin = async (params = {}) => {
  const { data } = await api.get('/api/admin/programs', { params })
  return data?.programs || []
}

export const createProgramAdmin = async (payload) => {
  const { data } = await api.post('/api/admin/programs', payload)
  return data?.program || null
}

export const updateProgramAdmin = async (programId, payload) => {
  const { data } = await api.patch(`/api/admin/programs/${programId}`, payload)
  return data?.program || null
}

export const deleteProgramAdmin = async (programId) => {
  const { data } = await api.delete(`/api/admin/programs/${programId}`)
  return data || {}
}

export const restoreProgramAdmin = async (programId) => {
  const { data } = await api.patch(`/api/admin/programs/${programId}/restore`)
  return data || {}
}

export default {
  listProgramsAdmin,
  createProgramAdmin,
  updateProgramAdmin,
  deleteProgramAdmin,
  restoreProgramAdmin,
}
