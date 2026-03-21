<script setup>
import { computed, onMounted, ref } from 'vue'
import Card from 'primevue/card'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Calendar from 'primevue/calendar'
import Tag from 'primevue/tag'
import ToggleSwitch from 'primevue/toggleswitch'
import NavbarCoordinator from '@/components/NavbarCoordinator.vue'
import Footer from '@/components/Footer.vue'
import {
  getCoordinatorTasks,
  getCoordinatorTerms,
  toggleCoordinatorTaskLock,
} from '@/services/advisoryService'

const loading = ref(false)
const allTaskRows = ref([])
const academicTerms = ref([])
const query = ref('')
const selectedYear = ref('')
const selectedTermNo = ref(null)
const togglingTaskIds = ref(new Set())

const showCreateDialog = ref(false)
const creating = ref(false)
const createForm = ref({
  taskName: '',
  description: '',
  dueDate: '',
  termYear: null,
  termNo: null,
  autoLockAfterDueDate: false,
})
const showEditDialog = ref(false)
const editing = ref(false)
const editForm = ref({
  taskId: null,
  taskName: '',
  description: '',
  dueDate: '',
  termYear: null,
  termNo: null,
  autoLockAfterDueDate: false,
})

const formatDbTerm = (academicYear, termNo) => {
  const year = String(academicYear || '').trim() || 'unknown-year'
  const term = termNo === null || termNo === undefined || termNo === '' ? 'unknown' : String(termNo)
  return `${year}-term-${term}`
}

const termLabel = (academicYear, termNo) => {
  if (!academicYear && !termNo) return 'Unspecified Term'
  if (!termNo) return `${academicYear || 'Unspecified Year'}`
  return `${academicYear || 'Unspecified Year'} - Term ${termNo}`
}

const formatDateTime = (value) => {
  if (!value) return 'N/A'
  return new Date(value).toLocaleString('en-PH', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const isValidAcademicYear = (value) => {
  const match = String(value || '')
    .trim()
    .match(/^(\d{4})-(\d{4})$/)
  if (!match) return false
  return Number(match[2]) === Number(match[1]) + 1
}

const isValidTermNo = (value) => {
  const num = Number(value)
  return Number.isInteger(num) && num >= 1 && num <= 3
}

const academicYearPattern = '^\\d{4}-\\d{4}$'

const getDefaultAcademicYear = () => {
  const candidates = new Set(
    academicTerms.value
      .map((t) => String(t.academicYear || '').trim())
      .filter((v) => isValidAcademicYear(v)),
  )

  if (candidates.size === 0) {
    const year = new Date().getFullYear()
    return `${year}-${year + 1}`
  }

  const sorted = Array.from(candidates).sort((a, b) => {
    const aStart = Number(a.split('-')[0])
    const bStart = Number(b.split('-')[0])
    return bStart - aStart
  })

  return sorted[0]
}

const getDefaultTermNo = () => {
  // Prefer term 1 by default
  return 1
}

const filteredRows = computed(() => {
  const q = query.value.trim().toLowerCase()

  return allTaskRows.value.filter((row) => {
    const matchesQuery =
      !q ||
      [row.taskName, row.description, row.programCodes.join(' ')]
        .join(' ')
        .toLowerCase()
        .includes(q)

    const yearFilter = String(selectedYear.value || '').trim()
    const matchesYear =
      !yearFilter || (isValidAcademicYear(yearFilter) && String(row.academicYear) === yearFilter)

    const termFilter = selectedTermNo.value
    const matchesTermNo =
      termFilter === null ||
      termFilter === '' ||
      (isValidTermNo(termFilter) &&
        row.termNo !== null &&
        row.termNo !== undefined &&
        Number(row.termNo) === Number(termFilter))

    return matchesQuery && matchesYear && matchesTermNo
  })
})

const resetFilters = () => {
  query.value = ''
  selectedYear.value = ''
  selectedTermNo.value = null
}

const openCreateTask = () => {
  createForm.value = {
    taskName: '',
    description: '',
    dueDate: '',
    termYear: getDefaultAcademicYear(),
    termNo: getDefaultTermNo(),
    autoLockAfterDueDate: false,
  }
  showCreateDialog.value = true
}

const createTaskLocally = async () => {
  if (creating.value) return

  const taskName = String(createForm.value.taskName || '').trim()
  if (!taskName) {
    alert('Task name is required.')
    return
  }

  const selectedYear = createForm.value.termYear
  const selectedTermNo = createForm.value.termNo

  if (!isValidAcademicYear(selectedYear)) {
    alert('Academic year must be in format YYYY-YYYY and the second year must follow the first.')
    return
  }

  if (!isValidTermNo(selectedTermNo)) {
    alert('Term number must be a number between 1 and 3.')
    return
  }

  const termNoNumber = Number(selectedTermNo)
  const nowIso = new Date().toISOString()

  creating.value = true
  try {
    allTaskRows.value = [
      {
        taskId: `draft-${Date.now()}`,
        taskName,
        description: String(createForm.value.description || '').trim() || 'No description',
        term: termLabel(selectedYear, termNoNumber),
        termKey: formatDbTerm(selectedYear, termNoNumber),
        termId: null,
        academicYear: selectedYear || null,
        termNo: termNoNumber,
        dueDate: createForm.value.dueDate || null,
        autoLockAfterDueDate: createForm.value.autoLockAfterDueDate === true,
        createdAt: nowIso,
        latestSubmissionAt: null,
        submissionCount: 0,
        programCodes: [],
        isDraft: true,
      },
      ...allTaskRows.value,
    ]

    showCreateDialog.value = false
  } finally {
    creating.value = false
  }
}

const openEditTask = (row) => {
  editForm.value = {
    taskId: row.taskId,
    taskName: row.taskName || '',
    description: row.description || '',
    dueDate: row.dueDate || '',
    termYear: row.academicYear || null,
    termNo: row.termNo || null,
    autoLockAfterDueDate: row.autoLockAfterDueDate === true,
  }
  showEditDialog.value = true
}

const saveTaskLocally = async () => {
  if (editing.value) return

  const taskName = String(editForm.value.taskName || '').trim()
  if (!taskName) {
    alert('Task name is required.')
    return
  }

  const selectedYear = editForm.value.termYear
  const selectedTermNo = editForm.value.termNo

  if (!isValidAcademicYear(selectedYear)) {
    alert('Academic year must be in format YYYY-YYYY and follow sequential years.')
    return
  }

  if (!isValidTermNo(selectedTermNo)) {
    alert('Term number must be an integer between 1 and 3.')
    return
  }

  const termNoNumber = Number(selectedTermNo)

  editing.value = true
  try {
    allTaskRows.value = allTaskRows.value.map((row) => {
      if (row.taskId !== editForm.value.taskId) return row

      return {
        ...row,
        taskName,
        description: String(editForm.value.description || '').trim() || 'No description',
        dueDate: editForm.value.dueDate || null,
        term: termLabel(selectedYear, termNoNumber),
        termKey: formatDbTerm(selectedYear, termNoNumber),
        termId: row.termId || null,
        academicYear: selectedYear || row.academicYear,
        termNo: termNoNumber,
        autoLockAfterDueDate: editForm.value.autoLockAfterDueDate === true,
      }
    })

    showEditDialog.value = false
  } finally {
    editing.value = false
  }
}

const deleteTaskLocally = (row) => {
  const ok = confirm(`Delete task "${row.taskName || 'Untitled Task'}"?`)
  if (!ok) return

  allTaskRows.value = allTaskRows.value.filter((item) => item.taskId !== row.taskId)
}

const toggleTaskLock = async (row) => {
  const taskId = Number(row.taskId)
  if (!Number.isInteger(taskId) || taskId <= 0) return

  const pending = new Set(togglingTaskIds.value)
  pending.add(taskId)
  togglingTaskIds.value = pending

  try {
    const updated = await toggleCoordinatorTaskLock(taskId)
    if (!updated) return

    allTaskRows.value = allTaskRows.value.map((item) =>
      Number(item.taskId) === taskId
        ? {
            ...item,
            isLocked: updated.isLocked === true,
          }
        : item,
    )
  } catch (error) {
    console.error('Failed to toggle task lock', error)
    alert('Failed to update task lock status.')
  } finally {
    const next = new Set(togglingTaskIds.value)
    next.delete(taskId)
    togglingTaskIds.value = next
  }
}

const loadTaskRows = async () => {
  loading.value = true
  try {
    const [taskData, termData] = await Promise.all([getCoordinatorTasks(), getCoordinatorTerms()])
    const rows = Array.isArray(taskData) ? taskData : []
    academicTerms.value = Array.isArray(termData) ? termData : []

    allTaskRows.value = rows
      .map((item) => ({
        taskId: item.taskId,
        taskName: item.taskName || 'Untitled Task',
        description: item.description || 'No description',
        term: termLabel(item.academicYear, item.termNo),
        termKey: formatDbTerm(item.academicYear, item.termNo),
        termId: item.termId || null,
        academicYear: item.academicYear || null,
        termNo: item.termNo || null,
        dueDate: item.dueDate || null,
        isLocked: item.isLocked === true,
        autoLockAfterDueDate: item.autoLockAfterDueDate === true,
        createdAt: item.createdAt || null,
        latestSubmissionAt: item.latestSubmissionAt || null,
        submissionCount: Number(item.submissionCount || 0),
        programCodes: Array.isArray(item.programCodes)
          ? item.programCodes.filter(Boolean).sort((a, b) => a.localeCompare(b))
          : [],
        isDraft: false,
      }))
      .sort((a, b) => {
        const aMs = a.latestSubmissionAt ? new Date(a.latestSubmissionAt).getTime() : 0
        const bMs = b.latestSubmissionAt ? new Date(b.latestSubmissionAt).getTime() : 0
        return bMs - aMs
      })
  } catch (error) {
    console.error('Failed to load coordinator tasks', error)
    allTaskRows.value = []
  } finally {
    loading.value = false
  }
}

onMounted(loadTaskRows)
</script>

<template>
  <div class="coordinator-tasks-page min-h-screen flex flex-col font-Karla">
    <header>
      <NavbarCoordinator />
    </header>

    <main class="mx-auto w-full max-w-7xl flex-1 px-4 pb-8 pt-24 sm:px-6 sm:pt-28 lg:pt-32">
      <Card class="hero-card">
        <template #content>
          <div class="hero-row">
            <div>
              <p class="kicker">Task Management</p>
              <h1 class="headline">Manage Tasks</h1>
              <p class="support-text">
                Review existing task activity and create new task entries for upcoming milestones.
              </p>
            </div>
            <div class="hero-actions">
              <Tag :value="`${filteredRows.length} task(s)`" severity="success" rounded />
              <Button label="Create Task" @click="openCreateTask" />
            </div>
          </div>
        </template>
      </Card>

      <Card class="filter-card mt-4">
        <template #content>
          <div class="filter-grid">
            <InputText v-model="query" placeholder="Search task" />
            <div class="term-filters">
              <InputText
                v-model="selectedYear"
                placeholder="YYYY-YYYY"
                :pattern="academicYearPattern"
                class="w-full"
              />
              <InputText
                v-model.number="selectedTermNo"
                type="number"
                min="1"
                max="3"
                placeholder="Term #"
                class="w-full"
              />
            </div>
            <Button label="Reset" severity="secondary" outlined @click="resetFilters" />
          </div>
        </template>
      </Card>

      <Card class="table-card mt-4">
        <template #content>
          <DataTable
            v-if="filteredRows.length || loading"
            :value="filteredRows"
            :loading="loading"
            paginator
            :rows="10"
            :rowsPerPageOptions="[10, 20, 50]"
            stripedRows
            size="small"
            responsiveLayout="scroll"
          >
            <Column field="taskName" header="Task" sortable />
            <Column field="description" header="Description" />
            <Column field="term" header="Term" sortable />
            <Column field="dueDate" header="Due Date">
              <template #body="slotProps">
                {{ formatDateTime(slotProps.data.dueDate) }}
              </template>
            </Column>
            <Column field="submissionCount" header="Submissions" sortable />
            <Column field="latestSubmissionAt" header="Latest Submission">
              <template #body="slotProps">
                {{ formatDateTime(slotProps.data.latestSubmissionAt) }}
              </template>
            </Column>
            <Column header="Actions" :exportable="false" style="min-width: 15rem">
              <template #body="slotProps">
                <div class="table-actions">
                  <Button
                    label="Edit"
                    severity="secondary"
                    size="small"
                    outlined
                    @click="openEditTask(slotProps.data)"
                  />
                  <Button
                    label="Delete"
                    severity="danger"
                    size="small"
                    text
                    @click="deleteTaskLocally(slotProps.data)"
                  />
                  <Button
                    :label="slotProps.data.isLocked ? 'Unlock' : 'Lock'"
                    :severity="slotProps.data.isLocked ? 'success' : 'warning'"
                    size="small"
                    outlined
                    :loading="togglingTaskIds.has(Number(slotProps.data.taskId))"
                    @click="toggleTaskLock(slotProps.data)"
                  />
                </div>
              </template>
            </Column>
          </DataTable>

          <div v-else class="empty-state">
            <h3>No tasks found</h3>
            <p>Try changing filters or create a new task.</p>
            <Button label="Create Task" @click="openCreateTask" />
          </div>
        </template>
      </Card>
    </main>

    <Dialog
      v-model:visible="showCreateDialog"
      modal
      :closable="true"
      :dismissableMask="true"
      header="Create Task"
      :style="{ width: 'min(96vw, 36rem)' }"
    >
      <div class="create-form-grid">
        <div>
          <label class="form-label">Task Name</label>
          <InputText
            v-model="createForm.taskName"
            class="w-full"
            placeholder="e.g., Chapter 1 Manuscript"
          />
        </div>

        <div>
          <label class="form-label">Academic Year</label>
          <InputText
            v-model="createForm.termYear"
            placeholder="YYYY-YYYY"
            :pattern="academicYearPattern"
            class="w-full"
          />
        </div>

        <div>
          <label class="form-label">Term #</label>
          <InputText
            v-model.number="createForm.termNo"
            type="number"
            min="1"
            max="3"
            class="w-full"
            placeholder="e.g. 1"
          />
        </div>

        <div>
          <label class="form-label">Due Date</label>
          <Calendar
            v-model="createForm.dueDate"
            show-time
            hour-format="12"
            date-format="yy-mm-dd"
            class="w-full"
            placeholder="Select date and time"
          />
        </div>

        <div>
          <label class="form-label">Description</label>
          <textarea
            v-model="createForm.description"
            rows="4"
            class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            placeholder="Optional description"
          ></textarea>
        </div>

        <div class="toggle-row">
          <label class="form-label mb-0">Auto-lock after due date</label>
          <div class="autolock-cell">
            <ToggleSwitch v-model="createForm.autoLockAfterDueDate" />
            <span class="autolock-label">{{
              createForm.autoLockAfterDueDate ? 'Enabled' : 'Disabled'
            }}</span>
          </div>
        </div>

        <div class="create-actions">
          <Button label="Cancel" severity="secondary" outlined @click="showCreateDialog = false" />
          <Button label="Create Task" :loading="creating" @click="createTaskLocally" />
        </div>
      </div>
    </Dialog>

    <Dialog
      v-model:visible="showEditDialog"
      modal
      :closable="true"
      :dismissableMask="true"
      header="Edit Task"
      :style="{ width: 'min(96vw, 36rem)' }"
    >
      <div class="create-form-grid">
        <div>
          <label class="form-label">Task Name</label>
          <InputText
            v-model="editForm.taskName"
            class="w-full"
            placeholder="e.g., Chapter 1 Manuscript"
          />
        </div>

        <div>
          <label class="form-label">Academic Year</label>
          <InputText
            v-model="editForm.termYear"
            placeholder="YYYY-YYYY"
            :pattern="academicYearPattern"
            class="w-full"
          />
        </div>

        <div>
          <label class="form-label">Term #</label>
          <InputText
            v-model.number="editForm.termNo"
            type="number"
            min="1"
            max="3"
            class="w-full"
            placeholder="e.g. 1"
          />
        </div>

        <div>
          <label class="form-label">Due Date</label>
          <Calendar
            v-model="editForm.dueDate"
            show-time
            hour-format="12"
            date-format="yy-mm-dd"
            class="w-full"
            placeholder="Select date and time"
          />
        </div>

        <div>
          <label class="form-label">Description</label>
          <textarea
            v-model="editForm.description"
            rows="4"
            class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            placeholder="Optional description"
          ></textarea>
        </div>

        <div class="toggle-row">
          <label class="form-label mb-0">Auto-lock after due date</label>
          <div class="autolock-cell">
            <ToggleSwitch v-model="editForm.autoLockAfterDueDate" />
            <span class="autolock-label">{{
              editForm.autoLockAfterDueDate ? 'Enabled' : 'Disabled'
            }}</span>
          </div>
        </div>

        <div class="create-actions">
          <Button label="Cancel" severity="secondary" outlined @click="showEditDialog = false" />
          <Button label="Save Changes" :loading="editing" @click="saveTaskLocally" />
        </div>
      </div>
    </Dialog>

    <footer>
      <Footer />
    </footer>
  </div>
</template>

<style scoped>
.coordinator-tasks-page {
  background:
    radial-gradient(circle at 8% 0%, #ddf6e6 0%, rgba(221, 246, 230, 0) 35%),
    radial-gradient(circle at 90% 12%, #e8edf9 0%, rgba(232, 237, 249, 0) 34%),
    linear-gradient(180deg, #edf4f1 0%, #f8fbfa 45%, #ebf4ef 100%);
}

.hero-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.hero-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
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

.filter-grid {
  display: grid;
  grid-template-columns: 2fr 1.2fr auto;
  gap: 0.75rem;
}

.term-filters {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}

:deep(.hero-card.p-card),
:deep(.filter-card.p-card),
:deep(.table-card.p-card) {
  border: 1px solid #d1dfd7;
  border-radius: 0.9rem;
  box-shadow: 0 10px 22px rgba(19, 52, 39, 0.06);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  min-height: 220px;
  text-align: center;
}

.empty-state h3 {
  margin: 0;
  color: #17362b;
}

.empty-state p {
  margin: 0;
  color: #456254;
}

.create-form-grid {
  display: grid;
  gap: 0.9rem;
}

.form-label {
  display: block;
  margin-bottom: 0.35rem;
  font-size: 0.82rem;
  font-weight: 700;
  color: #355347;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.create-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.6rem;
}

.table-actions {
  display: flex;
  gap: 0.4rem;
  align-items: center;
}

.autolock-cell {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.autolock-label {
  font-size: 0.78rem;
  color: #355347;
}

.toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
}

@media (max-width: 960px) {
  .hero-row {
    flex-direction: column;
  }

  .filter-grid {
    grid-template-columns: 1fr;
  }
}
</style>
