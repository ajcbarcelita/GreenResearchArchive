<script setup>
import { onMounted, ref, watch } from 'vue'
import Card from 'primevue/card'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import DatePicker from 'primevue/datepicker'
import Tag from 'primevue/tag'
import Button from 'primevue/button'
import Footer from '@/components/Footer.vue'
import NavbarAdmin from '@/components/NavbarAdmin.vue'
import { getAuditLogs } from '@/services/auditLogService'

const loading = ref(false)
const rows = ref([])
const summary = ref({
  totalLogs: 0,
  logsToday: 0,
  uniqueActors: 0,
  mostCommonTransition: null,
  mostCommonTransitionCount: 0,
})

const query = ref('')
const selectedProgram = ref('All')
const selectedOldStatus = ref('All')
const selectedNewStatus = ref('All')
const selectedActor = ref('All')
const selectedDateFrom = ref(null)
const selectedDateTo = ref(null)

const filterPrograms = ref(['All'])
const filterOldStatuses = ref(['All'])
const filterNewStatuses = ref(['All'])
const filterActors = ref([{ label: 'All', value: 'All' }])

const clearFilters = () => {
  query.value = ''
  selectedProgram.value = 'All'
  selectedOldStatus.value = 'All'
  selectedNewStatus.value = 'All'
  selectedActor.value = 'All'
  selectedDateFrom.value = null
  selectedDateTo.value = null
}

const getIsoDate = (value) => {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString().slice(0, 10)
}

const loadData = async ({ includeFilterOptions = false } = {}) => {
  loading.value = true
  try {
    const params = {}
    if (query.value.trim()) params.q = query.value.trim()
    if (selectedProgram.value !== 'All') params.programCode = selectedProgram.value
    if (selectedOldStatus.value !== 'All') params.oldStatus = selectedOldStatus.value
    if (selectedNewStatus.value !== 'All') params.newStatus = selectedNewStatus.value
    if (selectedActor.value !== 'All') params.changedBy = selectedActor.value
    if (selectedDateFrom.value) params.dateFrom = getIsoDate(selectedDateFrom.value)
    if (selectedDateTo.value) params.dateTo = getIsoDate(selectedDateTo.value)

    const response = await getAuditLogs(params)
    rows.value = response.rows || []
    summary.value = {
      totalLogs: response.summary?.totalLogs || 0,
      logsToday: response.summary?.logsToday || 0,
      uniqueActors: response.summary?.uniqueActors || 0,
      mostCommonTransition: response.summary?.mostCommonTransition || null,
      mostCommonTransitionCount: response.summary?.mostCommonTransitionCount || 0,
    }

    if (includeFilterOptions) {
      filterPrograms.value = ['All', ...(response.filters?.programs || [])]
      filterOldStatuses.value = ['All', ...(response.filters?.oldStatuses || [])]
      filterNewStatuses.value = ['All', ...(response.filters?.newStatuses || [])]
      filterActors.value = [
        { label: 'All', value: 'All' },
        ...((response.filters?.actors || []).map((actor) => ({
          label: `${actor.actorName} (${actor.actorEmail})`,
          value: actor.actorId,
        }))),
      ]
    }
  } catch (error) {
    console.error('Failed to load audit logs', error)
    rows.value = []
  } finally {
    loading.value = false
  }
}

const statusSeverity = (status) => {
  if (!status) return 'secondary'
  if (status === 'Approved') return 'success'
  if (status === 'Revision Requested') return 'warn'
  if (status === 'Under Review') return 'info'
  if (status === 'Archived') return 'contrast'
  return 'secondary'
}

let filterDebounceTimer = null

watch(
  [query, selectedProgram, selectedOldStatus, selectedNewStatus, selectedActor, selectedDateFrom, selectedDateTo],
  () => {
    if (filterDebounceTimer) clearTimeout(filterDebounceTimer)
    filterDebounceTimer = setTimeout(() => loadData(), 250)
  },
)

onMounted(() => loadData({ includeFilterOptions: true }))

onMounted(() => {
  document.title = "Submission Logs | Green Archive"
})
</script>

<template>
  <div class="audit-logs-page min-h-screen flex flex-col font-Karla">
    <header>
      <NavbarAdmin />
    </header>

    <main class="mx-auto w-full max-w-7xl flex-1 px-4 pb-8 pt-24 sm:px-6 sm:pt-28 lg:pt-32">
      <Card class="hero-card">
        <template #content>
          <div class="hero-row">
            <div>
              <p class="kicker">Audit Logs</p>
              <h1 class="headline">Submission Change History</h1>
              <p class="support-text">Track status transitions, actors, and remarks across submission lifecycle events.</p>
            </div>
            <Button label="Refresh" icon="pi pi-refresh" outlined :loading="loading" @click="loadData" />
          </div>
        </template>
      </Card>

      <section class="summary-grid mt-4">
        <Card class="summary-card"><template #content><p class="label">Total Logs</p><p class="value">{{ summary.totalLogs }}</p></template></Card>
        <Card class="summary-card"><template #content><p class="label">Logs Today</p><p class="value">{{ summary.logsToday }}</p></template></Card>
        <Card class="summary-card"><template #content><p class="label">Unique Actors</p><p class="value">{{ summary.uniqueActors }}</p></template></Card>
        <Card class="summary-card"><template #content><p class="label">Top Transition</p><p class="value compact">{{ summary.mostCommonTransition || 'N/A' }}</p></template></Card>
      </section>

      <Card class="filter-card mt-4">
        <template #content>
          <div class="filter-grid">
            <InputText v-model="query" placeholder="Search by remarks, group, or actor" />
            <Select v-model="selectedActor" :options="filterActors" optionLabel="label" optionValue="value" placeholder="Actor" />
            <Select v-model="selectedProgram" :options="filterPrograms" placeholder="Program" />
            <Select v-model="selectedOldStatus" :options="filterOldStatuses" placeholder="Old status" />
            <Select v-model="selectedNewStatus" :options="filterNewStatuses" placeholder="New status" />
            <DatePicker v-model="selectedDateFrom" dateFormat="yy-mm-dd" placeholder="From date" />
            <DatePicker v-model="selectedDateTo" dateFormat="yy-mm-dd" placeholder="To date" />
            <Button label="Reset" severity="secondary" outlined @click="clearFilters" />
          </div>
        </template>
      </Card>

      <Card class="table-card mt-4">
        <template #content>
          <DataTable
            :value="rows"
            :loading="loading"
            paginator
            :rows="10"
            :rowsPerPageOptions="[10, 20, 50]"
            stripedRows
            size="small"
            responsiveLayout="scroll"
          >
            <Column field="changedAt" header="Changed At" sortable />
            <Column field="submissionId" header="Submission ID" sortable />
            <Column field="groupName" header="Group" sortable />
            <Column field="programCode" header="Program" sortable />
            <Column field="actorName" header="Changed By" sortable />
            <Column header="Transition">
              <template #body="slotProps">
                <div class="status-stack">
                  <Tag :value="slotProps.data.oldStatus || 'None'" :severity="statusSeverity(slotProps.data.oldStatus)" />
                  <span class="arrow">to</span>
                  <Tag :value="slotProps.data.newStatus || 'None'" :severity="statusSeverity(slotProps.data.newStatus)" />
                </div>
              </template>
            </Column>
            <Column field="remarks" header="Remarks" />
          </DataTable>
        </template>
      </Card>
    </main>

    <footer>
      <Footer />
    </footer>
  </div>
</template>

<style scoped>
.audit-logs-page {
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

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
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

.value.compact {
  font-size: 1rem;
  line-height: 1.4;
}

.filter-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.75rem;
}

.status-stack {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

.arrow {
  font-size: 0.8rem;
  color: #486457;
  text-transform: uppercase;
  font-weight: 700;
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
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .filter-grid {
    grid-template-columns: 1fr;
  }
}
</style>
