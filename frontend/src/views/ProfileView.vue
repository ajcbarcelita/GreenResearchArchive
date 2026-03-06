<script setup>
import { computed, onMounted, ref } from 'vue'
import Toast from 'primevue/toast'
import Card from 'primevue/card'
import Tag from 'primevue/tag'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import { useToast } from 'primevue/usetoast'
import Navbar from '@/components/Navbar.vue'
import NavbarFaculty from '@/components/NavbarFaculty.vue'
import Footer from '@/components/Footer.vue'
import { getDegreePrograms, getStoredUser } from '../services/authService'

const toast = useToast()
const user = ref(getStoredUser())
const programs = ref([])
const programName = ref('Not set')
const loadingPrograms = ref(false)
const isEditing = ref(false)
const draftFirstName = ref('')
const draftMiddleName = ref('')
const draftLastName = ref('')

const fullName = computed(() => {
  if (!user.value) return 'Unknown User'

  const first = user.value.firstName || ''
  const middle = user.value.middleName || ''
  const last = user.value.lastName || ''

  return [first, middle, last].filter(Boolean).join(' ') || 'Unknown User'
})

const accountStatus = computed(() => (user.value?.isActive ? 'Active' : 'Inactive'))
const roleName = computed(() => user.value?.roleName || 'User')
const useFacultyNavbar = computed(() => {
  const normalizedRoleName = String(user.value?.roleName || '').trim().toLowerCase()
  return normalizedRoleName === 'faculty' || normalizedRoleName === 'coordinator'
})

const beginEdit = () => {
  draftFirstName.value = user.value?.firstName || ''
  draftMiddleName.value = user.value?.middleName || ''
  draftLastName.value = user.value?.lastName || ''
  isEditing.value = true
}

const cancelEdit = () => {
  isEditing.value = false
}

const saveEdit = () => {
  if (!draftFirstName.value.trim()) {
    toast.add({
      severity: 'warn',
      summary: 'Invalid Input',
      detail: 'First name is required.',
      life: 3000,
    })
    return
  }

  if (!draftLastName.value.trim()) {
    toast.add({
      severity: 'warn',
      summary: 'Invalid Input',
      detail: 'Last name is required.',
      life: 3000,
    })
    return
  }

  user.value = {
    ...user.value,
    firstName: draftFirstName.value.trim(),
    middleName: draftMiddleName.value.trim() || null,
    lastName: draftLastName.value.trim(),
  }

  localStorage.setItem('gra_user', JSON.stringify(user.value))
  isEditing.value = false

  toast.add({
    severity: 'success',
    summary: 'Profile Updated',
    detail: 'Your name details were updated locally.',
    life: 2500,
  })
}

const resolveProgramName = () => {
  const profile = user.value || {}
  const userProgramId = Number(profile.programId)

  if (!Number.isNaN(userProgramId) && userProgramId > 0) {
    const selected = programs.value.find((program) => Number(program.program_id) === userProgramId)
    if (selected) {
      programName.value = `${selected.program_code} - ${selected.program_name}`
      return
    }
  }

  if (profile.programCode && profile.programName) {
    programName.value = `${profile.programCode} - ${profile.programName}`
    return
  }

  if (profile.programName) {
    programName.value = profile.programName
    return
  }

  programName.value = 'Not set'
}

onMounted(async () => {
  resolveProgramName()

  try {
    loadingPrograms.value = true
    const response = await getDegreePrograms()
    programs.value = Array.isArray(response?.programs)
      ? response.programs
      : Array.isArray(response)
        ? response
        : []
    resolveProgramName()
  } catch {
    resolveProgramName()
  } finally {
    loadingPrograms.value = false
  }
})
</script>

<template>
  <div class="profile-page min-h-screen font-Karla">
    <Toast />
    <header>
      <NavbarFaculty v-if="useFacultyNavbar" />
      <Navbar v-else />
    </header>

    <main class="content-wrap mx-auto w-full max-w-6xl px-4 pb-8 pt-24 sm:px-6 sm:pb-10 sm:pt-28 lg:pt-32">
      <Card class="profile-card">
        <template #title>
          <div class="title-row">
            <div>
              <h1 class="name-heading">{{ fullName }}</h1>
              <p class="email-text">{{ user?.email || 'No email available' }}</p>
            </div>
            <div class="badge-wrap">
              <Tag :value="roleName" severity="success" rounded />
              <Tag :value="accountStatus" :severity="accountStatus === 'Active' ? 'info' : 'danger'" rounded />
            </div>
          </div>
        </template>

        <template #content>
          <div class="grid-wrap">
            <div class="field-box">
              <span class="label">University ID</span>
              <span class="value">{{ user?.universityId || 'Not set' }}</span>
            </div>

            <div class="field-box">
              <span class="label">DLSU Email</span>
              <span class="value">{{ user?.email || 'Not set' }}</span>
            </div>

            <div class="field-box">
              <span class="label">Degree Program</span>
              <span class="value">
                {{ programName }}
                <small v-if="loadingPrograms" class="loading-caption">(loading...)</small>
              </span>
            </div>

            <div class="field-box">
              <span class="label">First Name <span class="required-mark">*</span></span>
              <InputText v-if="isEditing" v-model="draftFirstName" class="w-full" />
              <span v-else class="value">{{ user?.firstName || 'Not set' }}</span>
            </div>

            <div class="field-box">
              <span class="label">Middle Name</span>
              <InputText v-if="isEditing" v-model="draftMiddleName" class="w-full" />
              <span v-else class="value">{{ user?.middleName || 'Not set' }}</span>
            </div>

            <div class="field-box">
              <span class="label">Last Name <span class="required-mark">*</span></span>
              <InputText v-if="isEditing" v-model="draftLastName" class="w-full" />
              <span v-else class="value">{{ user?.lastName || 'Not set' }}</span>
            </div>
          </div>
        </template>

        <template #footer>
          <div class="action-row">
            <Button v-if="!isEditing" @click="beginEdit">
              <template #icon>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="h-4 w-4"
                  aria-hidden="true"
                >
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4Z" />
                </svg>
              </template>
              <span>Edit</span>
            </Button>
            <template v-else>
              <Button label="Cancel" severity="secondary" outlined @click="cancelEdit" />
              <Button label="Save" icon="pi pi-check" @click="saveEdit" />
            </template>
          </div>
        </template>
      </Card>
    </main>

    <footer>
      <Footer />
    </footer>
  </div>
</template>

<style scoped>
.profile-page {
  background: linear-gradient(180deg, var(--color-ash-white), #f8fbf9 45%, #eef6f0);
  display: flex;
  flex-direction: column;
}

.content-wrap {
  flex: 1;
}

footer {
  margin-top: auto;
}

:deep(.profile-card.p-card) {
  border: 1px solid #d7e2db;
  background: #ffffff;
  box-shadow: 0 16px 36px rgba(27, 59, 46, 0.08);
  border-radius: 1rem;
}

.title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.name-heading {
  margin: 0;
  color: var(--color-green-text);
  font-size: clamp(1.4rem, 2.5vw, 2rem);
  letter-spacing: 0.01em;
}

.email-text {
  margin: 0.25rem 0 0;
  color: #486457;
  font-size: 0.95rem;
}

.badge-wrap {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.grid-wrap {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.9rem;
}

.field-box {
  border: 1px solid #d9e4dd;
  border-radius: 0.8rem;
  padding: 0.85rem 0.95rem;
  background: #fbfdfc;
  display: grid;
  gap: 0.35rem;
  min-height: 5.5rem;
}

.label {
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #5a7466;
}

.required-mark {
  color: #dc2626;
}

.value {
  color: #163328;
  font-weight: 600;
}

.loading-caption {
  margin-left: 0.35rem;
  font-weight: 500;
  color: #486457;
}

.action-row {
  display: flex;
  justify-content: flex-end;
  gap: 0.6rem;
}

:deep(.field-box .p-inputtext) {
  border-color: #c8d6ce;
}

@media (max-width: 860px) {
  .grid-wrap {
    grid-template-columns: 1fr;
  }

  .title-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .action-row {
    width: 100%;
    justify-content: stretch;
  }

  .action-row :deep(.p-button) {
    flex: 1;
  }
}

:deep(.profile-card):hover {
  border-color: #0e662e;
}

</style>
