<script setup>
import { ref, onMounted } from 'vue'
import Card from 'primevue/card'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Footer from '@/components/Footer.vue'
import NavbarFaculty from '@/components/NavbarFaculty.vue'
import { getStoredUser } from '@/services/authService'
import { getAdvisoryLoad } from '@/services/advisoryService'
import { getAuditLogs } from '@/services/auditLogService'

const user = getStoredUser()
const loading = ref(true)

// Data refs
const workloadMetrics = ref([
  {
    label: 'Active Advisees',
    value: 0,
    icon: 'pi-users',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
  },
  {
    label: 'Pending Reviews',
    value: 0,
    icon: 'pi-clock',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
  },
  {
    label: 'Approved this Term',
    value: 0,
    icon: 'pi-check-circle',
    color: 'text-green-600',
    bg: 'bg-green-50',
  },
])

const recentNotifications = ref([])
const advisoryGroups = ref([])

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

// Calculate mock progress based on status for the overview
const getMockProgress = (status) => {
  switch (status) {
    case 'Approved':
      return 100
    case 'Under Review':
      return 75
    case 'Revision Requested':
      return 60
    case 'Submitted':
      return 50
    case 'Draft':
      return 25
    default:
      return 10
  }
}

const fetchData = async () => {
  loading.value = true
  try {
    // 1. Fetch Advisory Load for this faculty
    const advisoryData = await getAdvisoryLoad({ adviserId: user?.id })
    const summary = advisoryData.summary || {}
    const rows = advisoryData.rows || []
    advisoryGroups.value = rows

    // Update Metrics
    workloadMetrics.value[0].value = summary.totalGroups || 0
    workloadMetrics.value[1].value = summary.groupsNeedingAttention || 0

    // Calculate "Approved this Term"
    const approvedCount = rows.filter((r) => r.latestSubmissionStatus === 'Approved').length
    workloadMetrics.value[2].value = approvedCount

    // 2. Fetch Audit Logs
    const auditData = await getAuditLogs()
    const allLogs = auditData.rows || []

    // Filter logs related to my groups
    const myGroupIds = new Set(rows.map((r) => r.groupId))
    const myLogs = allLogs.filter((log) => myGroupIds.has(log.groupId)).slice(0, 5) // Take latest 5

    recentNotifications.value = myLogs.map((log) => ({
      id: log.logId,
      title: log.newStatus ? `Status updated to ${log.newStatus}` : 'Submission Update',
      group: log.groupName,
      time: formatTimeAgo(log.changedAt),
      status: log.newStatus || log.currentStatus,
    }))
  } catch (error) {
    console.error('Failed to fetch faculty dashboard data:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="min-h-screen flex flex-col bg-linear-to-b from-[#eaf4ee] to-[#f8fbf9] font-Karla">
    <header>
      <NavbarFaculty />
    </header>

    <main class="flex-1 px-4 pt-24 pb-12 sm:px-6 sm:pt-28 lg:pt-32">
      <div class="max-w-6xl mx-auto space-y-8">
        <!-- Welcome Header -->
        <section>
          <h1 class="text-3xl font-extrabold text-[#17362b]">Faculty Dashboard</h1>
          <p class="mt-2 text-[#355347]">
            Welcome back, {{ user?.firstName || 'Faculty' }}! Here's a summary of your active
            advisees and pending tasks.
          </p>
        </section>

        <!-- Metrics Grid -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card v-for="metric in workloadMetrics" :key="metric.label" class="metric-card">
            <template #content>
              <div class="flex items-center gap-4">
                <div :class="['p-3 rounded-xl', metric.bg]">
                  <i :class="['pi text-2xl', metric.icon, metric.color]"></i>
                </div>
                <div>
                  <p class="text-sm font-bold text-[#5a877a] uppercase tracking-wider">
                    {{ metric.label }}
                  </p>
                  <p class="text-3xl font-black text-[#17362b]">{{ metric.value }}</p>
                </div>
              </div>
            </template>
          </Card>
        </div>

        <!-- Main Content & Notifications Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- Main Content -->
          <div class="lg:col-span-2 space-y-6">
            <!-- Workflow Status Overview -->
            <Card class="workflow-card">
              <template #title>
                <div class="flex items-center gap-2 text-lg font-bold text-[#17362b]">
                  <i class="pi pi-chart-bar text-green-600"></i>
                  Advisory Workflow Overview
                </div>
              </template>
              <template #content>
                <div v-if="advisoryGroups.length" class="space-y-4">
                  <div
                    v-for="group in advisoryGroups.slice(0, 5)"
                    :key="group.groupId"
                    class="space-y-1"
                  >
                    <div class="flex justify-between text-sm font-bold">
                      <span class="text-[#355347]"
                        >{{ group.groupName }} ({{ group.programCode }})</span
                      >
                      <span class="text-[#17362b]">{{
                        group.latestSubmissionStatus || 'No Submission'
                      }}</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-2">
                      <div
                        class="bg-green-600 h-2 rounded-full transition-all duration-500"
                        :style="{ width: getMockProgress(group.latestSubmissionStatus) + '%' }"
                      ></div>
                    </div>
                  </div>
                  <div v-if="advisoryGroups.length > 5" class="pt-2 text-center">
                    <router-link
                      to="/faculty/my-advisees"
                      class="text-sm font-bold text-green-700 no-underline hover:underline"
                    >
                      View all {{ advisoryGroups.length }} groups
                    </router-link>
                  </div>
                </div>
                <div v-else-if="!loading" class="text-center py-8 text-gray-500">
                  No active advisees found.
                </div>
                <div v-else class="text-center py-8 text-gray-400">
                  <i class="pi pi-spin pi-spinner mr-2"></i> Loading groups...
                </div>
              </template>
            </Card>
          </div>

          <!-- Recent Notifications -->
          <div class="space-y-6">
            <h2 class="text-xl font-bold text-[#17362b] flex items-center gap-2">
              <i class="pi pi-bell text-blue-500"></i>
              Recent Notifications
            </h2>
            <Card class="notifications-card">
              <template #content>
                <div v-if="recentNotifications.length" class="divide-y divide-gray-100">
                  <div
                    v-for="notif in recentNotifications"
                    :key="notif.id"
                    class="py-4 first:pt-0 last:pb-0"
                  >
                    <div class="flex justify-between items-start mb-1">
                      <span class="font-bold text-[#17362b] text-sm">{{ notif.title }}</span>
                      <span class="text-[10px] text-gray-400 font-medium">{{ notif.time }}</span>
                    </div>
                    <p class="text-xs text-[#5a877a] mb-2">{{ notif.group }}</p>
                    <Tag
                      :value="notif.status"
                      severity="secondary"
                      class="text-[9px] px-2"
                      rounded
                    />
                  </div>
                  <Button
                    label="View Submission Monitoring"
                    text
                    class="w-full mt-4 text-xs font-bold"
                    @click="$router.push('/faculty/submissions')"
                  />
                </div>
                <div v-else-if="!loading" class="text-center py-8 text-gray-500">
                  No recent activities.
                </div>
                <div v-else class="text-center py-8 text-gray-400">
                  <i class="pi pi-spin pi-spinner mr-2"></i> Loading notifications...
                </div>
              </template>
            </Card>
          </div>
        </div>
      </div>
    </main>

    <footer>
      <Footer />
    </footer>
  </div>
</template>

<style scoped>
:deep(.p-card) {
  border: 2px solid #d1d5db;
  border-radius: 0.75rem;
  box-shadow: 0 10px 15px rgba(2, 6, 23, 0.06);
  transition:
    border-color 200ms ease,
    box-shadow 200ms ease;
}

:deep(.p-card):hover {
  border-color: #0e662e;
}
</style>
