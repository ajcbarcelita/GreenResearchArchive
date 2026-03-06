<script setup>
import { onMounted, ref, watch } from 'vue'
import Card from 'primevue/card'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Tag from 'primevue/tag'
import Button from 'primevue/button'
import NavbarFaculty from '@/components/NavbarFaculty.vue'
import NavbarCoordinator from '@/components/NavbarCoordinator.vue'
import Footer from '@/components/Footer.vue'
import { getAdvisoryLoad } from '@/services/advisoryService'
import { getStoredUser } from '../../services/authService'

const user = ref(getStoredUser())
const isFaculty = computed(
  () => String(user.value?.roleName || '').trim().toLowerCase() === 'faculty',
)

const loading = ref(false)
const rows = ref([])
const summary = ref({
  totalAdvisers: 0,
  totalGroups: 0,
  activeGroups: 0,
  groupsWithoutSubmission: 0,
  groupsNeedingAttention: 0,
})

const query = ref('')
const selectedProgram = ref('All')
const selectedStatus = ref('All')
const selectedAdviser = ref('All')

const programOptions = ref(['All'])
const statusOptions = ref(['All'])
const adviserOptions = ref([{ label: 'All', value: 'All' }])

const clearFilters = () => {
  query.value = ''
  selectedProgram.value = 'All'
  selectedStatus.value = 'All'
  selectedAdviser.value = 'All'
}

const loadData = async ({ includeFilterOptions = false } = {}) => {
  loading.value = true
  try {
    const params = {}
    if (query.value.trim()) params.q = query.value.trim()
    if (selectedProgram.value !== 'All') params.programCode = selectedProgram.value
    if (selectedStatus.value !== 'All') params.status = selectedStatus.value
    if (selectedAdviser.value !== 'All') params.adviserId = selectedAdviser.value

    const response = await getAdvisoryLoad(params)
    rows.value = response.rows || []
    summary.value = {
      totalAdvisers: response.summary?.totalAdvisers || 0,
      totalGroups: response.summary?.totalGroups || 0,
      activeGroups: response.summary?.activeGroups || 0,
      groupsWithoutSubmission: response.summary?.groupsWithoutSubmission || 0,
      groupsNeedingAttention: response.summary?.groupsNeedingAttention || 0,
    }

    if (includeFilterOptions) {
      const programs = response.filters?.programs || []
      const statuses = response.filters?.statuses || []
      const advisers = response.filters?.advisers || []

      programOptions.value = ['All', ...programs]
      statusOptions.value = ['All', ...statuses]
      adviserOptions.value = [
        { label: 'All', value: 'All' },
        ...advisers.map((adviser) => ({
          label: adviser.adviserName,
          value: adviser.adviserId,
        })),
      ]
    }
  } catch (error) {
    console.error('Failed to load advisory data', error)
    rows.value = []
  } finally {
    loading.value = false
  }
}

const statusSeverity = (status) => {
  if (!status || status === 'No Submission') return 'secondary'
  if (status === 'Approved') return 'success'
  if (status === 'Revision Requested') return 'warn'
  if (status === 'Under Review') return 'info'
  if (status === 'Archived') return 'contrast'
  return 'secondary'
}

let filterDebounceTimer = null

watch([query, selectedProgram, selectedStatus, selectedAdviser], () => {
  if (filterDebounceTimer) {
    clearTimeout(filterDebounceTimer)
  }

  filterDebounceTimer = setTimeout(() => {
    loadData()
  }, 250)
})

onMounted(() => loadData({ includeFilterOptions: true }))
</script>

<template>
  <div class="advisory-page min-h-screen flex flex-col font-Karla">
    <header>
      <NavbarFaculty v-if="isFaculty" />
      <NavbarCoordinator v-else />
    </header>

    <main class="mx-auto w-full max-w-7xl flex-1 px-4 pb-8 pt-24 sm:px-6 sm:pt-28 lg:pt-32">
      <Card class="hero-card">
        <template #content>
          <div class="hero-row">
            <div>
              <p class="kicker">Advisory Load</p>
              <h1 class="headline">Faculty and Coordinator Advisory Matrix</h1>
              <p class="support-text">Track adviser assignments, group count, and latest submission health per group.</p>
            </div>
            <Button label="Refresh" icon="pi pi-refresh" outlined :loading="loading" @click="loadData" />
          </div>
        </template>
      </Card>

      <section class="summary-grid mt-4">
        <Card class="summary-card"><template #content><p class="label">Total Advisers</p><p class="value">{{ summary.totalAdvisers }}</p></template></Card>
        <Card class="summary-card"><template #content><p class="label">Total Groups</p><p class="value">{{ summary.totalGroups }}</p></template></Card>
        <Card class="summary-card"><template #content><p class="label">Active Groups</p><p class="value">{{ summary.activeGroups }}</p></template></Card>
        <Card class="summary-card"><template #content><p class="label">No Submission</p><p class="value">{{ summary.groupsWithoutSubmission }}</p></template></Card>
        <Card class="summary-card"><template #content><p class="label">Need Attention</p><p class="value">{{ summary.groupsNeedingAttention }}</p></template></Card>
      </section>

      <Card class="filter-card mt-4">
        <template #content>
          <div class="filter-grid">
            <InputText v-model="query" placeholder="Search adviser, group, program, status" />
            <Select v-model="selectedAdviser" :options="adviserOptions" optionLabel="label" optionValue="value" placeholder="Adviser" />
            <Select v-model="selectedProgram" :options="programOptions" placeholder="Program" />
            <Select v-model="selectedStatus" :options="statusOptions" placeholder="Submission status" />
            <Button label="Reset" severity="secondary" outlined @click="clearFilters" />
          </div>
        </template>
      </Card>

      <Card class="mt-4 table-card">
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
            <Column field="adviserName" header="Adviser" sortable />
            <Column field="adviserRole" header="Role" sortable />
            <Column field="groupName" header="Group" sortable />
            <Column field="programCode" header="Program" sortable />
            <Column field="memberCount" header="Members" sortable />
            <Column header="Group Active">
              <template #body="slotProps">
                <Tag :value="slotProps.data.groupIsActive ? 'Active' : 'Inactive'" :severity="slotProps.data.groupIsActive ? 'success' : 'secondary'" />
              </template>
            </Column>
            <Column header="Submission Status">
              <template #body="slotProps">
                <Tag
                  :value="slotProps.data.latestSubmissionStatus || 'No Submission'"
                  :severity="statusSeverity(slotProps.data.latestSubmissionStatus || 'No Submission')"
                />
              </template>
            </Column>
            <Column field="latestVersionNo" header="Latest Version" sortable />
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
.advisory-page {
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
  grid-template-columns: repeat(5, minmax(0, 1fr));
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
  font-size: 1.45rem;
}

.filter-grid {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr auto;
  gap: 0.75rem;
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
