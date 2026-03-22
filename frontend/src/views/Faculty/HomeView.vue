<script setup>
import { ref, onMounted } from 'vue'
import Card from 'primevue/card'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Dialog from 'primevue/dialog'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Chart from 'primevue/chart'
import Footer from '@/components/Footer.vue'
import NavbarFaculty from '@/components/NavbarFaculty.vue'
import { getStoredUser } from '@/services/authService'
import { getAdvisoryLoad, getCoordinatorTasks } from '@/services/advisoryService'
import { getAuditLogs } from '@/services/auditLogService'

const user = getStoredUser()
const loading = ref(true)

// Dashboard Metrics (Single row of 6)
const dashboardMetrics = ref([
  {
    label: 'Active Advisees',
    value: 0,
    icon: 'pi-briefcase',
  },
  {
    label: 'Total Students',
    value: 0,
    icon: 'pi-users',
  },
  {
    label: 'Review Queue',
    value: 0,
    icon: 'pi-clock',
  },
  {
    label: 'Approved this Term',
    value: 0,
    icon: 'pi-check-circle',
  },
  {
    label: 'Completion Rate',
    value: '0%',
    icon: 'pi-percentage',
  },
  {
    label: 'No Submissions',
    value: 0,
    icon: 'pi-exclamation-circle',
  },
])

const recentNotifications = ref([])
const fullNotifications = ref([])
const advisoryGroups = ref([])
const fullAdvisoryGroups = ref([])
const upcomingTasks = ref([])
const phaseStats = ref({ draft: 0, review: 0, approved: 0, archived: 0, total: 0 })

// Chart Data & Config
const riskChartData = ref({ datasets: [] })
const riskChartOptions = ref({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (context) => {
          const group = context.raw.groupName
          const revs = context.raw.actualY
          const days = context.raw.actualX
          return `${group}: ${revs} revision${revs !== 1 ? 's' : ''}, ${days} day${days !== 1 ? 's' : ''} inactive`
        },
      },
    },
  },
  scales: {
    y: {
      title: {
        display: true,
        text: 'Revision Count',
        color: '#17362b',
        font: { size: 10, weight: 'bold' },
      },
      min: -0.5,
      max: 6,
      grid: { color: '#f0f0f0' },
      ticks: {
        stepSize: 1,
        precision: 0,
        font: { size: 9 },
        callback: (value) => {
          if (value >= 0 && value <= 5) return value
          if (value === 6) return '5+'
          return null
        },
      },
    },
    x: {
      title: {
        display: true,
        text: 'Days of Inactivity',
        color: '#17362b',
        font: { size: 10, weight: 'bold' },
      },
      min: -0.8,
      max: 16.5,
      grid: { color: '#f0f0f0' },
      ticks: {
        stepSize: 3,
        font: { size: 9 },
        callback: (value) => {
          if (value >= 0 && value <= 15) return value
          if (value === 18) return '15+'
          return null
        },
      },
    },
  },
})

// Dialog visibility
const showAllGroups = ref(false)
const showAllNotifications = ref(false)

const formatTimeAgo = (dateStr) => {
  if (!dateStr) return 'N/A'
  const date = new Date(dateStr)
  const now = new Date()
  const diffInSeconds = Math.floor((now - date) / 1000)

  if (diffInSeconds < 60) return 'just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  return date.toLocaleDateString()
}

const formatDeadline = (dateStr) => {
  if (!dateStr) return 'No Date'
  const date = new Date(dateStr)
  const now = new Date()
  const diffTime = date - now
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return 'Passed'
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Tomorrow'
  return `${diffDays} days left`
}

const getMockProgress = (status) => {
  switch (status) {
    case 'Archived':
      return 100
    case 'Approved':
      return 100
    case 'Under Review':
      return 75
    case 'Revision Requested':
      return 60
    case 'Submitted':
      return 40
    case 'Draft':
      return 20
    default:
      return 10
  }
}

const getStatusWeight = (status) => {
  switch (status) {
    case 'Archived':
      return 100
    case 'Approved':
      return 90
    case 'Under Review':
      return 75
    case 'Revision Requested':
      return 60
    case 'Submitted':
      return 40
    case 'Draft':
      return 20
    default:
      return 10
  }
}

const fetchData = async () => {
  loading.value = true
  try {
    const advisoryData = await getAdvisoryLoad({ adviserId: user?.id })
    const rows = advisoryData.rows || []

    const sortedRows = [...rows].sort((a, b) => {
      const weightA = getStatusWeight(a.latestSubmissionStatus)
      const weightB = getStatusWeight(b.latestSubmissionStatus)
      return weightB - weightA
    })

    fullAdvisoryGroups.value = sortedRows
    advisoryGroups.value = sortedRows // Show all, card will handle scrolling

    const stats = { draft: 0, review: 0, approved: 0, archived: 0, total: rows.length }
    rows.forEach((r) => {
      const s = r.latestSubmissionStatus
      if (!s || s === 'Draft') stats.draft++
      else if (s === 'Archived') stats.archived++
      else if (s === 'Approved') stats.approved++
      else stats.review++
    })
    phaseStats.value = stats

    const summary = advisoryData.summary || {}

    // Calculate dashboard metrics
    const totalStudents = rows.reduce((acc, r) => acc + (r.memberCount || 0), 0)
    const completionRate =
      rows.length > 0
        ? (((stats.approved + stats.archived) / stats.total) * 100).toFixed(0) + '%'
        : '0%'

    dashboardMetrics.value[0].value = summary.totalGroups || 0
    dashboardMetrics.value[1].value = totalStudents
    dashboardMetrics.value[2].value = summary.groupsNeedingAttention || 0
    dashboardMetrics.value[3].value = rows.filter(
      (r) => r.latestSubmissionStatus === 'Approved',
    ).length
    dashboardMetrics.value[4].value = completionRate
    dashboardMetrics.value[5].value = summary.groupsWithoutSubmission || 0

    const tasks = await getCoordinatorTasks()
    upcomingTasks.value = tasks
      .filter((t) => !t.isLocked && t.dueDate && new Date(t.dueDate) > new Date())
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, 3)

    const auditData = await getAuditLogs()
    const allLogs = auditData.rows || []
    const myGroupIds = new Set(rows.map((r) => r.groupId))
    const myLogs = allLogs.filter((log) => myGroupIds.has(log.groupId))

    fullNotifications.value = myLogs.map((log) => ({
      id: log.logId,
      title: log.newStatus ? `Status updated to ${log.newStatus}` : 'Submission Update',
      group: log.groupName,
      time: formatTimeAgo(log.changedAt),
      status: log.newStatus || log.currentStatus,
      date: new Date(log.changedAt).toLocaleString(),
    }))

    recentNotifications.value = fullNotifications.value // Show all, card will handle scrolling

    // Populate Risk Chart (Decision Support Matrix)
    const now = new Date()
    const riskPoints = rows.map((r) => {
      const lastAction = r.latestSubmittedAt
        ? new Date(r.latestSubmittedAt)
        : new Date(r.groupCreatedAt)
      const diffDays = Math.floor((now - lastAction) / (1000 * 60 * 60 * 24))
      const versionNo = r.latestVersionNo || 1
      const revisionCount = versionNo - 1

      const bubbleColor = '#a3b8af' // Light Green

      return {
        x: diffDays > 15 ? 15.5 : diffDays,
        y: revisionCount > 5 ? 5.5 : revisionCount,
        actualX: diffDays,
        actualY: revisionCount,
        r: 8,
        groupName: r.groupName,
        backgroundColor: bubbleColor,
        borderColor: bubbleColor,
        hoverBackgroundColor: bubbleColor,
      }
    })

    riskChartData.value = {
      datasets: [
        {
          label: 'Capstone Groups',
          data: riskPoints,
          backgroundColor: '#a3b8af',
          borderColor: '#355347',
          borderWidth: 1,
          hoverBackgroundColor: '#355347',
        },
      ],
    }
  } catch (error) {
    console.error('Failed to fetch faculty dashboard data:', error)
  } finally {
    loading.value = false
  }
}

onMounted(fetchData)
</script>

<template>
  <div class="min-h-screen flex flex-col bg-linear-to-b from-[#eaf4ee] to-[#f8fbf9] font-Karla">
    <header class="flex-none">
      <NavbarFaculty />
    </header>

    <main class="flex-1 px-4 pt-20 pb-8 sm:px-6 lg:pt-24 flex flex-col">
      <div class="max-w-7xl mx-auto w-full space-y-4">
        <!-- Welcome Header -->
        <section class="flex-none">
          <h1 class="text-2xl font-extrabold text-[#17362b]">Faculty Dashboard</h1>
          <p class="text-sm text-[#355347]">
            Welcome back, {{ user?.firstName || 'Faculty' }}! Here's your workload snapshot.
          </p>
        </section>

        <!-- Metrics Row -->
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 flex-none">
          <Card
            v-for="metric in dashboardMetrics"
            :key="metric.label"
            class="metric-card shadow-xs rounded-xl border border-[#cfe0d6] bg-white h-24"
          >
            <template #content>
              <div class="text-center w-full">
                <div class="text-3xl font-bold text-[#17362b]">{{ metric.value }}</div>
                <div class="text-[0.7rem] font-bold text-[#355347] uppercase tracking-wider">
                  {{ metric.label }}
                </div>
              </div>
            </template>
          </Card>
        </div>

        <!-- Main Content Row 1 (Advisory & Risk Matrix) -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card
            class="shadow-sm rounded-xl border border-[#cfe0d6] bg-white h-[300px] flex flex-col overflow-hidden"
          >
            <template #title>
              <div class="flex items-center justify-between px-2 pt-1">
                <div class="text-base font-bold text-[#17362b]">Advisory Workflow Overview</div>
              </div>
            </template>
            <template #content>
              <div class="flex flex-col h-full px-2">
                <div
                  v-if="phaseStats.total > 0"
                  class="mb-4 p-3 bg-[#f8faf9] rounded-xl border border-[#cfe0d6] flex-none text-[8px]"
                >
                  <div
                    class="flex justify-between font-bold text-[#355347] mb-2 tracking-widest uppercase"
                  >
                    <span>Draft ({{ phaseStats.draft }})</span>
                    <span>Review ({{ phaseStats.review }})</span>
                    <span>Approved ({{ phaseStats.approved }})</span>
                    <span>Archived ({{ phaseStats.archived }})</span>
                  </div>
                  <div
                    class="flex h-1.5 w-full rounded-full overflow-hidden bg-gray-200 shadow-inner"
                  >
                    <div
                      class="bg-[#f0fdf4]"
                      :style="{ width: (phaseStats.draft / phaseStats.total) * 100 + '%' }"
                    ></div>
                    <div
                      class="bg-[#22c55e]"
                      :style="{ width: (phaseStats.review / phaseStats.total) * 100 + '%' }"
                    ></div>
                    <div
                      class="bg-[#15803d]"
                      :style="{ width: (phaseStats.approved / phaseStats.total) * 100 + '%' }"
                    ></div>
                    <div
                      class="bg-[#064e3b]"
                      :style="{ width: (phaseStats.archived / phaseStats.total) * 100 + '%' }"
                    ></div>
                  </div>
                </div>

                <div
                  v-if="advisoryGroups.length"
                  class="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar"
                >
                  <div v-for="group in advisoryGroups" :key="group.groupId" class="space-y-1">
                    <div class="flex justify-between text-[10px] font-bold">
                      <span class="text-[#355347] truncate mr-2">{{ group.groupName }}</span>
                      <span class="text-[#17362b] uppercase tracking-tighter whitespace-nowrap">{{
                        group.latestSubmissionStatus || 'No Submission'
                      }}</span>
                    </div>
                    <div class="w-full bg-gray-100 rounded-full h-1">
                      <div
                        class="bg-[#17362b] h-1 rounded-full transition-all duration-500"
                        :style="{ width: getMockProgress(group.latestSubmissionStatus) + '%' }"
                      ></div>
                    </div>
                  </div>
                </div>
                <div v-else-if="!loading" class="text-center py-8 text-gray-500 text-xs italic">
                  No active advisees.
                </div>
              </div>
            </template>
          </Card>

          <Card
            class="shadow-sm rounded-xl border border-[#cfe0d6] bg-white h-[300px] flex flex-col overflow-hidden"
          >
            <template #title>
              <div class="flex items-center justify-between px-2 pt-1">
                <div class="text-base font-bold text-[#17362b]">Advisory Risk Matrix</div>
              </div>
            </template>
            <template #content>
              <div class="flex-1 min-h-0 px-2 pb-2">
                <Chart
                  type="bubble"
                  :data="riskChartData"
                  :options="riskChartOptions"
                  class="h-full w-full"
                />
              </div>
            </template>
          </Card>
        </div>

        <!-- Main Content Row 2 (Notifications & Deadlines) -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card
            class="shadow-sm rounded-xl border border-[#cfe0d6] bg-white h-[175px] flex flex-col overflow-hidden"
          >
            <template #title>
              <div class="flex items-center justify-between px-2 pt-1">
                <div class="text-base font-bold text-[#17362b]">Recent Notifications</div>
              </div>
            </template>
            <template #content>
              <div
                v-if="recentNotifications.length"
                class="divide-y divide-gray-50 px-2 overflow-y-auto flex-1 custom-scrollbar"
              >
                <div v-for="notif in recentNotifications" :key="notif.id" class="py-2">
                  <div class="flex justify-between items-start">
                    <span class="font-bold text-[#17362b] text-[10px] leading-tight">{{
                      notif.title
                    }}</span>
                    <span class="text-[8px] text-gray-400 font-medium whitespace-nowrap ml-2">{{
                      notif.time
                    }}</span>
                  </div>
                  <p class="text-[9px] text-[#5a877a] truncate">{{ notif.group }}</p>
                </div>
              </div>
              <div v-else-if="!loading" class="text-center py-8 text-gray-400 text-xs italic px-2">
                No recent activity.
              </div>
            </template>
          </Card>

          <Card
            class="shadow-sm rounded-xl border border-[#cfe0d6] bg-white h-[175px] flex flex-col overflow-hidden"
          >
            <template #title>
              <div class="text-base font-bold text-[#17362b] px-2 pt-1">Next Deadlines</div>
            </template>
            <template #content>
              <div class="flex flex-col h-full px-2">
                <div
                  v-if="upcomingTasks.length"
                  class="space-y-2 pb-1 overflow-y-auto pr-2 custom-scrollbar"
                >
                  <div
                    v-for="task in upcomingTasks"
                    :key="task.taskId"
                    class="p-2 bg-[#f8faf9] rounded-lg border-l-4 border-[#17362b] border-y border-r border-[#cfe0d6] flex justify-between items-center transition-transform hover:translate-x-1"
                  >
                    <div class="flex flex-col min-w-0">
                      <span class="font-bold text-[#17362b] text-[10px] truncate">{{
                        task.taskName
                      }}</span>
                      <span class="text-[8px] text-[#5a877a]">{{ task.academicYear }}</span>
                    </div>
                    <span
                      class="text-[10px] font-black text-[#355347] whitespace-nowrap uppercase tracking-tighter bg-white px-2 py-1 rounded border border-[#cfe0d6]"
                      >{{ formatDeadline(task.dueDate) }}</span
                    >
                  </div>
                </div>
                <div v-else class="text-center py-4 text-gray-400 text-xs italic">
                  No upcoming deadlines.
                </div>
              </div>
            </template>
          </Card>
        </div>
      </div>
    </main>

    <!-- Popups (Kept but buttons removed) -->
    <Dialog
      v-model:visible="showAllGroups"
      header="Advisory Roster"
      modal
      :style="{ width: '80vw' }"
    >
      <DataTable
        :value="fullAdvisoryGroups"
        stripedRows
        paginator
        :rows="10"
        class="p-datatable-sm"
      >
        <Column field="groupName" header="Group Name" sortable></Column>
        <Column field="programCode" header="Program" sortable></Column>
        <Column field="latestSubmissionStatus" header="Status" sortable>
          <template #body="{ data }">
            <Tag :value="data.latestSubmissionStatus || 'No Submission'" severity="secondary" />
          </template>
        </Column>
        <Column header="Progress">
          <template #body="{ data }">
            <div class="w-full bg-gray-100 rounded-full h-2">
              <div
                class="bg-[#17362b] h-2 rounded-full"
                :style="{ width: getMockProgress(data.latestSubmissionStatus) + '%' }"
              ></div>
            </div>
          </template>
        </Column>
      </DataTable>
    </Dialog>

    <Dialog
      v-model:visible="showAllNotifications"
      header="Notification History"
      modal
      :style="{ width: '50vw' }"
    >
      <div class="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
        <div
          v-for="notif in fullNotifications"
          :key="notif.id"
          class="p-3 border-b border-gray-100"
        >
          <div class="flex justify-between font-bold text-[#17362b]">
            <span class="text-sm">{{ notif.title }}</span>
            <span class="text-[10px] text-gray-400">{{ notif.date }}</span>
          </div>
          <p class="text-xs text-[#5a877a] mt-1">{{ notif.group }}</p>
        </div>
      </div>
    </Dialog>

    <footer class="flex-none">
      <Footer />
    </footer>
  </div>
</template>

<style scoped>
:deep(.p-card) {
  transition:
    border-color 200ms ease,
    box-shadow 200ms ease;
}
:deep(.p-card-body) {
  padding: 0.5rem 0.75rem !important;
  display: flex;
  flex-direction: column;
  height: 100%;
}
:deep(.p-card-content) {
  padding: 0 !important;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
:deep(.p-card-title) {
  margin-bottom: 0.25rem !important;
}

.metric-card :deep(.p-card-body),
.metric-card :deep(.p-card-content) {
  justify-content: center;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #cfe0d6;
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #17362b;
}
</style>
