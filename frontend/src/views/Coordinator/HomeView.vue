<script setup>
import { ref, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import Card from 'primevue/card'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import ProgressBar from 'primevue/progressbar'
import Chart from 'primevue/chart'
import Toast from 'primevue/toast'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  BarController,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import Footer from '@/components/Footer.vue'
import NavbarCoordinator from '@/components/NavbarCoordinator.vue'
import {
  getAnalyticsData,
  getKeywordPopularity,
  getResearchTrends,
  getAdviserWorkload,
  getRepositoryHealth,
  getPerformanceIndicators,
} from '@/services/coordinatorService'

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, BarController, Title, Tooltip, Legend)

const toast = useToast()
const loading = ref(false)
const analytics = ref({})
const keywords = ref([])
const trends = ref([])
const adviserWorkload = ref([])
const repoHealth = ref({})
const performanceIndicators = ref([])

// Chart data
const keywordChartData = ref({})
const adviserChartData = ref({})
const statusChartData = ref({})

// Label customization for performance indicators
const indicatorLabels = {
  total_submissions: 'Total Submissions',
  archived_submissions: 'Archived',
  active_groups: 'Active Groups',
  total_users: 'Total Users',
  faculty_count: 'Faculty',
  avg_group_size: 'Avg Group Size',
}

const getIndicatorLabel = (metric) => {
  return indicatorLabels[metric] || metric.replace('_', ' ')
}

const loadAnalytics = async () => {
  loading.value = true
  try {
    const [analyticsData, keywordData, trendData, workloadData, healthData, indicatorsData] =
      await Promise.all([
        getAnalyticsData(),
        getKeywordPopularity(),
        getResearchTrends(),
        getAdviserWorkload(),
        getRepositoryHealth(),
        getPerformanceIndicators(),
      ])

    analytics.value = analyticsData
    keywords.value = keywordData
    trends.value = trendData
    adviserWorkload.value = workloadData
    repoHealth.value = healthData
    performanceIndicators.value = indicatorsData

    // Prepare chart data
    prepareKeywordChart()
    prepareAdviserChart()
  } catch (error) {
    console.error('Error loading analytics:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load analytics data',
      life: 3000,
    })
  } finally {
    loading.value = false
  }
}

const prepareKeywordChart = () => {
  const topKeywords = keywords.value.slice(0, 8)
  keywordChartData.value = {
    labels: topKeywords.map((k) => k.keyword),
    datasets: [
      {
        label: 'Frequency',
        data: topKeywords.map((k) => k.frequency),
        backgroundColor: '#17362b',
        borderColor: '#17362b',
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  }
}

const keywordChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        stepSize: 1,
        callback: function (value) {
          return Number.isInteger(value) ? value : ''
        },
      },
    },
  },
}

const prepareAdviserChart = () => {
  const activeAdvisers = adviserWorkload.value
    .filter((a) => Number(a.group_count) > 0)
    .sort((a, b) => b.group_count - a.group_count)

  const topAdvisers = activeAdvisers.slice(0, 5)
  adviserChartData.value = {
    labels: topAdvisers.map((a) => a.adviser_name.split(' ')[0]), // First name only for space
    datasets: [
      {
        label: 'Groups',
        data: topAdvisers.map((a) => Number(a.group_count)),
        backgroundColor: '#355347',
        borderColor: '#355347',
        borderWidth: 1,
      },
    ],
  }
}

const filteredAdvisers = () => {
  return adviserWorkload.value
    .filter((a) => Number(a.group_count) > 0)
    .sort((a, b) => b.group_count - a.group_count)
}

const formatNumber = (num) => {
  return new Intl.NumberFormat().format(num)
}

const formatPercentage = (value, total) => {
  if (!total) return '0%'
  return Math.round((value / total) * 100) + '%'
}

onMounted(() => {
  loadAnalytics()
})
</script>

<template>
  <div class="min-h-screen flex flex-col bg-linear-to-b from-[#eaf4ee] to-[#f8fbf9] font-Karla">
    <header>
      <NavbarCoordinator />
    </header>

    <main class="flex-1 px-4 pt-24 sm:px-6 sm:pt-28 lg:pt-32">
      <div class="w-full max-w-7xl mx-auto">
        <div class="mb-8">
          <h1 class="text-3xl font-extrabold text-[#17362b]">Coordinator Dashboard</h1>
          <p class="mt-3 text-[#355347]">
            Comprehensive analytics and insights for program management.
          </p>
        </div>

        <!-- Performance Indicators -->
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div
            v-if="performanceIndicators.length === 0 && !loading"
            class="col-span-full text-center py-8 text-[#355347]"
          >
            <p class="text-sm">No performance data available</p>
          </div>
          <Card
            v-for="indicator in performanceIndicators"
            :key="indicator.metric"
            class="shadow-sm rounded-2xl border border-[#cfe0d6] bg-white hover:shadow-md transition-shadow min-h-32 flex items-center justify-center"
          >
            <template #content>
              <div class="text-center w-full py-4">
                <div class="text-4xl font-bold text-[#17362b] mb-2">
                  {{ formatNumber(indicator.value) }}
                </div>
                <div
                  class="text-[1.0rem] font-medium text-[#355347] uppercase tracking-tight leading-tight"
                >
                  {{ getIndicatorLabel(indicator.metric) }}
                </div>
              </div>
            </template>
          </Card>
        </div>

        <!-- Repository Health -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card class="shadow-sm rounded-2xl border border-[#cfe0d6] bg-white">
            <template #title>
              <h3 class="text-lg font-semibold text-[#17362b]">Repository Health</h3>
            </template>
            <template #content>
              <div class="space-y-4">
                <div class="flex justify-between items-center">
                  <span class="text-[#355347]">Total Archived</span>
                  <span class="font-semibold">{{
                    formatNumber(repoHealth.total_archived || 0)
                  }}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-[#355347]">Recent Archives (6 months)</span>
                  <span class="font-semibold">{{
                    formatNumber(repoHealth.recent_archives || 0)
                  }}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-[#355347]">Avg. Completion Time</span>
                  <span class="font-semibold"
                    >{{ Math.round(repoHealth.avg_completion_days || 0) }} days</span
                  >
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-[#355347]">Well-tagged Submissions</span>
                  <span class="font-semibold">{{
                    formatPercentage(repoHealth.well_tagged_submissions, repoHealth.total_archived)
                  }}</span>
                </div>
                <ProgressBar
                  :value="
                    repoHealth.total_archived
                      ? (repoHealth.well_tagged_submissions / repoHealth.total_archived) * 100
                      : 0
                  "
                  class="mt-4"
                  :showValue="false"
                />
              </div>
            </template>
          </Card>

          <!-- Keyword Popularity Chart -->
          <Card class="shadow-sm rounded-2xl border border-[#cfe0d6] bg-white">
            <template #title>
              <h3 class="text-lg font-semibold text-[#17362b]">Popular Keywords</h3>
            </template>
            <template #content>
              <div v-if="keywords.length === 0 && !loading" class="text-center py-8 text-[#355347]">
                <p class="text-sm">No keyword data available</p>
              </div>
              <Chart
                v-else
                type="bar"
                :data="keywordChartData"
                :options="keywordChartOptions"
                class="h-40"
              />
            </template>
          </Card>
        </div>

        <!-- Research Trends and Adviser Workload -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <!-- Research Trends -->
          <Card class="shadow-sm rounded-2xl border border-[#cfe0d6] bg-white max-h-96">
            <template #title>
              <h3 class="text-lg font-semibold text-[#17362b]">Topic Trends</h3>
            </template>
            <template #content>
              <div v-if="trends.length === 0 && !loading" class="text-center py-8 text-[#355347]">
                <p class="text-sm">No research trend data available</p>
              </div>
              <div v-else class="overflow-y-auto" style="max-height: 300px">
                <DataTable
                  :value="trends.slice(0, 10)"
                  :loading="loading"
                  class="p-datatable-sm"
                  :scrollable="false"
                >
                  <Column field="field_name" header="Research Field" sortable />
                  <Column field="submission_count" header="Submissions" sortable>
                    <template #body="slotProps">
                      <Tag :value="slotProps.data.submission_count" severity="info" />
                    </template>
                  </Column>
                </DataTable>
              </div>
            </template>
          </Card>

          <!-- Adviser Workload -->
          <Card class="shadow-sm rounded-2xl border border-[#cfe0d6] bg-white max-h-96">
            <template #title>
              <h3 class="text-lg font-semibold text-[#17362b]">Adviser Workload</h3>
            </template>
            <template #content>
              <div
                v-if="adviserWorkload.length === 0 && !loading"
                class="text-center py-8 text-[#355347]"
              >
                <p class="text-sm">No adviser workload data available</p>
              </div>
              <div v-else class="mb-4">
                <Chart
                  type="bar"
                  :data="adviserChartData"
                  :options="{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false },
                    },
                    scales: {
                      x: {
                        beginAtZero: true,
                        ticks: {
                          stepSize: 1,
                          callback: function (value) {
                            return Number.isInteger(value) ? value : ''
                          },
                        },
                      },
                      y: { beginAtZero: true },
                    },
                    indexAxis: 'y',
                  }"
                  class="h-40"
                />
              </div>
              <div class="overflow-y-auto" style="max-height: 240px;">
                <DataTable
                  v-if="filteredAdvisers().length > 0"
                  :value="filteredAdvisers()"
                  :loading="loading"
                  class="p-datatable-sm"
                  scrollHeight="200px"
                >
                <Column field="adviser_name" header="Adviser" sortable />
                <Column field="group_count" header="Groups" sortable />
                <Column field="student_count" header="Students" sortable />
                <Column field="approved_count" header="Approved" sortable />
              </DataTable>
              </div>
            </template>
          </Card>
        </div>
      </div>
    </main>

    <footer>
      <Footer />
    </footer>
    <Toast />
  </div>
</template>
