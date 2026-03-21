<script setup>
import { onMounted, ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import Toast from 'primevue/toast'
import { useToast } from 'primevue/usetoast'
import Footer from '@/components/Footer.vue'
import Navbar from '@/components/Navbar.vue'
import NavbarAdmin from '@/components/NavbarAdmin.vue'
import NavbarFaculty from '@/components/NavbarFaculty.vue'
import NavbarCoordinator from '@/components/NavbarCoordinator.vue'
import CompleteProfileForm from '@/components/CompleteProfileForm.vue'
import {
  completeProfile,
  getDegreePrograms,
  getStoredUser,
  needsProfileCompletion,
} from '../services/authService'

const router = useRouter()
const route = useRoute()
const toast = useToast()

const propRole =
  String(route.params.role || '')
    .trim()
    .toLowerCase() || null
const user = ref(getStoredUser())

const resolvedRole = computed(() => {
  const fromUser = String(user.value?.roleName || '')
    .trim()
    .toLowerCase()
  const r = propRole || fromUser
  if (r === 'admin') return 'admin'
  if (r === 'faculty') return 'faculty'
  if (r === 'coordinator') return 'coordinator'
  return 'student'
})

const isStudent = computed(() => resolvedRole.value === 'student')
const isFaculty = computed(() => resolvedRole.value === 'faculty')
const isCoordinator = computed(() => resolvedRole.value === 'coordinator')
const isAdmin = computed(() => resolvedRole.value === 'admin')

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
    const message =
      error?.response?.data?.message || 'Unable to load degree programs. Please try again.'
    errorMessage.value = message
    toast.add({ severity: 'error', summary: 'Request Failed', detail: message, life: 3500 })
  } finally {
    isLoadingPrograms.value = false
  }
}

const submitProfile = async (payload) => {
  try {
    isSubmitting.value = true
    errorMessage.value = ''

    const body = {
      universityId: payload.universityId,
      firstName: payload.firstName,
      lastName: payload.lastName,
      middleName: payload.middleName || null,
    }

    if (isStudent.value) {
      body.programId = Number(payload.programId)
    }

    await completeProfile(body)

    // Navigate to role home
    if (isAdmin.value) router.push('/admin/dashboard')
    else if (isFaculty.value) router.push('/faculty/home')
    else if (isCoordinator.value) router.push('/coordinator/home')
    else router.push('/dashboard')
  } catch (error) {
    const message =
      error?.response?.data?.message || 'Unable to complete profile. Please try again.'
    errorMessage.value = message
    toast.add({ severity: 'error', summary: 'Invalid Input', detail: message, life: 3500 })
  } finally {
    isSubmitting.value = false
  }
}

onMounted(async () => {
  if (!needsProfileCompletion(user.value)) {
    if (isAdmin.value) router.push('/admin/dashboard')
    else if (isFaculty.value) router.push('/faculty/home')
    else if (isCoordinator.value) router.push('/coordinator/home')
    else router.push('/dashboard')
    return
  }

  if (isStudent.value) await loadPrograms()
})
</script>

<template>
  <div class="min-h-screen flex flex-col bg-linear-to-b from-[#eaf4ee] to-[#f8fbf9] font-Karla">
    <Toast />
    <header>
      <NavbarAdmin v-if="isAdmin" />
      <NavbarFaculty v-else-if="isFaculty" />
      <NavbarCoordinator v-else-if="isCoordinator" />
      <Navbar v-else />
    </header>

    <main
      class="flex-1 flex items-center justify-center px-4 py-6 pt-24 sm:px-6 sm:py-8 sm:pt-28 lg:pt-32"
    >
      <CompleteProfileForm
        :programs="programs"
        :loading-programs="isLoadingPrograms"
        :submitting="isSubmitting"
        :error-message="errorMessage"
        :initial-profile="user"
        :requires-program="isStudent"
        @submit-profile="submitProfile"
      />
    </main>

    <footer>
      <Footer />
    </footer>
  </div>
</template>
