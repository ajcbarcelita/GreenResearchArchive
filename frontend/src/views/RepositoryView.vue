<script setup>
import { computed, ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Chip from 'primevue/chip'
import InputText from 'primevue/inputtext'
import Paginator from 'primevue/paginator'
import Select from 'primevue/select'
import Tag from 'primevue/tag'
import Navbar from '@/components/Navbar.vue'
import NavbarFaculty from '@/components/NavbarFaculty.vue'
import NavbarCoordinator from '@/components/NavbarCoordinator.vue'
import Footer from '@/components/Footer.vue'
import { getDegreePrograms, getStoredUser } from '../services/authService'

const user = ref(getStoredUser())
const route = useRoute()

const useCoordinatorNavbar = computed(() => {
  const normalizedRoleName = String(user.value?.roleName || '')
    .trim()
    .toLowerCase()
  return normalizedRoleName === 'coordinator'
})

const useFacultyNavbar = computed(() => {
  const normalizedRoleName = String(user.value?.roleName || '')
    .trim()
    .toLowerCase()
  return normalizedRoleName === 'faculty'
})

const normalizedRoleName = computed(() =>
  String(user.value?.roleName || '')
    .trim()
    .toLowerCase(),
)

const searchValue = ref('')
const selectedProgram = ref('All')
const selectedTerm = ref('All')
const selectedSort = ref('submitted_desc')
const pageStart = ref(0)
const pageSize = ref(6)

const programOptions = ref(['All'])

const sortOptions = [
  { label: 'Newest Submitted', value: 'submitted_desc' },
  { label: 'Oldest Submitted', value: 'submitted_asc' },
  { label: 'Newest Created', value: 'created_desc' },
  { label: 'A-Z Title', value: 'title_asc' },
]

import { listRepository } from '@/services/repositoryService'

const repositoryItems = ref([])
const loading = ref(false)

const applySearchQueryFromRoute = () => {
  const rawQuery = route.query?.q
  const normalizedQuery = Array.isArray(rawQuery)
    ? String(rawQuery[0] || '').trim()
    : String(rawQuery || '').trim()

  searchValue.value = normalizedQuery
  pageStart.value = 0
}

onMounted(async () => {
  applySearchQueryFromRoute()

  loading.value = true
  try {
    const [repositoryData, programsResponse] = await Promise.all([
      listRepository({ status: 'Archived' }),
      getDegreePrograms(),
    ])

    const databaseProgramCodes = (programsResponse?.programs || [])
      .map((program) => String(program?.program_code || '').trim())
      .filter(Boolean)

    const uniqueCodes = Array.from(new Set(databaseProgramCodes)).sort((a, b) => a.localeCompare(b))

    programOptions.value = ['All', ...uniqueCodes]

    const data = Array.isArray(repositoryData) ? repositoryData : []
    repositoryItems.value = data

    // Fallback: if programs endpoint is empty, derive options from loaded repository rows.
    if (uniqueCodes.length === 0) {
      const repositoryCodes = Array.from(
        new Set(data.map((item) => String(item?.programCode || '').trim()).filter(Boolean)),
      ).sort((a, b) => a.localeCompare(b))

      programOptions.value = ['All', ...repositoryCodes]
    }

    if (!programOptions.value.includes(selectedProgram.value)) {
      selectedProgram.value = 'All'
    }
  } catch (e) {
    console.error('Failed to load repository items', e)
    repositoryItems.value = []
    programOptions.value = ['All']
  } finally {
    loading.value = false
  }
})

watch(
  () => route.query?.q,
  () => {
    applySearchQueryFromRoute()
  },
)

const filteredItems = computed(() => {
  const keyword = searchValue.value.trim().toLowerCase()

  let output = repositoryItems.value.filter((item) => {
    const searchTarget = [item.title, item.abstract, ...(item.keywords || [])]
      .join(' ')
      .toLowerCase()

    const matchesKeyword = !keyword || searchTarget.includes(keyword)
    const matchesProgram =
      selectedProgram.value === 'All' || item.programCode === selectedProgram.value
    const matchesTerm =
      selectedTerm.value === 'All' ||
      formatDbTerm(item.academicYear, item.termNo) === selectedTerm.value

    return matchesKeyword && matchesProgram && matchesTerm
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
  if (selectedProgram.value !== 'All') pills.push(`Program: ${selectedProgram.value}`)
  if (selectedTerm.value !== 'All') pills.push(`Term: ${selectedTerm.value}`)
  if (searchValue.value.trim()) pills.push(`Query: ${searchValue.value.trim()}`)
  return pills
})

const formatDbTerm = (academicYear, termNo) => {
  const year = String(academicYear || '').trim() || 'unknown-year'
  const term = termNo === null || termNo === undefined || termNo === '' ? 'unknown' : String(termNo)

  return `${year}-term-${term}`
}

const compareDbTerm = (a, b) => {
  const matchA = String(a).match(/^(\d{4})-(\d{4})-term-(\d+)$/)
  const matchB = String(b).match(/^(\d{4})-(\d{4})-term-(\d+)$/)

  if (!matchA || !matchB) return String(a).localeCompare(String(b))

  const startYearDiff = Number(matchA[1]) - Number(matchB[1])
  if (startYearDiff !== 0) return startYearDiff

  const endYearDiff = Number(matchA[2]) - Number(matchB[2])
  if (endYearDiff !== 0) return endYearDiff

  return Number(matchA[3]) - Number(matchB[3])
}

const termOptions = computed(() => {
  const values = Array.from(
    new Set(repositoryItems.value.map((item) => formatDbTerm(item?.academicYear, item?.termNo))),
  ).sort(compareDbTerm)

  return ['All', ...values]
})

const clearFilters = () => {
  searchValue.value = ''
  selectedProgram.value = 'All'
  selectedTerm.value = 'All'
  selectedSort.value = 'submitted_desc'
  pageStart.value = 0
}

const onPageChange = (event) => {
  pageStart.value = event.first
  pageSize.value = event.rows
}

const getCapstoneDetailsRoute = (submissionId) => {
  if (normalizedRoleName.value === 'faculty') {
    return { name: 'faculty-capstone-details', params: { id: submissionId } }
  }

  if (normalizedRoleName.value === 'coordinator') {
    return { name: 'coordinator-capstone-details', params: { id: submissionId } }
  }

  if (normalizedRoleName.value === 'admin') {
    return { name: 'admin-capstone-details', params: { id: submissionId } }
  }

  return { name: 'student-capstone-details', params: { id: submissionId } }
}

const formatSubmittedDateTime = (value) => {
  if (!value) return 'Not submitted'

  return new Date(value).toLocaleString('en-PH', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<template>
  <div class="repository-page min-h-screen flex flex-col font-Karla">
    <header>
      <NavbarFaculty v-if="useFacultyNavbar" />
      <NavbarCoordinator v-else-if="useCoordinatorNavbar" />
      <Navbar v-else />
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
              v-model="selectedTerm"
              :options="termOptions"
              placeholder="Filter term"
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
              <Tag
                :value="item.isLocked ? 'Locked' : 'Open'"
                :severity="item.isLocked ? 'secondary' : 'success'"
                rounded
              />
            </div>

            <h2 class="item-title">{{ item.title }}</h2>
            <p class="meta-line">
              {{ item.groupName }} · {{ item.programCode }} · Adviser: {{ item.adviserName }}
            </p>
            <p class="meta-line">
              By:
              {{ item.authors && item.authors.length ? item.authors.join(', ') : item.groupName }}
            </p>

            <p class="abstract-preview">{{ item.abstract }}</p>

            <div class="keyword-row">
              <Chip
                v-for="keyword in item.keywords"
                :key="`${item.submissionId}-${keyword}`"
                :label="keyword"
              />
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
                <p>{{ formatSubmittedDateTime(item.submittedAt) }}</p>
              </div>
              <div>
                <span class="meta-label">Files</span>
                <p>
                  {{ item.hasCapstonePaper ? 'Paper' : '-' }} /
                  {{ item.hasDataset ? 'Dataset' : '-' }}
                </p>
              </div>
            </div>

            <div class="action-row">
              <router-link :to="getCapstoneDetailsRoute(item.submissionId)">
                <Button label="View Details" />
              </router-link>
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
  border: 2px solid #d1d5db;
  border-radius: 0.75rem;
  box-shadow: 0 10px 15px rgba(2, 6, 23, 0.06);
  transition:
    border-color 200ms ease,
    box-shadow 200ms ease;
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
  margin: 0.25rem 0 0;
  color: #17362b;
  font-size: clamp(1.25rem, 2.8vw, 2rem);
  font-weight: 700;
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

:deep(.hero-card.p-card):hover,
:deep(.filter-card.p-card):hover,
:deep(.catalog-card.p-card):hover,
:deep(.empty-card.p-card):hover {
  border-color: #0e662e;
}
</style>
