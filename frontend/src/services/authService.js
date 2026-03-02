import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

export const authenticateWithGoogle = async (idToken) => {
  console.log('[authService] authenticateWithGoogle called')
  console.log('[authService] API_BASE_URL:', API_BASE_URL)
  console.log('[authService] idToken:', idToken ? `${idToken.substring(0, 50)}...` : 'EMPTY')

  const response = await axios.post(`${API_BASE_URL}/api/auth/google`, {
    idToken,
  })

  console.log('[authService] Response:', response.data)
  return response.data
}
