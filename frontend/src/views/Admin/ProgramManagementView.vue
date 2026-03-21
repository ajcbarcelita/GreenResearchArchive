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
import Toast from 'primevue/toast'
import { useToast } from 'primevue/usetoast'
import Footer from '@/components/Footer.vue'
import NavbarAdmin from '@/components/NavbarAdmin.vue'
import {
  createProgramAdmin,
  deleteProgramAdmin,
  listProgramsAdmin,
  updateProgramAdmin,
  restoreProgramAdmin,
} from '@/services/programManagementService'

const PROGRAM_LEVELS = ['Baccalaureate', "Master's", 'Doctorate']

const toast = useToast()
const loading = ref(false)
const saving = ref(false)
const deletingId = ref(null)
const programs = ref([])

const searchQuery = ref('')
const selectedLevel = ref('All')

const dialogVisible = ref(false)
const editMode = ref(false)
const activeProgramId = ref(null)

const selectedStatus = ref('All') // 'All', 'Active', 'Archived'
const statusOptions = ['All', 'Active', 'Archived']

const form = ref({
  programCode: '',
  programName: '',
  programLevel: PROGRAM_LEVELS[0],
})

const formErrors = ref({
  programCode: '',
  programName: '',
  programLevel: '',
})

const resetForm = () => {
  form.value = {
    programCode: '',
    programName: '',
    programLevel: PROGRAM_LEVELS[0],
  }
  formErrors.value = {
    programCode: '',
    programName: '',
    programLevel: '',
  }
}

const openCreateDialog = () => {
  editMode.value = false
  activeProgramId.value = null
  resetForm()
  dialogVisible.value = true
}

const openEditDialog = (program) => {
  editMode.value = true
  activeProgramId.value = program.programId
  form.value = {
    programCode: String(program.programCode || ''),
    programName: String(program.programName || ''),
    programLevel: String(program.programLevel || PROGRAM_LEVELS[0]),
  }
  formErrors.value = {
    programCode: '',
    programName: '',
    programLevel: '',
  }
  dialogVisible.value = true
}

const validateForm = () => {
  const errors = {
    programCode: '',
    programName: '',
    programLevel: '',
  }

  const code = String(form.value.programCode || '')
    .trim()
    .toUpperCase()
  const name = String(form.value.programName || '').trim()
  const level = String(form.value.programLevel || '').trim()

  if (!code) {
    errors.programCode = 'Program code is required.'
  } else if (code.length > 10) {
    errors.programCode = 'Program code must be at most 10 characters.'
  }

  if (!name) {
    errors.programName = 'Program name is required.'
  } else if (name.length > 100) {
    errors.programName = 'Program name must be at most 100 characters.'
  }

  if (!PROGRAM_LEVELS.includes(level)) {
    errors.programLevel = 'Program level is required.'
  }

  formErrors.value = errors
  return !errors.programCode && !errors.programName && !errors.programLevel
}

const loadPrograms = async () => {
  loading.value = true
  try {
    const params = {}
    const normalizedQuery = searchQuery.value.trim()
    if (normalizedQuery) params.q = normalizedQuery
    if (selectedLevel.value !== 'All') params.level = selectedLevel.value

    if (selectedStatus.value !== 'All') {
      params.status = selectedStatus.value.toLowerCase() // "active" | "archived"
    }

    programs.value = await listProgramsAdmin(params)
  } catch (error) {
    console.error('Failed to load programs', error)
    programs.value = []
    toast.add({
      severity: 'error',
      summary: 'Load failed',
      detail: error?.response?.data?.message || 'Unable to fetch programs.',
      life: 3000,
    })
  } finally {
    loading.value = false
  }
}

const handleSave = async () => {
  if (!validateForm()) return

  saving.value = true
  try {
    const payload = {
      programCode: String(form.value.programCode || '')
        .trim()
        .toUpperCase(),
      programName: String(form.value.programName || '').trim(),
      programLevel: String(form.value.programLevel || '').trim(),
    }

    if (editMode.value && activeProgramId.value) {
      await updateProgramAdmin(activeProgramId.value, payload)
      toast.add({
        severity: 'success',
        summary: 'Program updated',
        detail: 'Program details were updated successfully.',
        life: 2500,
      })
    } else {
      await createProgramAdmin(payload)
      toast.add({
        severity: 'success',
        summary: 'Program created',
        detail: 'Program was added successfully.',
        life: 2500,
      })
    }

    dialogVisible.value = false
    await loadPrograms()
  } catch (error) {
    console.error('Failed to save program', error)
    toast.add({
      severity: 'error',
      summary: 'Save failed',
      detail: error?.response?.data?.message || 'Unable to save program.',
      life: 3500,
    })
  } finally {
    saving.value = false
  }
}

const handleDelete = async (program) => {
  const confirmed = window.confirm(
    `Delete program ${program.programCode}? This action cannot be undone.`,
  )
  if (!confirmed) return

  deletingId.value = program.programId
  try {
    await deleteProgramAdmin(program.programId)
    toast.add({
      severity: 'success',
      summary: 'Program deleted',
      detail: `${program.programCode} was removed.`,
      life: 2500,
    })
    await loadPrograms()
  } catch (error) {
    console.error('Failed to delete program', error)
    toast.add({
      severity: 'error',
      summary: 'Delete failed',
      detail: error?.response?.data?.message || 'Unable to delete program.',
      life: 3500,
    })
  } finally {
    deletingId.value = null
  }
}

const handleRestore = async (program) => {
  const confirmed = window.confirm(`Restore program ${program.programCode}?`)
  if (!confirmed) return

  deletingId.value = program.programId
  try {
    await restoreProgramAdmin(program.programId) // 👈 new API call
    toast.add({
      severity: 'success',
      summary: 'Program restored',
      detail: `${program.programCode} is now active again.`,
      life: 2500,
    })
    await loadPrograms()
  } catch (error) {
    console.error('Failed to restore program', error)
    toast.add({
      severity: 'error',
      summary: 'Restore failed',
      detail: error?.response?.data?.message || 'Unable to restore program.',
      life: 3500,
    })
  } finally {
    deletingId.value = null
  }
}

const totals = computed(() => ({
  programCount: programs.value.length,
  studentCount: programs.value.reduce((sum, row) => sum + Number(row.studentsCount || 0), 0),
  groupCount: programs.value.reduce((sum, row) => sum + Number(row.groupsCount || 0), 0),
}))

const levelOptions = computed(() => ['All', ...PROGRAM_LEVELS])

let debounceTimer = null
watch([searchQuery, selectedLevel, selectedStatus], () => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    loadPrograms()
  }, 250)
})

onMounted(() => {
  document.title = 'Program Management | Green Archive'
  loadPrograms()
})
</script>

<template>
  <div class="program-page min-h-screen flex flex-col font-Karla">
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
              <h1 class="headline">Program Management</h1>
              <p class="support-text">
                Maintain degree programs and monitor their current usage across student records and
                capstone groups.
              </p>
            </div>
            <Button icon="pi pi-plus" label="New Program" @click="openCreateDialog" />
          </div>
        </template>
      </Card>

      <section class="summary-grid mt-4">
        <Card class="summary-card"
          ><template #content
            ><p class="label">Programs</p>
            <p class="value">{{ totals.programCount }}</p></template
          ></Card
        >
        <Card class="summary-card"
          ><template #content
            ><p class="label">Students Linked</p>
            <p class="value">{{ totals.studentCount }}</p></template
          ></Card
        >
        <Card class="summary-card"
          ><template #content
            ><p class="label">Groups Linked</p>
            <p class="value">{{ totals.groupCount }}</p></template
          ></Card
        >
      </section>

      <Card class="filter-card mt-4">
        <template #content>
          <div class="filter-row">
            <InputText
              class="search-input"
              v-model="searchQuery"
              placeholder="Search by code or name"
            />

            <Select
              class="filter-select"
              v-model="selectedLevel"
              :options="levelOptions"
              placeholder="Program level"
            />

            <Select
              class="filter-select"
              v-model="selectedStatus"
              :options="statusOptions"
              placeholder="Status"
            />

            <Button
              class="refresh-btn"
              icon="pi pi-refresh"
              label="Refresh"
              outlined
              :loading="loading"
              @click="loadPrograms"
            />
          </div>
        </template>
      </Card>

      <Card class="table-card mt-4">
        <template #content>
          <DataTable
            :value="programs"
            :loading="loading"
            paginator
            :rows="10"
            :rowsPerPageOptions="[10, 20, 50]"
            stripedRows
            size="small"
            responsiveLayout="scroll"
          >
            <Column field="programCode" header="Code" sortable />
            <Column field="programName" header="Program Name" sortable />
            <Column header="Level" sortable field="programLevel">
              <template #body="slotProps">
                <Tag :value="slotProps.data.programLevel" severity="info" />
              </template>
            </Column>
            <Column field="studentsCount" header="Students" sortable />
            <Column field="groupsCount" header="Groups" sortable />
            <Column header="Status">
              <template #body="slotProps">
                <Tag
                  :value="slotProps.data.isDeleted ? 'Archived' : 'Active'"
                  :severity="slotProps.data.isDeleted ? 'danger' : 'success'"
                />
              </template>
            </Column>
            <Column header="Actions">
              <template #body="slotProps">
                <div class="action-row">
                  <Button
                    size="small"
                    text
                    icon="pi pi-pencil"
                    label="Edit"
                    :disabled="slotProps.data.isDeleted"
                    @click="openEditDialog(slotProps.data)"
                  />

                  <!-- 👇 CONDITIONAL BUTTON -->
                  <Button
                    v-if="!slotProps.data.isDeleted"
                    size="small"
                    text
                    severity="danger"
                    icon="pi pi-trash"
                    label="Delete"
                    :loading="deletingId === slotProps.data.programId"
                    @click="handleDelete(slotProps.data)"
                  />

                  <Button
                    v-else
                    size="small"
                    text
                    severity="warning"
                    icon="pi pi-refresh"
                    label="Restore"
                    @click="handleRestore(slotProps.data)"
                  />
                </div>
              </template>
            </Column>
          </DataTable>
        </template>
      </Card>
    </main>

    <Dialog
      v-model:visible="dialogVisible"
      :header="editMode ? 'Edit Program' : 'Create Program'"
      modal
      :style="{ width: 'min(95vw, 34rem)' }"
    >
      <div class="dialog-grid">
        <div class="field">
          <label for="programCode">Program Code</label>
          <InputText id="programCode" v-model="form.programCode" maxlength="10" />
          <small v-if="formErrors.programCode" class="error-text">{{
            formErrors.programCode
          }}</small>
        </div>

        <div class="field">
          <label for="programName">Program Name</label>
          <InputText id="programName" v-model="form.programName" maxlength="100" />
          <small v-if="formErrors.programName" class="error-text">{{
            formErrors.programName
          }}</small>
        </div>

        <div class="field">
          <label for="programLevel">Program Level</label>
          <Select id="programLevel" v-model="form.programLevel" :options="PROGRAM_LEVELS" />
          <small v-if="formErrors.programLevel" class="error-text">{{
            formErrors.programLevel
          }}</small>
        </div>
      </div>

      <template #footer>
        <Button label="Cancel" text @click="dialogVisible = false" />
        <Button
          :label="editMode ? 'Save Changes' : 'Create Program'"
          :loading="saving"
          @click="handleSave"
        />
      </template>
    </Dialog>

    <footer>
      <Footer />
    </footer>
  </div>
</template>

<style scoped>
.program-page {
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
  display: flex;
  align-items: center;
  gap: 1rem; /* Adjust this to match the exact gap in your design */
  width: 100%;
}

.search-input {
  flex: 2;
  min-width: 0; /* Prevents overflow issues */
}

.filter-select {
  flex: 1;
  min-width: 0;
}

.refresh-btn {
  flex-shrink: 0; /* Ensures the button never gets squished */
}

.action-row {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
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

@media (max-width: 900px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }

  .filter-row {
    grid-template-columns: 1fr;
  }
}
</style>
