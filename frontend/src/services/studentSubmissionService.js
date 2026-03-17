import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'
const ACCESS_TOKEN_KEY = 'gra_access_token'

const api = axios.create({
  baseURL: API_BASE_URL,
})

const getAuthConfig = () => {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY)
  if (!token) return {}

  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
}

const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = String(reader.result || '')
      const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

export const getStudentTasks = async () => {
  const response = await api.get('/api/submissions/student/tasks', getAuthConfig())
  return response?.data || {}
}

export const getCurrentSubmission = async (taskId = null) => {
  const params = taskId ? { params: { taskId } } : {}
  const response = await api.get('/api/submissions/student/current', { ...getAuthConfig(), ...params })
  return response?.data || {}
}

export const saveCurrentSubmission = async (payload) => {
  const response = await api.put('/api/submissions/student/current', payload, getAuthConfig())
  return response?.data || {}
}

export const submitCurrentSubmission = async (taskId = null) => {
  const params = taskId ? { params: { taskId } } : {}
  const response = await api.post('/api/submissions/student/current/submit', {}, { ...getAuthConfig(), ...params })
  return response?.data || {}
}

export const uploadCurrentSubmissionFile = async ({ file, versionNo }) => {
  const contentBase64 = await fileToBase64(file)
  const response = await api.post(
    '/api/submissions/student/current/files',
    {
      fileName: file.name,
      contentType: file.type || 'application/octet-stream',
      contentBase64,
      versionNo,
    },
    getAuthConfig(),
  )

  return response?.data || {}
}

export const deleteCurrentSubmissionFile = async (fileId) => {
  const response = await api.delete(`/api/submissions/student/current/files/${fileId}`, getAuthConfig())
  return response?.data || {}
}

export default {
  getStudentTasks,
  getCurrentSubmission,
  saveCurrentSubmission,
  submitCurrentSubmission,
  uploadCurrentSubmissionFile,
  deleteCurrentSubmissionFile,
}
