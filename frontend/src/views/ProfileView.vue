<script setup>
import { computed, onMounted, ref } from 'vue'
import Card from 'primevue/card'
import Tag from 'primevue/tag'
import Navbar from '@/components/Navbar.vue'
import NavbarAdmin from '@/components/NavbarAdmin.vue'
import NavbarFaculty from '@/components/NavbarFaculty.vue'
import NavbarCoordinator from '@/components/NavbarCoordinator.vue'
import Footer from '@/components/Footer.vue'
import { getDegreePrograms, getMyProfile, getStoredUser } from '../services/authService'

const user = ref(getStoredUser())
const programs = ref([])
const programName = ref('Not set')
const loadingPrograms = ref(false)

const fullName = computed(() => {
  if (!user.value) return 'Unknown User'

  const first = user.value.firstName || ''
  const middle = user.value.middleName || ''
  const last = user.value.lastName || ''

  return [first, middle, last].filter(Boolean).join(' ') || 'Unknown User'
})

const accountStatus = computed(() => (user.value?.isActive ? 'Active' : 'Inactive'))
const roleName = computed(() => user.value?.roleName || 'User')

const useAdminNavbar = computed(() => {
  const normalizedRoleName = String(user.value?.roleName || '').trim().toLowerCase()
  return normalizedRoleName === 'admin'
})
const useCoordinatorNavbar = computed(() => {
  const normalizedRoleName = String(user.value?.roleName || '').trim().toLowerCase()
  return normalizedRoleName === 'coordinator'
})
const useFacultyNavbar = computed(() => {
  const normalizedRoleName = String(user.value?.roleName || '').trim().toLowerCase()
  return normalizedRoleName === 'faculty'
})

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
  try {
    loadingPrograms.value = true
    const [profileResponse, programsResponse] = await Promise.all([
      getMyProfile(),
      getDegreePrograms(),
    ])

    const profileFromDb = profileResponse?.user || null
    if (profileFromDb) {
      user.value = {
        ...user.value,
        ...profileFromDb,
      }
      localStorage.setItem('gra_user', JSON.stringify(user.value))
    }

    programs.value = Array.isArray(programsResponse?.programs)
      ? programsResponse.programs
      : Array.isArray(programsResponse)
        ? programsResponse
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
    <header>
      <NavbarAdmin v-if="useAdminNavbar" />
      <NavbarFaculty v-else-if="useFacultyNavbar" />
      <NavbarCoordinator v-else-if="useCoordinatorNavbar" />
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
              <span class="label">First Name</span>
              <span class="value">{{ user?.firstName || 'Not set' }}</span>
            </div>

            <div class="field-box">
              <span class="label">Middle Name</span>
              <span class="value">{{ user?.middleName || 'Not set' }}</span>
            </div>

            <div class="field-box">
              <span class="label">Last Name</span>
              <span class="value">{{ user?.lastName || 'Not set' }}</span>
            </div>
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
  gap: 0.7rem;
  padding: 0.25rem;
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
