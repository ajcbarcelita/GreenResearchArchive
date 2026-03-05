<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import Toast from 'primevue/toast'
import { useToast } from 'primevue/usetoast'
import Footer from '@/components/Footer.vue'
import Navbar from '@/components/Navbar.vue'
import CompleteProfileForm from '@/components/CompleteProfileForm.vue'
import {
  completeProfile,
  getDegreePrograms,
  getStoredUser,
  needsProfileCompletion,
} from '../services/authService'

const router = useRouter()
const toast = useToast()

const user = ref(getStoredUser())
const programs = ref([])
const isLoadingPrograms = ref(false)
const isSubmitting = ref(false)
const errorMessage = ref('')

const loadPrograms = async () => {
  try {
    isLoadingPrograms.value = true
    errorMessage.value = ''
    const response = await getDegreePrograms()
    programs.value = response?.programs || []
  } catch (error) {
    const message = error?.response?.data?.message || 'Unable to load degree programs. Please try again.'
    errorMessage.value = message
    toast.add({
      severity: 'error',
      summary: 'Request Failed',
      detail: message,
      life: 3500,
    })
  } finally {
    isLoadingPrograms.value = false
  }
}

const submitProfile = async (payload) => {
  try {
    isSubmitting.value = true
    errorMessage.value = ''
    await completeProfile({
      universityId: payload.universityId,
      firstName: payload.firstName,
      lastName: payload.lastName,
      middleName: payload.middleName || null,
      programId: Number(payload.programId),
    })
    router.push('/dashboard')
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

onMounted(async () => {
  if (!needsProfileCompletion(user.value)) {
    router.push('/dashboard')
    return
  }

  await loadPrograms()
})
</script>

<template>
  <div class="min-h-screen flex flex-col bg-gradient-to-b from-[#eaf4ee] to-[#f8fbf9] font-Karla">
    <Toast />
    <header>
      <Navbar />
    </header>

    <main class="flex-1 flex items-center justify-center px-4 py-6 pt-24 sm:px-6 sm:py-8 sm:pt-28 lg:pt-32">
      <CompleteProfileForm
        :programs="programs"
        :loading-programs="isLoadingPrograms"
        :submitting="isSubmitting"
        :error-message="errorMessage"
        :initial-profile="user"
        @submit-profile="submitProfile"
      />
    </main>

    <footer>
      <Footer />
    </footer>
  </div>
</template>
