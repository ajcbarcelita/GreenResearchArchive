import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
const ACCESS_TOKEN_KEY = 'gra_access_token';

const api = axios.create({
  baseURL: API_BASE_URL,
});

const getAuthConfig = () => {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  if (!token) return {};
  return { headers: { Authorization: `Bearer ${token}` } };
};

export const getAdvisoryLoad = async (params = {}) => {
  const response = await api.get("/api/advisory/load", { ...getAuthConfig(), params });
  return {
    rows: response?.data?.data || [],
    summary: response?.data?.summary || {},
    filters: response?.data?.filters || {},
  };
};

export const getMyGroups = async () => {
  const response = await api.get("/api/advisory/my-groups", getAuthConfig());
  return response?.data?.data || [];
};

export const getGroupMembers = async (groupId) => {
  const response = await api.get(`/api/advisory/groups/${groupId}/members`, getAuthConfig());
  return response?.data?.data || [];
};

export const addGroupMember = async (groupId, payload) => {
  const response = await api.post(`/api/advisory/groups/${groupId}/members`, payload, getAuthConfig());
  return response?.data?.data || null;
};

export const removeGroupMember = async (groupId, studentId) => {
  const response = await api.delete(`/api/advisory/groups/${groupId}/members/${studentId}`, getAuthConfig());
  return response?.data?.data || null;
};

export const searchStudents = async (q) => {
  const response = await api.get('/api/advisory/students', { ...getAuthConfig(), params: { q } });
  return response?.data?.data || [];
};

export const createGroup = async (payload) => {
  const response = await api.post('/api/advisory/groups', payload, getAuthConfig());
  return response?.data?.data || null;
};

export const deleteGroup = async (groupId) => {
  const response = await api.delete(`/api/advisory/groups/${groupId}`, getAuthConfig());
  return response?.data?.data || null;
};

export default {
  getAdvisoryLoad,
  getMyGroups,
  getGroupMembers,
  addGroupMember,
  removeGroupMember,
};
