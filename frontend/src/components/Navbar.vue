<template>
  <nav class="navbar-glass text-white font-Karla absolute w-full z-50">
    <div class="container mx-auto px-6">
      <div class="grid grid-cols-3 items-center py-4">

        <div class="flex items-center space-x-4">
          <router-link to="/" class="flex items-center space-x-3">
            <img
              src="@/assets/DLSU-logo.png"
              alt="Green Archive"
              class="logo-img h-12 w-auto"
            />
            <div class="leading-tight">
              <div class="text-lg font-italic">Green Archive</div>
              <div class="text-xs opacity-80">College of Computer Studies</div>
            </div>
          </router-link>
        </div>

        <div class="flex justify-center">
          <div class="space-x-8 text-base font-semibold">
            <router-link to="/" class="nav-link">Home</router-link>
            <router-link to="/submission" class="nav-link">Capstone Submission</router-link>
            <router-link to="/repository" class="nav-link">Repository</router-link>
          </div>
        </div>

        <div class="flex items-center justify-end space-x-4 text-base font-semibold">
          <router-link to="/profile" class="profile-link">
            <div class="h-9 w-9 rounded-full overflow-hidden border border-white/20 bg-white/10 flex items-center justify-center">
              <img src="@/assets/Profile.png" alt="Profile" class="h-full w-full" />
            </div>
          </router-link>

          <button @click="logout" class="nav-link">Logout</button>
        </div>

      </div>
    </div>
  </nav>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { logout as logoutUser } from '../services/authService'

const router = useRouter()

const logout = async () => {
  await logoutUser()

  if (window.google?.accounts?.id) {
    window.google.accounts.id.disableAutoSelect()
  }

  router.push('/login')
}

</script>

<style scoped>
.nav-link {
  color: white;
  text-decoration: none;
  padding: 6px 14px;
  border-radius: 6px;
  transition: all 0.25s ease;
}

.nav-link:hover {
  background-color: #E4EAEA;
  color: #0B6B3A;
}

.navbar-glass {
  background-color: var(--color-dark-green);
  background-image: linear-gradient(90deg, var(--color-dark-green), var(--color-bright-green));
  backdrop-filter: blur(16px);
  border-bottom: 3px solid rgba(255,255,255,0.06);
  box-shadow: 0 6px 18px rgba(10,20,15,0.15);
}

.nav-link:hover {
  background-color: rgba(255,255,255,0.9);
  color: var(--color-dark-green, #0B6B3A);
}
</style>
