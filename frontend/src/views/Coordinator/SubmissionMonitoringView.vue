<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import Card from 'primevue/card'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import SelectButton from 'primevue/selectbutton'
import Toast from 'primevue/toast'
import { useToast } from 'primevue/usetoast'
import Tag from 'primevue/tag'
import Button from 'primevue/button'
import Footer from '@/components/Footer.vue'
import NavbarFaculty from '@/components/NavbarFaculty.vue'
import NavbarCoordinator from '@/components/NavbarCoordinator.vue'
import { getStoredUser } from '../../services/authService'
import { listRepository, toggleSubmissionArchiveStatus } from '@/services/repositoryService'

const router = useRouter()
const user = ref(getStoredUser())
const isFaculty = computed(
  () =>
    String(user.value?.roleName || '')
      .trim()
      .toLowerCase() === 'faculty',
)

const loading = ref(false)
const allSubmissions = ref([])
const query = ref('')
const selectedTask = ref('All')
const selectedTerm = ref('All')
const versionMode = ref('latest')
const archivingSubmissionId = ref(null)
const toast = useToast()

const versionModeOptions = [
  { label: 'Latest Version Only', value: 'latest' },
  { label: 'All Versions', value: 'all' },
]

const termLabel = (academicYear, termNo) => {
  if (!academicYear && !termNo) return 'Unspecified Term'
  if (!termNo) return `${academicYear || 'Unspecified Year'}`
  return `${academicYear || 'Unspecified Year'} - Term ${termNo}`
}

const taskOptions = computed(() => {
  const unique = Array.from(
    new Set(allSubmissions.value.map((item) => item.taskName).filter(Boolean)),
  ).sort((a, b) => a.localeCompare(b))
  return ['All', ...unique]
})

const termOptions = computed(() => {
  const unique = Array.from(
    new Set(allSubmissions.value.map((item) => termLabel(item.academicYear, item.termNo))),
  ).sort((a, b) => a.localeCompare(b))
  return ['All', ...unique]
})

const statusSeverity = (status) => {
  if (status === 'Approved') return 'success'
  if (status === 'Revision Requested') return 'warn'
  if (status === 'Under Review') return 'info'
  if (status === 'Submitted') return 'contrast'
  if (status === 'Archived') return 'secondary'
  return 'secondary'
}

const statusClass = (status) => {
  if (status === 'Approved') return 'status-chip status-approved'
  if (status === 'Revision Requested') return 'status-chip status-revision'
  if (status === 'Under Review') return 'status-chip status-review'
  if (status === 'Submitted') return 'status-chip status-submitted'
  if (status === 'Archived') return 'status-chip status-archived'
  return 'status-chip status-default'
}

const actionClass = (status) => {
  if (status === 'Archived') return 'archive-btn unarchive-btn'
  return 'archive-btn archive-active-btn'
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

const latestOnlyRows = computed(() => {
  const map = new Map()

  for (const item of allSubmissions.value) {
    const key = `${item.groupId || 'na'}::${item.taskId || 'na'}`
    const existing = map.get(key)

    if (!existing || Number(item.versionNo || 0) > Number(existing.versionNo || 0)) {
      map.set(key, item)
    }
  }

  return Array.from(map.values())
})

const sourceRows = computed(() => {
  return versionMode.value === 'all' ? allSubmissions.value : latestOnlyRows.value
})

const filteredRows = computed(() => {
  const q = query.value.trim().toLowerCase()

  return sourceRows.value.filter((item) => {
    const matchesQuery =
      !q ||
      [item.title, item.groupName, item.taskName, item.programCode, ...(item.keywords || [])]
        .join(' ')
        .toLowerCase()
        .includes(q)

    const matchesTask = selectedTask.value === 'All' || item.taskName === selectedTask.value
    const matchesTerm =
      selectedTerm.value === 'All' ||
      termLabel(item.academicYear, item.termNo) === selectedTerm.value

    return matchesQuery && matchesTask && matchesTerm
  })
})

const loadSubmissions = async () => {
  loading.value = true
  try {
    const data = await listRepository()
    allSubmissions.value = Array.isArray(data)
      ? data
          .map((item) => ({
            ...item,
            term: termLabel(item.academicYear, item.termNo),
          }))
          .sort((a, b) => {
            const aTime = a.submittedAt ? new Date(a.submittedAt).getTime() : 0
            const bTime = b.submittedAt ? new Date(b.submittedAt).getTime() : 0
            if (aTime !== bTime) return bTime - aTime
            return Number(b.versionNo || 0) - Number(a.versionNo || 0)
          })
      : []
  } catch (error) {
    console.error('Failed to load monitoring submissions', error)
    allSubmissions.value = []
  } finally {
    loading.value = false
  }
}

const handleArchiveToggle = async (row) => {
  if (isFaculty.value) return
  if (!row?.submissionId || archivingSubmissionId.value) return

  archivingSubmissionId.value = row.submissionId
  try {
    const updated = await toggleSubmissionArchiveStatus(row.submissionId)
    if (!updated) return

    allSubmissions.value = allSubmissions.value.map((item) => {
      if (item.submissionId !== row.submissionId) return item

      return {
        ...item,
        status: updated.status,
        submittedAt: updated.submittedAt,
      }
    })

    if (updated.summaryGeneration?.queued) {
      toast.add({
        severity: 'info',
        summary: 'Archived',
        detail: 'Submission archived. Summary generation started in the background.',
        life: 4000
      })
    } else {
      toast.add({
        severity: 'success',
        summary: updated.status === 'Archived' ? 'Archived' : 'Unarchived',
        detail: 'Submission status updated successfully.',
        life: 3000
      })
    }
  } catch (error) {
    console.error('Failed to toggle archive status', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Could not update submission status. Please try again.',
      life: 4000
    })
  } finally {
    archivingSubmissionId.value = null
  }
}

const handleRowClick = ({ data }) => {
  const submissionId = Number(data?.submissionId)
  if (!Number.isInteger(submissionId) || submissionId <= 0) return

  router.push({
    name: isFaculty.value ? 'faculty-capstone-details' : 'coordinator-capstone-details',
    params: { id: submissionId },
    query: { source: 'monitoring' },
  })
}

const resetFilters = () => {
  query.value = ''
  selectedTask.value = 'All'
  selectedTerm.value = 'All'
  versionMode.value = 'latest'
}

onMounted(loadSubmissions)
</script>

<template>
  <div class="submission-monitoring-page min-h-screen flex flex-col font-Karla">
    <Toast />
    <header>
      <NavbarFaculty v-if="isFaculty" />
      <NavbarCoordinator v-else />
    </header>

    <main class="mx-auto w-full max-w-7xl flex-1 px-4 pb-8 pt-24 sm:px-6 sm:pt-28 lg:pt-32">
      <Card class="hero-card">
        <template #content>
          <div class="hero-row">
            <div>
              <p class="kicker">Submission Monitoring</p>
              <h1 class="headline">Track Submissions Across Tasks and Terms</h1>
              <p class="support-text">
                Filter by task, academic term, and version mode, then drill into submission status
                and history.
              </p>
            </div>
            <Tag :value="`${filteredRows.length} record(s)`" severity="success" rounded />
          </div>
        </template>
      </Card>

      <Card class="filter-card mt-4">
        <template #content>
          <div class="filter-grid">
            <InputText v-model="query" placeholder="Search title, group, task, program, keyword" />
            <Select v-model="selectedTask" :options="taskOptions" placeholder="Task" />
            <Select v-model="selectedTerm" :options="termOptions" placeholder="Academic Term" />
          </div>
          <div class="mt-3">
            <SelectButton
              v-model="versionMode"
              :options="versionModeOptions"
              optionLabel="label"
              optionValue="value"
              ariaLabelledby="versionMode"
            />
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
            @row-click="handleRowClick"
            class="monitoring-table"
          >
            <Column field="title" header="Title" sortable class="column-title" />
            <Column field="groupName" header="Group" sortable class="column-nowrap" />
            <Column field="taskName" header="Task" sortable class="column-nowrap" />
            <Column field="term" header="Term" sortable class="column-nowrap" />
            <Column field="programCode" header="Program" sortable class="column-nowrap" />
            <Column field="versionNo" header="Version" sortable class="column-nowrap text-center">
              <template #body="slotProps"> v{{ slotProps.data.versionNo || 'N/A' }} </template>
            </Column>
            <Column header="Status" sortable field="status" class="column-status">
              <template #body="slotProps">
                <Tag
                  :value="slotProps.data.status || 'Draft'"
                  :severity="statusSeverity(slotProps.data.status || 'Draft')"
                  :class="[
                    statusClass(slotProps.data.status || 'Draft'),
                    'm-0 w-full justify-center',
                  ]"
                />
              </template>
            </Column>
            <Column header="Submitted At" sortable field="submittedAt" class="column-nowrap">
              <template #body="slotProps">
                {{ formatDateTime(slotProps.data.submittedAt) }}
              </template>
            </Column>
            <Column v-if="!isFaculty" header="Action" class="column-nowrap">
              <template #body="slotProps">
                <Button
                  :label="slotProps.data.status === 'Archived' ? 'Unarchive' : 'Archive'"
                  :class="actionClass(slotProps.data.status)"
                  size="small"
                  :loading="archivingSubmissionId === slotProps.data.submissionId"
                  :disabled="Boolean(archivingSubmissionId)"
                  @click.stop="handleArchiveToggle(slotProps.data)"
                />
              </template>
            </Column>
          </DataTable>

          <div v-else class="empty-state">
            <h3>No submissions found</h3>
            <p>Try adjusting your search query or task/term filters.</p>
            <Button label="Reset Filters" severity="secondary" @click="resetFilters" />
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
.submission-monitoring-page {
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
  grid-template-columns: 2fr 1fr 1fr;
  gap: 0.75rem;
}

:deep(.hero-card.p-card),
:deep(.filter-card.p-card),
:deep(.table-card.p-card) {
  border: 1px solid #d1dfd7;
  border-radius: 0.9rem;
  box-shadow: 0 10px 22px rgba(19, 52, 39, 0.06);
}

:deep(.monitoring-table.p-datatable) .p-datatable-tbody > tr > td.column-status {
  padding: 0.4rem 0.5rem !important;
}

:deep(.status-chip.p-tag) {
  border-radius: 999px;
  font-weight: 700;
  margin: 0 !important;
  display: flex;
  width: 100%;
  height: 1.8rem;
  justify-content: center;
  align-items: center;
}

:deep(.status-approved.p-tag) {
  background: #377352;
  color: #e9ecef;
}

:deep(.status-revision.p-tag) {
  background: #416153;
  color: #e9ecef;
}

:deep(.status-review.p-tag) {
  background: #22473c;
  color: #e9ecef;
}

:deep(.status-submitted.p-tag) {
  background: #ebeef1;
  color: #22473c;
}

:deep(.status-archived.p-tag) {
  background: #e9ecef;
  color: #22473c;
}

:deep(.status-default.p-tag) {
  background: #ebeef1;
  color: #22473c;
}

:deep(.archive-btn.p-button) {
  border-radius: 0.55rem;
  font-weight: 700;
}

:deep(.archive-active-btn.p-button) {
  background: #377352;
  border-color: #377352;
  color: #e9ecef;
}

:deep(.archive-active-btn.p-button:hover) {
  background: #416153;
  border-color: #416153;
}

:deep(.unarchive-btn.p-button) {
  background: #ebeef1;
  border-color: #d3d8de;
  color: #22473c;
}

:deep(.unarchive-btn.p-button:hover) {
  background: #e9ecef;
  border-color: #c8cfd6;
}

:deep(.monitoring-table.p-datatable) {
  font-size: 0.825rem;
}

:deep(.monitoring-table.p-datatable) .p-datatable-tbody > tr > td {
  padding: 0.6rem 0.75rem;
}

:deep(.monitoring-table.p-datatable) .p-datatable-thead > tr > th {
  padding: 0.6rem 0.75rem;
  white-space: nowrap;
}

:deep(.column-nowrap) {
  white-space: nowrap !important;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 150px; /* Prevents long Group or Task names from pushing the table out */
}

:deep(.column-title) {
  min-width: 120px;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  min-height: 260px;
  text-align: center;
}

.empty-state h3 {
  margin: 0;
  font-size: 1.1rem;
  color: #17362b;
}

.empty-state p {
  margin: 0 0 0.5rem;
  color: #456254;
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
