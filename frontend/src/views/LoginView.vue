<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import { authenticateWithGoogle } from '../services/authService'
import LoginBg from '../assets/Login_BG.jpg'

const router = useRouter()
const isLoading = ref(false)
const showErrorModal = ref(false)
const errorMessage = ref('')
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
const heroBackgroundStyle = { backgroundImage: `url(${LoginBg})` }

const openErrorModal = (message) => {
  errorMessage.value = message || 'Unable to continue with Google authentication.'
  showErrorModal.value = true
}

const handleGoogleCredential = async (response) => {
  try {
    console.log('[LoginView] handleGoogleCredential called')
    console.log('[LoginView] response:', response)
    console.log('[LoginView] credential:', response?.credential ? `${response.credential.substring(0, 50)}...` : 'EMPTY')
    isLoading.value = true
    const result = await authenticateWithGoogle(response.credential)
    if (!result?.accessToken) {
      throw new Error('Authentication succeeded but no access token was returned.')
    }
    console.log('[LoginView] Authentication successful, redirecting...')
    router.push('/dashboard')
  } catch (error) {
    console.error('[LoginView] Authentication error:', error)
    const backendMessage = error?.response?.data?.message
    openErrorModal(backendMessage || 'Google authentication failed. Please try again.')
  } finally {
    isLoading.value = false
  }
}

const loadGoogleScript = () => {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve()
      return
    }
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = resolve
    script.onerror = reject
    document.head.appendChild(script)
  })
}

const renderGoogleButton = () => {
  const container = document.getElementById('google-signin-button')
  if (!container) {
    console.error('[LoginView] Container not found')
    return
  }
  container.innerHTML = '' // Clear previous button if any
  if (!googleClientId) {
    console.error('[LoginView] googleClientId is missing:', googleClientId)
    openErrorModal('VITE_GOOGLE_CLIENT_ID is missing. Set it in frontend/.env and restart the dev server.')
    return
  }
  try {
    console.log('[LoginView] Initializing Google with clientId:', googleClientId)
    window.google.accounts.id.initialize({
      client_id: googleClientId,
      callback: handleGoogleCredential,
    })
    console.log('[LoginView] Google initialized, rendering button...')
    window.google.accounts.id.renderButton(
      container,
      {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'signin_with',
        shape: 'rectangular',
        width: 320,
      }
    )
    console.log('[LoginView] Google button rendered successfully')
  } catch (err) {
    console.error('[LoginView] Error rendering Google button:', err)
    openErrorModal('Failed to render Google Sign-In button. Please reload and try again.')
  }
}

const reloadGoogleSignIn = async () => {
  await loadGoogleScript()
  renderGoogleButton()
}

onMounted(reloadGoogleSignIn)
</script>

<template>
  <main class="login-page">
    <section class="left-panel">
      <div class="content-wrapper">
        <h1 class="hero-title">THE GREEN ARCHIVE</h1>
        <p class="hero-subtitle">Repository and Knowledge Management System · Department of IT, DLSU</p>
        <div style="margin-top: 24px;">
          <div id="google-signin-button"></div>
          <div style="margin-top: 16px; font-size: 0.95rem; color: #555;">Only @dlsu.edu.ph accounts are allowed.</div>
        </div>
      </div>
    </section>
    <section class="right-panel" :style="heroBackgroundStyle" />
    <Dialog v-model:visible="showErrorModal" modal header="Authentication Error" :style="{ width: '28rem' }">
      <p class="modal-message">{{ errorMessage }}</p>
      <template #footer>
        <Button label="Close" @click="showErrorModal = false" />
      </template>
    </Dialog>
  </main>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 1fr 1fr;
  overflow: hidden;
}

.left-panel {
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  overflow-y: auto;
}

.content-wrapper {
  width: 100%;
  max-width: 480px;
}

.right-panel {
  background-size: cover;
  background-position: center;
  filter: hue-rotate(80deg) saturate(1.3) brightness(0.95);
}

.hero-title {
  margin: 0;
  font-size: clamp(2rem, 5vw, 3.2rem);
  line-height: 1.1;
  font-weight: 800;
  letter-spacing: 0.02em;
  color: #0a0a0a;
}

.hero-subtitle {
  margin-top: 12px;
  font-size: 0.95rem;
  color: #555555;
  line-height: 1.5;
}

.get-started-btn {
  margin-top: 24px;
  background: #1f6b3a;
  border-color: #1f6b3a;
  color: #ffffff;
  border-radius: 999px;
  padding: 16px 28px;
  font-weight: 700;
  font-size: 1.1rem;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: background 0.3s;
}

.get-started-btn:hover {
  background: #165a32;
}

.btn-text {
  letter-spacing: 0.02em;
}

.modal-message {
  margin: 0;
  color: #333333;
}

@media (max-width: 1024px) {
  .login-page {
    grid-template-columns: 1fr;
  }

  .right-panel {
    display: none;
  }

  .left-panel {
    padding: 24px;
  }
}

@media (max-width: 768px) {
  .left-panel {
    padding: 20px;
  }

  .hero-title {
    font-size: 2rem;
  }

  .get-started-btn {
    font-size: 1rem;
    padding: 12px 20px;
  }
}
</style>
