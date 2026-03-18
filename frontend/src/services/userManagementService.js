import api from './api' // Central instance handles the tokens now

export const listUsersAdmin = async (params = {}) => {
  const { data } = await api.get('/api/admin/users', { params })

  return {
    users: data?.users || [],
    filters: data?.filters || { roles: [], programs: [] },
  }
}

export const getUsersAdminMeta = async () => {
  const { data } = await api.get('/api/admin/users/meta')

  return {
    roles: data?.roles || [],
    programs: data?.programs || [],
    studentRoleId: data?.studentRoleId || null,
  }
}

export const updateUserAdmin = async (userId, payload) => {
  const { data } = await api.patch(`/api/admin/users/${userId}`, payload)
  return data?.user || null
}

export default {
  listUsersAdmin,
  getUsersAdminMeta,
  updateUserAdmin,
}