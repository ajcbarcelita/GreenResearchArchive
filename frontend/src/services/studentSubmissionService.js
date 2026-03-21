import api from './api.js'

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
  const response = await api.get('/api/submissions/student/tasks')
  return response?.data || {}
}

export const getCurrentSubmission = async (taskId = null) => {
  const params = taskId ? { params: { taskId } } : {}
  const response = await api.get('/api/submissions/student/current', params)
  return response?.data || {}
}

export const getLatestStudentSubmission = async () => {
  const response = await api.get('/api/submissions/student/latest')
  return response?.data || {}
}

export const getSubmissionAuditLogs = async (submissionId) => {
  const response = await api.get('/api/audit-logs', {
    params: { submissionId },
  })
  return response?.data || {}
}

export const saveCurrentSubmission = async (payload) => {
  const response = await api.put('/api/submissions/student/current', payload)
  return response?.data || {}
}

export const submitCurrentSubmission = async (taskId = null) => {
  const params = taskId ? { params: { taskId } } : {}
  const response = await api.post('/api/submissions/student/current/submit', {}, params)
  return response?.data || {}
}

export const uploadCurrentSubmissionFile = async ({ file, taskId = null }) => {
  const contentBase64 = await fileToBase64(file)
  const response = await api.post('/api/submissions/student/current/files', {
    ...(taskId ? { taskId } : {}),
    fileName: file.name,
    contentType: file.type || 'application/octet-stream',
    contentBase64,
  })

  return response?.data || {}
}

export const deleteCurrentSubmissionFile = async (fileId, taskId = null) => {
  const params = taskId ? { params: { taskId } } : {}
  const response = await api.delete(`/api/submissions/student/current/files/${fileId}`, params)
  return response?.data || {}
}

export default {
  getStudentTasks,
  getLatestStudentSubmission,
  getSubmissionAuditLogs,
  getCurrentSubmission,
  saveCurrentSubmission,
  submitCurrentSubmission,
  uploadCurrentSubmissionFile,
  deleteCurrentSubmissionFile,
}
