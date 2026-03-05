<script setup>
import { computed, ref } from 'vue'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Chip from 'primevue/chip'
import InputText from 'primevue/inputtext'
import Paginator from 'primevue/paginator'
import Select from 'primevue/select'
import Tag from 'primevue/tag'
import Navbar from '@/components/Navbar.vue'
import Footer from '@/components/Footer.vue'

const searchValue = ref('')
const selectedStatus = ref('All')
const selectedProgram = ref('All')
const selectedSort = ref('submitted_desc')
const pageStart = ref(0)
const pageSize = ref(6)

const statusOptions = [
  'All',
  'Draft',
  'Submitted',
  'Under Review',
  'Revision Requested',
  'Approved',
  'Archived',
]

const programOptions = [
  'All',
  'BSIT',
  'BSCS',
  'BSIS',
]

const sortOptions = [
  { label: 'Newest Submitted', value: 'submitted_desc' },
  { label: 'Oldest Submitted', value: 'submitted_asc' },
  { label: 'Newest Created', value: 'created_desc' },
  { label: 'A-Z Title', value: 'title_asc' },
]

const repositoryItems = ref([
  {
    submissionId: 1224,
    title: 'Green Archive: A Capstone Repository Platform for DLSU CCS',
    abstract:
      'A searchable repository for capstone metadata, files, and review workflow to improve discoverability and governance.',
    keywords: ['repository', 'search', 'metadata'],
    status: 'Approved',
    versionNo: 4,
    groupName: 'GROUP-4',
    programCode: 'BSIT',
    adviserName: 'Prof. Maria Santos',
    submittedAt: '2026-03-01 18:21',
    createdAt: '2026-02-07 13:44',
    hasCapstonePaper: true,
    hasDataset: true,
    isLocked: true,
  },
  {
    submissionId: 1227,
    title: 'Predictive Faculty Consultation Scheduler using Queue Forecasting',
    abstract:
      'A forecasting-assisted scheduler that predicts consultation load and suggests optimal slots per adviser.',
    keywords: ['forecasting', 'scheduler', 'optimization'],
    status: 'Under Review',
    versionNo: 2,
    groupName: 'GROUP-2',
    programCode: 'BSCS',
    adviserName: 'Dr. Ramon Santos',
    submittedAt: '2026-03-04 10:03',
    createdAt: '2026-02-16 09:20',
    hasCapstonePaper: true,
    hasDataset: false,
    isLocked: false,
  },
  {
    submissionId: 1211,
    title: 'Barangay Incident Classifier with Explainable NLP',
    abstract:
      'An NLP-driven classifier with explainability outputs for local incident triage and monitoring.',
    keywords: ['nlp', 'classification', 'explainable-ai'],
    status: 'Revision Requested',
    versionNo: 3,
    groupName: 'GROUP-6',
    programCode: 'BSIT',
    adviserName: 'Prof. Louella Cruz',
    submittedAt: '2026-02-28 20:45',
    createdAt: '2026-02-10 11:10',
    hasCapstonePaper: true,
    hasDataset: true,
    isLocked: false,
  },
  {
    submissionId: 1208,
    title: 'Enrollment Fraud Pattern Detection using Hybrid Rules + ML',
    abstract:
      'Combines business rules and machine learning scoring to flag suspicious enrollment behaviors.',
    keywords: ['fraud-detection', 'ml', 'rules-engine'],
    status: 'Submitted',
    versionNo: 1,
    groupName: 'GROUP-3',
    programCode: 'BSIS',
    adviserName: 'Dr. Jaime Velasco',
    submittedAt: '2026-03-03 15:08',
    createdAt: '2026-02-20 09:35',
    hasCapstonePaper: true,
    hasDataset: false,
    isLocked: false,
  },
  {
    submissionId: 1199,
    title: 'Computer Vision Parking Occupancy Tracker for Campus Buildings',
    abstract:
      'Vision model for counting parking occupancy and exposing live availability dashboards for students.',
    keywords: ['computer-vision', 'iot', 'dashboard'],
    status: 'Archived',
    versionNo: 5,
    groupName: 'GROUP-8',
    programCode: 'BSCS',
    adviserName: 'Prof. Carla Mendoza',
    submittedAt: '2025-12-15 08:09',
    createdAt: '2025-10-11 14:47',
    hasCapstonePaper: true,
    hasDataset: true,
    isLocked: true,
  },
  {
    submissionId: 1216,
    title: 'Capstone Group Analytics Portal with Adviser Insights',
    abstract:
      'Analytics portal that surfaces review bottlenecks, status trends, and submission throughput.',
    keywords: ['analytics', 'kpi', 'portal'],
    status: 'Draft',
    versionNo: 1,
    groupName: 'GROUP-1',
    programCode: 'BSIS',
    adviserName: 'Prof. Anne Reyes',
    submittedAt: null,
    createdAt: '2026-03-02 16:02',
    hasCapstonePaper: false,
    hasDataset: false,
    isLocked: false,
  },
  {
    submissionId: 1231,
    title: 'Knowledge Graph Builder for Cross-Department Research Themes',
    abstract:
      'Maps concept relationships among projects to surface reusable methods and collaborators.',
    keywords: ['knowledge-graph', 'research', 'discovery'],
    status: 'Approved',
    versionNo: 2,
    groupName: 'GROUP-9',
    programCode: 'BSCS',
    adviserName: 'Dr. Emilio Tan',
    submittedAt: '2026-03-05 09:52',
    createdAt: '2026-02-26 12:22',
    hasCapstonePaper: true,
    hasDataset: true,
    isLocked: true,
  },
])

const statusSeverity = (status) => {
  if (status === 'Approved') return 'success'
  if (status === 'Revision Requested') return 'warn'
  if (status === 'Archived') return 'secondary'
  if (status === 'Draft') return 'contrast'
  return 'info'
}

const filteredItems = computed(() => {
  const keyword = searchValue.value.trim().toLowerCase()

  let output = repositoryItems.value.filter((item) => {
    const searchTarget = [item.title, item.abstract, ...(item.keywords || [])]
      .join(' ')
      .toLowerCase()

    const matchesKeyword = !keyword || searchTarget.includes(keyword)
    const matchesStatus = selectedStatus.value === 'All' || item.status === selectedStatus.value
    const matchesProgram = selectedProgram.value === 'All' || item.programCode === selectedProgram.value

    return matchesKeyword && matchesStatus && matchesProgram
  })

  output = [...output].sort((a, b) => {
    const submittedA = a.submittedAt ? new Date(a.submittedAt).getTime() : 0
    const submittedB = b.submittedAt ? new Date(b.submittedAt).getTime() : 0
    const createdA = new Date(a.createdAt).getTime()
    const createdB = new Date(b.createdAt).getTime()

    if (selectedSort.value === 'submitted_asc') return submittedA - submittedB
    if (selectedSort.value === 'created_desc') return createdB - createdA
    if (selectedSort.value === 'title_asc') return a.title.localeCompare(b.title)
    return submittedB - submittedA
  })

  return output
})

const pagedItems = computed(() => {
  const start = pageStart.value
  const end = start + pageSize.value
  return filteredItems.value.slice(start, end)
})

const activeFilterPills = computed(() => {
  const pills = []
  if (selectedStatus.value !== 'All') pills.push(`Status: ${selectedStatus.value}`)
  if (selectedProgram.value !== 'All') pills.push(`Program: ${selectedProgram.value}`)
  if (searchValue.value.trim()) pills.push(`Query: ${searchValue.value.trim()}`)
  return pills
})

const clearFilters = () => {
  searchValue.value = ''
  selectedStatus.value = 'All'
  selectedProgram.value = 'All'
  selectedSort.value = 'submitted_desc'
  pageStart.value = 0
}

const onPageChange = (event) => {
  pageStart.value = event.first
  pageSize.value = event.rows
}
</script>

<template>
  <div class="repository-page min-h-screen flex flex-col font-Karla">
    <header>
      <Navbar />
    </header>

    <main class="mx-auto w-full max-w-7xl flex-1 px-4 pb-8 pt-24 sm:px-6 sm:pt-28 lg:pt-32">
      <Card class="hero-card">
        <template #content>
          <div class="hero-content">
            <div>
              <p class="kicker">Repository Catalog</p>
              <h1 class="headline">Browse Capstone Submissions</h1>
              <p class="support-text">
                Search by title, abstract, and keywords, then filter by status and program.
              </p>
            </div>
            <Tag :value="`${filteredItems.length} Results`" severity="success" rounded />
          </div>
        </template>
      </Card>

      <Card class="filter-card mt-4">
        <template #content>
          <div class="filter-grid">
            <span class="p-input-icon-left">
              <i class="pi pi-search" />
              <InputText
                v-model="searchValue"
                class="w-full"
                placeholder="Search by title, abstract, or keyword"
                @input="pageStart = 0"
              />
            </span>

            <Select
              v-model="selectedStatus"
              :options="statusOptions"
              placeholder="Filter status"
              @change="pageStart = 0"
            />

            <Select
              v-model="selectedProgram"
              :options="programOptions"
              placeholder="Filter program"
              @change="pageStart = 0"
            />

            <Select
              v-model="selectedSort"
              :options="sortOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Sort by"
              @change="pageStart = 0"
            />
          </div>

          <div class="active-pills mt-3">
            <Chip v-for="pill in activeFilterPills" :key="pill" :label="pill" class="pill" />
            <Button
              v-if="activeFilterPills.length"
              label="Reset"
              severity="secondary"
              text
              @click="clearFilters"
            />
          </div>
        </template>
      </Card>

      <section class="catalog-grid mt-4">
        <Card v-for="item in pagedItems" :key="item.submissionId" class="catalog-card">
          <template #content>
            <div class="row-top">
              <Tag :value="item.status" :severity="statusSeverity(item.status)" rounded />
              <Tag :value="item.isLocked ? 'Locked' : 'Open'" :severity="item.isLocked ? 'secondary' : 'success'" rounded />
            </div>

            <h2 class="item-title">{{ item.title }}</h2>
            <p class="meta-line">{{ item.groupName }} · {{ item.programCode }} · Adviser: {{ item.adviserName }}</p>

            <p class="abstract-preview">{{ item.abstract }}</p>

            <div class="keyword-row">
              <Chip v-for="keyword in item.keywords" :key="`${item.submissionId}-${keyword}`" :label="keyword" />
            </div>

            <div class="meta-grid">
              <div>
                <span class="meta-label">Submission ID</span>
                <p>#{{ item.submissionId }}</p>
              </div>
              <div>
                <span class="meta-label">Version</span>
                <p>v{{ item.versionNo }}</p>
              </div>
              <div>
                <span class="meta-label">Submitted</span>
                <p>{{ item.submittedAt || 'Not submitted' }}</p>
              </div>
              <div>
                <span class="meta-label">Files</span>
                <p>{{ item.hasCapstonePaper ? 'Paper' : '-' }} / {{ item.hasDataset ? 'Dataset' : '-' }}</p>
              </div>
            </div>

            <div class="action-row">
              <Button label="View Details" />
            </div>
          </template>
        </Card>
      </section>

      <Card v-if="!pagedItems.length" class="empty-card mt-4">
        <template #content>
          <div class="empty-state">
            <h3>No submissions found</h3>
            <p>Adjust your search keywords or clear active filters.</p>
            <Button label="Clear filters" severity="secondary" @click="clearFilters" />
          </div>
        </template>
      </Card>

      <Paginator
        class="mt-4"
        :first="pageStart"
        :rows="pageSize"
        :rowsPerPageOptions="[6, 9, 12]"
        :totalRecords="filteredItems.length"
        @page="onPageChange"
      />
    </main>

    <footer>
      <Footer />
    </footer>
  </div>
</template>

<style scoped>
.repository-page {
  background:
    radial-gradient(circle at 10% 0%, #dff7e7 0%, rgba(223, 247, 231, 0) 35%),
    radial-gradient(circle at 85% 10%, #e4eef7 0%, rgba(228, 238, 247, 0) 36%),
    linear-gradient(180deg, #edf4f1 0%, #f8fbfa 45%, #ebf4ef 100%);
}

:deep(.hero-card.p-card),
:deep(.filter-card.p-card),
:deep(.catalog-card.p-card),
:deep(.empty-card.p-card) {
  border: 1px solid #d2e1da;
  border-radius: 1rem;
  box-shadow: 0 14px 28px rgba(19, 56, 41, 0.07);
}

.hero-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.kicker {
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.75rem;
  font-weight: 700;
  color: #4b6b5c;
}

.headline {
  margin: 0.35rem 0 0;
  font-size: clamp(1.35rem, 3.2vw, 2.1rem);
  line-height: 1.15;
  color: #183a2e;
}

.support-text {
  margin: 0.65rem 0 0;
  color: #456254;
}

.filter-grid {
  display: grid;
  grid-template-columns: 2.2fr 1fr 1fr 1fr;
  gap: 0.75rem;
}

.active-pills {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.catalog-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.9rem;
}

.row-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.6rem;
}

.item-title {
  margin: 0.8rem 0 0;
  font-size: 1.12rem;
  line-height: 1.3;
  color: #17372b;
}

.meta-line {
  margin: 0.5rem 0 0;
  color: #496758;
  font-size: 0.9rem;
}

.abstract-preview {
  margin: 0.75rem 0 0;
  color: #314f42;
  line-height: 1.45;
  display: -webkit-box;
  line-clamp: 3;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.keyword-row {
  margin-top: 0.75rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.meta-grid {
  margin-top: 0.9rem;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
}

.meta-label {
  display: block;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #5b7669;
  font-weight: 700;
}

.meta-grid p {
  margin: 0.2rem 0 0;
  color: #203f32;
  font-size: 0.92rem;
}

.action-row {
  margin-top: 1rem;
  display: flex;
  gap: 0.6rem;
}

.empty-state {
  text-align: center;
  padding: 0.75rem 0;
}

.empty-state h3 {
  margin: 0;
  color: #17382c;
}

.empty-state p {
  margin: 0.45rem 0 1rem;
  color: #4d695c;
}

@media (max-width: 1040px) {
  .filter-grid {
    grid-template-columns: 1fr 1fr;
  }

  .catalog-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .hero-content {
    flex-direction: column;
  }

  .filter-grid {
    grid-template-columns: 1fr;
  }

  .action-row {
    flex-direction: column;
  }

  .action-row :deep(.p-button) {
    width: 100%;
  }
}
</style>
