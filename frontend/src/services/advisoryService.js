import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

const api = axios.create({
  baseURL: API_BASE_URL,
});

export const getAdvisoryLoad = async (params = {}) => {
  const response = await api.get("/api/advisory/load", { params });
  return {
    rows: response?.data?.data || [],
    summary: response?.data?.summary || {},
    filters: response?.data?.filters || {},
  };
};

export default {
  getAdvisoryLoad,
};
