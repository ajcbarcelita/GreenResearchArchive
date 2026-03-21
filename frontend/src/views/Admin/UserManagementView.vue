<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import Card from 'primevue/card'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import ToggleSwitch from 'primevue/toggleswitch'
import Toast from 'primevue/toast'
import { useToast } from 'primevue/usetoast'
import Footer from '@/components/Footer.vue'
import NavbarAdmin from '@/components/NavbarAdmin.vue'
import {
  getUsersAdminMeta,
  listUsersAdmin,
  updateUserAdmin,
} from '@/services/userManagementService'

const toast = useToast()

const loading = ref(false)
const saving = ref(false)

const users = ref([])
const roleOptions = ref([{ label: 'All Roles', value: 'All' }])
const programOptions = ref([{ label: 'All Programs', value: 'All' }])
const studentRoleId = ref(null)

const searchQuery = ref('')
const selectedRole = ref('All')
const selectedProgram = ref('All')
const selectedStatus = ref('All')

const dialogVisible = ref(false)
const activeUserId = ref(null)
const form = ref({
  roleId: null,
  programId: null,
  isActive: true,
})

const formErrors = ref({
  roleId: '',
  programId: '',
})

const statusOptions = [
  { label: 'All Status', value: 'All' },
  { label: 'Active', value: true },
  { label: 'Inactive', value: false },
]

const selectedRoleIsStudent = computed(() => Number(form.value.roleId) === Number(studentRoleId.value))

const validateForm = () => {
  const errors = {
    roleId: '',
    programId: '',
  }

  if (!form.value.roleId) {
    errors.roleId = 'Role is required.'
  }

  if (selectedRoleIsStudent.value && !form.value.programId) {
    errors.programId = 'Program is required for Student role.'
  }

  if (!selectedRoleIsStudent.value) {
    form.value.programId = null
  }

  formErrors.value = errors
  return !errors.roleId && !errors.programId
}

const openEditDialog = (user) => {
  activeUserId.value = user.userId
  form.value = {
    roleId: user.roleId,
    programId: user.programId || null,
    isActive: Boolean(user.isActive),
  }
  formErrors.value = {
    roleId: '',
    programId: '',
  }
  dialogVisible.value = true
}

const mapRoleOptions = (roles = []) => [
  { label: 'All Roles', value: 'All' },
  ...roles
  .filter((role => role.roleId !== 4))
  .map((role) => ({
    label: role.roleName,
    value: role.roleId,
  })),
]

const mapProgramOptions = (programs = []) => [
  { label: 'All Programs', value: 'All' },
  ...programs.map((program) => ({
    label: `${program.programCode} - ${program.programName}`,
    value: program.programId,
  })),
]

const loadMeta = async () => {
  const meta = await getUsersAdminMeta()
  roleOptions.value = mapRoleOptions(meta.roles)
  programOptions.value = mapProgramOptions(meta.programs)
  studentRoleId.value = meta.studentRoleId
}

const loadUsers = async () => {
  loading.value = true
  try {
    const params = {}
    const normalizedQuery = searchQuery.value.trim()
    if (normalizedQuery) params.q = normalizedQuery
    if (selectedRole.value !== 'All') params.roleId = selectedRole.value
    if (selectedProgram.value !== 'All') params.programId = selectedProgram.value
    if (selectedStatus.value !== 'All') params.isActive = String(selectedStatus.value)

    const response = await listUsersAdmin(params)
    users.value = response.users || []

    if (!roleOptions.value.length || roleOptions.value.length === 1) {
      roleOptions.value = mapRoleOptions(response.filters?.roles || [])
    }

    if (!programOptions.value.length || programOptions.value.length === 1) {
      programOptions.value = mapProgramOptions(response.filters?.programs || [])
    }
  } catch (error) {
    console.error('Failed to load users', error)
    users.value = []
    toast.add({
      severity: 'error',
      summary: 'Load failed',
      detail: error?.response?.data?.message || 'Unable to fetch users.',
      life: 3200,
    })
  } finally {
    loading.value = false
  }
}

const handleSave = async () => {
  if (!validateForm()) return
  if (!activeUserId.value) return

  saving.value = true
  try {
    const payload = {
      roleId: Number(form.value.roleId),
      programId: selectedRoleIsStudent.value ? Number(form.value.programId) : null,
      isActive: Boolean(form.value.isActive),
    }

    await updateUserAdmin(activeUserId.value, payload)
    dialogVisible.value = false
    toast.add({
      severity: 'success',
      summary: 'User updated',
      detail: 'User account settings were updated successfully.',
      life: 2500,
    })
    await loadUsers()
  } catch (error) {
    console.error('Failed to update user', error)
    toast.add({
      severity: 'error',
      summary: 'Update failed',
      detail: error?.response?.data?.message || 'Unable to update user.',
      life: 3500,
    })
  } finally {
    saving.value = false
  }
}

const totals = computed(() => ({
  totalUsers: users.value.length,
  activeUsers: users.value.filter((row) => row.isActive).length,
  inactiveUsers: users.value.filter((row) => !row.isActive).length,
}))

let debounceTimer = null
watch([searchQuery, selectedRole, selectedProgram, selectedStatus], () => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    loadUsers()
  }, 250)
})

onMounted(async () => {
  document.title = "User Management | Green Archive"
  try {
    await loadMeta()
  } catch (error) {
    console.error('Failed to load user metadata', error)
  }
  await loadUsers()
})

</script>

<template>
  <div class="users-page min-h-screen flex flex-col font-Karla">
    <Toast />
    <header>
      <NavbarAdmin />
    </header>

    <main class="mx-auto w-full max-w-7xl flex-1 px-4 pb-8 pt-24 sm:px-6 sm:pt-28 lg:pt-32">
      <Card class="hero-card">
        <template #content>
          <div class="hero-row">
            <div>
              <p class="kicker">Admin</p>
              <h1 class="headline">User Management</h1>
              <p class="support-text">
                Manage role assignment, account status, and student program mappings across the platform.
              </p>
            </div>
            <Button icon="pi pi-refresh" label="Refresh" outlined :loading="loading" @click="loadUsers" />
          </div>
        </template>
      </Card>

      <section class="summary-grid mt-4">
        <Card class="summary-card"><template #content><p class="label">Users</p><p class="value">{{ totals.totalUsers }}</p></template></Card>
        <Card class="summary-card"><template #content><p class="label">Active</p><p class="value">{{ totals.activeUsers }}</p></template></Card>
        <Card class="summary-card"><template #content><p class="label">Inactive</p><p class="value">{{ totals.inactiveUsers }}</p></template></Card>
      </section>

      <Card class="filter-card mt-4">
        <template #content>
          <div class="filter-row">
            <InputText v-model="searchQuery" placeholder="Search by name, email, or university ID" />
            <Select v-model="selectedRole" :options="roleOptions" optionLabel="label" optionValue="value" placeholder="Role" />
            <Select v-model="selectedProgram" :options="programOptions" optionLabel="label" optionValue="value" placeholder="Program" />
            <Select v-model="selectedStatus" :options="statusOptions" optionLabel="label" optionValue="value" placeholder="Status" />
          </div>
        </template>
      </Card>

      <Card class="table-card mt-4">
        <template #content>
          <DataTable
            :value="users"
            :loading="loading"
            paginator
            :rows="10"
            :rowsPerPageOptions="[10, 20, 50]"
            stripedRows
            size="small"
            responsiveLayout="scroll"
          >
            <Column field="universityId" header="University ID" sortable />
            <Column field="fullName" header="Name" sortable />
            <Column field="email" header="Email" sortable />
            <Column field="roleName" header="Role" sortable />
            <Column header="Program">
              <template #body="slotProps">
                {{ slotProps.data.programCode || 'N/A' }}
              </template>
            </Column>
            <Column header="Status" sortable field="isActive">
              <template #body="slotProps">
                <Tag :value="slotProps.data.isActive ? 'Active' : 'Inactive'" :severity="slotProps.data.isActive ? 'success' : 'danger'" />
              </template>
            </Column>
            <Column field="lastLogin" header="Last Login" sortable />
            <Column header="Actions">
              <template #body="slotProps">
                <Button size="small" text icon="pi pi-pencil" label="Edit" @click="openEditDialog(slotProps.data)" />
              </template>
            </Column>
          </DataTable>
        </template>
      </Card>
    </main>

    <Dialog
      v-model:visible="dialogVisible"
      header="Edit User"
      modal
      :style="{ width: 'min(95vw, 36rem)' }"
    >
      <div class="dialog-grid">
        <div class="field">
          <label for="roleId">Role</label>
          <Select id="roleId" v-model="form.roleId" :options="roleOptions.filter((item) => item.value !== 'All')" optionLabel="label" optionValue="value" />
          <small v-if="formErrors.roleId" class="error-text">{{ formErrors.roleId }}</small>
        </div>

        <div class="field">
          <label for="programId">Program (Student only)</label>
          <Select
            id="programId"
            v-model="form.programId"
            :options="programOptions.filter((item) => item.value !== 'All')"
            optionLabel="label"
            optionValue="value"
            :disabled="!selectedRoleIsStudent"
            placeholder="Select a program"
          />
          <small v-if="formErrors.programId" class="error-text">{{ formErrors.programId }}</small>
        </div>

        <div class="field field-inline">
          <label for="isActive">Account Status</label>
          <div class="toggle-row">
            <ToggleSwitch id="isActive" v-model="form.isActive" />
            <span>{{ form.isActive ? 'Active' : 'Inactive' }}</span>
          </div>
        </div>
      </div>

      <template #footer>
        <Button label="Cancel" text @click="dialogVisible = false" />
        <Button label="Save Changes" :loading="saving" @click="handleSave" />
      </template>
    </Dialog>

    <footer>
      <Footer />
    </footer>
  </div>
</template>

<style scoped>
.users-page {
  background:
    radial-gradient(circle at 8% 0%, #ddf6e6 0%, rgba(221, 246, 230, 0) 35%),
    radial-gradient(circle at 90% 10%, #dfe9ff 0%, rgba(223, 233, 255, 0) 32%),
    linear-gradient(180deg, #edf4f1 0%, #f8fbfa 50%, #edf5f1 100%);
}

.hero-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.kicker {
  margin: 0;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #4a6a5a;
}

.headline {
  margin: 0.25rem 0 0;
  color: #17362b;
  font-size: clamp(1.2rem, 2.7vw, 2rem);
}

.support-text {
  margin: 0.6rem 0 0;
  color: #456254;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;
}

.label {
  margin: 0;
  color: #5a7466;
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 700;
}

.value {
  margin: 0.3rem 0 0;
  color: #163328;
  font-weight: 800;
  font-size: 1.35rem;
}

.filter-row {
  display: grid;
  grid-template-columns: 1.5fr 1fr 1fr 1fr;
  gap: 0.75rem;
}

.dialog-grid {
  display: grid;
  gap: 0.75rem;
}

.field {
  display: grid;
  gap: 0.35rem;
}

.field label {
  font-size: 0.85rem;
  font-weight: 700;
  color: #2f4c3f;
}

.field-inline {
  align-items: start;
}

.toggle-row {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
}

.error-text {
  color: #b91c1c;
  font-size: 0.75rem;
}

:deep(.hero-card.p-card),
:deep(.summary-card.p-card),
:deep(.filter-card.p-card),
:deep(.table-card.p-card) {
  border: 1px solid #d1dfd7;
  border-radius: 0.9rem;
  box-shadow: 0 10px 22px rgba(19, 52, 39, 0.06);
}

@media (max-width: 1100px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }

  .filter-row {
    grid-template-columns: 1fr;
  }
}
</style>
