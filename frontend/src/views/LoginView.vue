<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import { authenticateWithGoogle, needsProfileCompletion } from '../services/authService'
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
    if (needsProfileCompletion(result?.user)) {
      router.push('/complete-profile')
      return
    }
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
  const buttonWidth = Math.min(320, Math.max(220, container.clientWidth))

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
        width: buttonWidth,
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
      <div class="card-glass">
        <div class="brand-row">
          <router-link to="/" class="brand-link">
            <img src="@/assets/DLSU-Logo.png" alt="logo" class="brand-logo" />
            <div class="brand-text">
              <div class="brand-title">Green Archive</div>
              <div class="brand-sub">College of Computer Studies</div>
            </div>
          </router-link>
        </div>

        <h2 class="welcome">Welcome back!</h2>
        <p class="lead">Sign in with your DLSU account to continue to the repository.</p>

        <div class="signin-area">
          <div id="google-signin-button" class="signin-button" />
          <div class="note">Only <strong>@dlsu.edu.ph</strong> accounts are allowed.</div>
        </div>
      </div>
    </section>

    <section class="right-panel" :style="heroBackgroundStyle">
      <div class="green-overlay" aria-hidden="true" />
      <div class="image-blur" aria-hidden="true" />
    </section>

    <Dialog
      v-model:visible="showErrorModal"
      modal
      header="Authentication Error"
      :style="{ width: 'min(28rem, 92vw)' }"
    >
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
  grid-template-columns: 1fr 1.4fr;
  overflow: hidden;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial;
}

.left-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px;
  background: linear-gradient(180deg, rgba(250,251,250,1), rgba(247,249,247,1));
}

.card-glass {
  width: 100%;
  max-width: 520px;
  background: rgba(255,255,255,0.92);
  border-radius: 16px;
  padding: 36px;
  box-shadow: 0 12px 36px rgba(6, 45, 24, 0.10);
  backdrop-filter: blur(6px) saturate(120%);
  border: 1px solid rgba(15, 82, 46, 0.06);
}

.brand-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand-logo {
  height: 64px;
  width: 64px;
  object-fit: contain;
  border-radius: 10px;
}

.brand-text .brand-title {
  font-weight: 800;
  color: #063b25;
  font-size: 1.25rem;
}

.brand-text .brand-sub {
  font-size: 0.9rem;
  color: #406a57;
}

.welcome {
  margin: 20px 0 8px;
  font-size: 2.1rem;
  color: #0f3f2b;
}

.lead {
  margin: 0 0 20px;
  color: #47685a;
  font-size: 1.15rem;
}

.signin-area {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.signin-button {
  width: 100%;
  max-width: 360px;
}

.note {
  color: #567568;
  font-size: 1rem;
}

.right-panel {
  position: relative;
  background-size: cover;
  background-position: center;
}

.green-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(6,86,37,0.28), rgba(6,86,37,0.48));
  mix-blend-mode: multiply;
}

.image-blur {
  position: absolute;
  inset: 0;
  backdrop-filter: blur(6px) saturate(1.2);
}

.modal-message { color: #062b1d }

@media (max-width: 1024px) {
  .login-page { grid-template-columns: 1fr }
  .right-panel { display: none }
  .left-panel { padding: 28px }
  .card-glass { padding: 24px; max-width: 520px }
}
</style>
