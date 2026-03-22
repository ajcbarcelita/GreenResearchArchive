<script setup>
import { ref, onMounted } from 'vue'
import Card from 'primevue/card'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Dialog from 'primevue/dialog'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Footer from '@/components/Footer.vue'
import NavbarFaculty from '@/components/NavbarFaculty.vue'
import { getStoredUser } from '@/services/authService'
import { getAdvisoryLoad, getCoordinatorTasks } from '@/services/advisoryService'
import { getAuditLogs } from '@/services/auditLogService'

const user = getStoredUser()
const loading = ref(true)

// Data refs
const workloadMetrics = ref([
  {
    label: 'Active Advisees',
    value: 0,
    icon: 'pi-users',
  },
  {
    label: 'Pending Reviews',
    value: 0,
    icon: 'pi-clock',
  },
  {
    label: 'Approved this Term',
    value: 0,
    icon: 'pi-check-circle',
  },
])

const recentNotifications = ref([])
const fullNotifications = ref([])
const advisoryGroups = ref([])
const fullAdvisoryGroups = ref([])
const upcomingTasks = ref([])
const phaseStats = ref({ draft: 0, review: 0, approved: 0, total: 0 })

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

const fetchData = async () => {
  loading.value = true
  try {
    const advisoryData = await getAdvisoryLoad({ adviserId: user?.id })
    const rows = advisoryData.rows || []

    const sortedRows = [...rows].sort((a, b) => {
      const progA = getMockProgress(a.latestSubmissionStatus)
      const progB = getMockProgress(b.latestSubmissionStatus)
      return progB - progA
    })
    
    fullAdvisoryGroups.value = sortedRows
    advisoryGroups.value = sortedRows // Show all, card will handle scrolling

    const stats = { draft: 0, review: 0, approved: 0, total: rows.length }
    rows.forEach((r) => {
      const s = r.latestSubmissionStatus
      if (!s || s === 'Draft') stats.draft++
      else if (s === 'Approved' || s === 'Archived') stats.approved++
      else stats.review++
    })
    phaseStats.value = stats

    const summary = advisoryData.summary || {}
    workloadMetrics.value[0].value = summary.totalGroups || 0
    workloadMetrics.value[1].value = summary.groupsNeedingAttention || 0
    workloadMetrics.value[2].value = rows.filter((r) => r.latestSubmissionStatus === 'Approved').length

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
      date: new Date(log.changedAt).toLocaleString()
    }))
    
    recentNotifications.value = fullNotifications.value // Show all, card will handle scrolling
  } catch (error) {
    console.error('Failed to fetch faculty dashboard data:', error)
  } finally {
    loading.value = false
  }
}

onMounted(fetchData)
</script>

<template>
  <div class="h-screen flex flex-col bg-linear-to-b from-[#eaf4ee] to-[#f8fbf9] font-Karla overflow-hidden">
    <header class="flex-none">
      <NavbarFaculty />
    </header>

    <main class="flex-1 px-4 pt-20 pb-4 sm:px-6 lg:pt-24 flex flex-col min-h-0">
      <div class="max-w-7xl mx-auto w-full flex-1 flex flex-col min-h-0 space-y-4">
        <!-- Welcome Header -->
        <section class="flex-none">
          <h1 class="text-2xl font-extrabold text-[#17362b]">Faculty Dashboard</h1>
          <p class="text-sm text-[#355347]">
            Welcome back, {{ user?.firstName || 'Faculty' }}! Here's your workload snapshot.
          </p>
        </section>

        <!-- Metrics Grid -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 flex-none">
          <Card
            v-for="metric in workloadMetrics"
            :key="metric.label"
            class="shadow-xs rounded-xl border border-[#cfe0d6] bg-white h-24 flex items-center justify-center"
          >
            <template #content>
              <div class="text-center w-full">
                <div class="text-3xl font-bold text-[#17362b]">{{ metric.value }}</div>
                <div class="text-[0.7rem] font-bold text-[#355347] uppercase tracking-wider">{{ metric.label }}</div>
              </div>
            </template>
          </Card>
        </div>

        <!-- Main Content Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0 overflow-hidden">
          <!-- Advisory Overview -->
          <div class="lg:col-span-2 flex flex-col min-h-0">
            <Card class="shadow-sm rounded-xl border border-[#cfe0d6] bg-white h-full flex flex-col overflow-hidden">
              <template #title>
                <div class="flex items-center justify-between px-2 pt-1">
                  <div class="text-base font-bold text-[#17362b]">Advisory Workflow Overview</div>
                </div>
              </template>
              <template #content>
                <div class="flex flex-col h-full px-2">
                  <div v-if="phaseStats.total > 0" class="mb-4 p-4 bg-[#f8faf9] rounded-xl border border-[#cfe0d6] flex-none">
                    <div class="flex justify-between text-[9px] font-bold text-[#355347] mb-2 tracking-widest uppercase">
                      <span>Draft ({{ phaseStats.draft }})</span>
                      <span>Review ({{ phaseStats.review }})</span>
                      <span>Approved ({{ phaseStats.approved }})</span>
                    </div>
                    <div class="flex h-2 w-full rounded-full overflow-hidden bg-gray-200 shadow-inner">
                      <div class="bg-[#a3b8af]" :style="{ width: (phaseStats.draft / phaseStats.total * 100) + '%' }"></div>
                      <div class="bg-[#355347]" :style="{ width: (phaseStats.review / phaseStats.total * 100) + '%' }"></div>
                      <div class="bg-[#17362b]" :style="{ width: (phaseStats.approved / phaseStats.total * 100) + '%' }"></div>
                    </div>
                  </div>

                  <div v-if="advisoryGroups.length" class="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    <div v-for="group in advisoryGroups" :key="group.groupId" class="space-y-1">
                      <div class="flex justify-between text-[11px] font-bold">
                        <span class="text-[#355347] truncate mr-2">{{ group.groupName }}</span>
                        <span class="text-[#17362b] uppercase tracking-tighter whitespace-nowrap">{{ group.latestSubmissionStatus || 'No Submission' }}</span>
                      </div>
                      <div class="w-full bg-gray-100 rounded-full h-1.5">
                        <div class="bg-[#17362b] h-1.5 rounded-full transition-all duration-500" :style="{ width: getMockProgress(group.latestSubmissionStatus) + '%' }"></div>
                      </div>
                    </div>
                  </div>
                  <div v-else-if="!loading" class="text-center py-8 text-gray-500 text-sm italic">No active advisees.</div>
                </div>
              </template>
            </Card>
          </div>

          <!-- Right Column -->
          <div class="flex flex-col space-y-4 min-h-0 overflow-hidden">
            <!-- Deadlines -->
            <Card v-if="upcomingTasks.length" class="shadow-sm rounded-xl border border-[#cfe0d6] bg-white flex-none">
              <template #title>
                <div class="text-sm font-bold text-[#17362b] px-2 pt-1">Next Deadlines</div>
              </template>
              <template #content>
                <div class="space-y-2 px-2 pb-1">
                  <div v-for="task in upcomingTasks" :key="task.taskId" class="p-2 bg-[#f8faf9] rounded-lg border-l-2 border-[#17362b] border-y border-r border-[#cfe0d6] flex justify-between items-center">
                    <span class="font-bold text-[#17362b] text-[10px] truncate mr-2">{{ task.taskName }}</span>
                    <span class="text-[9px] font-black text-[#355347] whitespace-nowrap uppercase tracking-tighter">{{ formatDeadline(task.dueDate) }}</span>
                  </div>
                </div>
              </template>
            </Card>

            <!-- Notifications -->
            <Card class="shadow-sm rounded-xl border border-[#cfe0d6] bg-white flex-1 flex flex-col overflow-hidden">
              <template #title>
                <div class="flex items-center justify-between px-2 pt-1">
                  <div class="text-sm font-bold text-[#17362b]">Recent Notifications</div>
                </div>
              </template>
              <template #content>
                <div v-if="recentNotifications.length" class="divide-y divide-gray-50 px-2 overflow-y-auto flex-1 custom-scrollbar">
                  <div v-for="notif in recentNotifications" :key="notif.id" class="py-2">
                    <div class="flex justify-between items-start">
                      <span class="font-bold text-[#17362b] text-[10px] leading-tight">{{ notif.title }}</span>
                      <span class="text-[8px] text-gray-400 font-medium whitespace-nowrap ml-2">{{ notif.time }}</span>
                    </div>
                    <p class="text-[9px] text-[#5a877a] truncate">{{ notif.group }}</p>
                  </div>
                </div>
                <div v-else-if="!loading" class="text-center py-8 text-gray-400 text-[10px] italic px-2">No recent activity.</div>
              </template>
            </Card>
          </div>
        </div>
      </div>
    </main>

    <!-- Popups (Kept but buttons removed) -->
    <Dialog v-model:visible="showAllGroups" header="Advisory Roster" modal :style="{ width: '80vw' }">
      <DataTable :value="fullAdvisoryGroups" stripedRows paginator :rows="10" class="p-datatable-sm">
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
              <div class="bg-[#17362b] h-2 rounded-full" :style="{ width: getMockProgress(data.latestSubmissionStatus) + '%' }"></div>
            </div>
          </template>
        </Column>
      </DataTable>
    </Dialog>

    <Dialog v-model:visible="showAllNotifications" header="Notification History" modal :style="{ width: '50vw' }">
      <div class="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
        <div v-for="notif in fullNotifications" :key="notif.id" class="p-3 border-b border-gray-100">
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
:deep(.p-card) { transition: border-color 200ms ease, box-shadow 200ms ease; }
:deep(.p-card-body) { padding: 0.5rem 0.75rem !important; display: flex; flex-direction: column; height: 100%; }
:deep(.p-card-content) { padding: 0 !important; flex: 1; min-height: 0; display: flex; flex-direction: column; }
:deep(.p-card-title) { margin-bottom: 0.25rem !important; }

.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #cfe0d6; border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #17362b; }
</style>