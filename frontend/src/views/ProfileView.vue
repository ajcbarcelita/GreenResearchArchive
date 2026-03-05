<script setup>
import { computed, onMounted, ref } from 'vue'
import Toast from 'primevue/toast'
import Card from 'primevue/card'
import Tag from 'primevue/tag'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import { useToast } from 'primevue/usetoast'
import Navbar from '@/components/Navbar.vue'
import Footer from '@/components/Footer.vue'
import { getDegreePrograms, getStoredUser } from '../services/authService'

const toast = useToast()
const user = ref(getStoredUser())
const programs = ref([])
const programName = ref('Not set')
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
  const selected = programs.value.find((program) => program.program_id === user.value?.programId)
  if (selected) {
    programName.value = `${selected.program_code} - ${selected.program_name}`
  } else {
    programName.value = 'Not set'
  }
}

onMounted(async () => {
  try {
    const response = await getDegreePrograms()
    programs.value = response?.programs || []
    resolveProgramName()
  } catch {
    programName.value = 'Unable to load'
  }
})
</script>

<template>
  <div class="profile-page min-h-screen font-Karla">
    <Toast />
    <header>
      <Navbar />
    </header>

    <main class="content-wrap mx-auto w-full max-w-5xl px-4 pb-10 pt-32">
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
              <span class="value">{{ programName }}</span>
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
}
</style>
