import api from "./api";

export const getAdvisoryLoad = async (params = {}) => {
  const { data } = await api.get("/api/advisory/load", { params });
  return {
    rows: data?.data || [],
    summary: data?.summary || {},
    filters: data?.filters || {},
  };
};

export const getMyGroups = async () => {
  const { data } = await api.get("/api/advisory/my-groups");
  return data?.data || [];
};

export const getGroupMembers = async (groupId) => {
  const { data } = await api.get(`/api/advisory/groups/${groupId}/members`);
  return data?.data || [];
};

export const addGroupMember = async (groupId, payload) => {
  const { data } = await api.post(`/api/advisory/groups/${groupId}/members`, payload);
  return data?.data || null;
};

export const removeGroupMember = async (groupId, studentId) => {
  const { data } = await api.delete(`/api/advisory/groups/${groupId}/members/${studentId}`);
  return data?.data || null;
};

export const searchStudents = async (q) => {
  const { data } = await api.get('/api/advisory/students', { params: { q } });
  return data?.data || [];
};

export const createGroup = async (payload) => {
  const { data } = await api.post('/api/advisory/groups', payload);
  return data?.data || null;
};

export const deleteGroup = async (groupId) => {
  const { data } = await api.delete(`/api/advisory/groups/${groupId}`);
  return data?.data || null;
};

export default {
  getAdvisoryLoad,
  getMyGroups,
  getGroupMembers,
  addGroupMember,
  removeGroupMember,
  searchStudents,
  createGroup,
  deleteGroup,
};