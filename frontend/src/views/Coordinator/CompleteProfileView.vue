<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import Toast from 'primevue/toast'
import { useToast } from 'primevue/usetoast'
import Footer from '@/components/Footer.vue'
import NavbarFaculty from '@/components/NavbarFaculty.vue'
import NavbarCoordinator from '@/components/NavbarCoordinator.vue'
import CompleteProfileForm from '@/components/CompleteProfileForm.vue'
import {
  completeProfile,
  getStoredUser,
  needsProfileCompletion,
} from '../../services/authService'

const router = useRouter()
const toast = useToast()

const user = ref(getStoredUser())
const isFaculty = computed(
  () => String(user.value?.roleName || '').trim().toLowerCase() === 'faculty',
)
const isSubmitting = ref(false)
const errorMessage = ref('')

const submitProfile = async (payload) => {
  try {
    isSubmitting.value = true
    errorMessage.value = ''
    await completeProfile({
      universityId: payload.universityId,
      firstName: payload.firstName,
      lastName: payload.lastName,
      middleName: payload.middleName || null,
    })
    router.push(isFaculty.value ? '/faculty/home' : '/coordinator/home')
  } catch (error) {
    const message = error?.response?.data?.message || 'Unable to complete profile. Please try again.'
    errorMessage.value = message
    toast.add({
      severity: 'error',
      summary: 'Invalid Input',
      detail: message,
      life: 3500,
    })
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  if (!needsProfileCompletion(user.value)) {
    router.push(isFaculty.value ? '/faculty/home' : '/coordinator/home')
  }
})
</script>

<template>
  <div class="min-h-screen flex flex-col bg-linear-to-b from-[#eaf4ee] to-[#f8fbf9] font-Karla">
    <Toast />
    <header>
      <NavbarFaculty v-if="isFaculty" />
      <NavbarCoordinator v-else />
    </header>

    <main class="flex-1 flex items-center justify-center px-4 py-6 pt-24 sm:px-6 sm:py-8 sm:pt-28 lg:pt-32">
      <CompleteProfileForm
        :submitting="isSubmitting"
        :error-message="errorMessage"
        :initial-profile="user"
        :requires-program="false"
        @submit-profile="submitProfile"
      />
    </main>

    <footer>
      <Footer />
    </footer>
  </div>
</template>
