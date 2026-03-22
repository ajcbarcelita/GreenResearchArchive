<script setup>
import { onMounted, ref } from 'vue'
import Card from 'primevue/card'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import ProgressBar from 'primevue/progressbar'
import Toast from 'primevue/toast'
import ConfirmDialog from 'primevue/confirmdialog'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import Footer from '@/components/Footer.vue'
import NavbarAdmin from '@/components/NavbarAdmin.vue'
import { UAParser } from 'ua-parser-js'

// Import the new service
import { getDashboardAnalytics, revokeSpecificSession } from '@/services/adminDashboardService'

const toast = useToast()
const confirm = useConfirm()
const loading = ref(false)

// Initialize with empty/default values
const systemStats = ref({
  activeSessions: 0,
  storageUsed: '0 GB',
  totalFiles: 0,
  newUsers30d: 0,
})
const roleDistribution = ref([])
const activeSessionsTable = ref([])

// Helper function to format the date into "x mins ago" or local time
const formatTime = (dateString) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInMinutes = Math.floor((now - date) / (1000 * 60))

  if (diffInMinutes < 1) return 'Just now'
  if (diffInMinutes < 60) return `${diffInMinutes} mins ago`
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`
  return date.toLocaleDateString() // Fallback to date if older than a day
}

const formatDevice = (userAgent) => {
  if (!userAgent || userAgent === 'Unknown Device') return 'Unknown Device'

  const parser = new UAParser(userAgent)
  const browser = parser.getBrowser().name || 'Unknown Browser'
  const os = parser.getOS().name || 'Unknown OS'

  return `${browser} / ${os}`
}

const loadDashboardData = async () => {
  loading.value = true
  try {
    const data = await getDashboardAnalytics()
    systemStats.value = data.systemStats
    roleDistribution.value = data.roleDistribution

    activeSessionsTable.value = data.activeSessionsTable.map((session) => ({
      ...session,
      loginTime: formatTime(session.loginTime),
      rawDevice: session.device, // <-- ADD THIS: Save the raw string from the backend
      device: formatDevice(session.device),
    }))
  } catch (error) {
    console.error('Failed to load dashboard data:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  document.title = 'Admin Dashboard | Green Archive'
  loadDashboardData()
})
</script>

<template>
  <div class="min-h-screen flex flex-col bg-linear-to-b from-[#eaf4ee] to-[#f8fbf9] font-Karla">
    <Toast />
    <ConfirmDialog />

    <header>
      <NavbarAdmin />
    </header>

    <main class="mx-auto w-full max-w-7xl flex-1 px-4 pb-8 pt-24 sm:px-6 sm:pt-28 lg:pt-32">
      <div class="mb-6 flex justify-between items-end">
        <div>
          <h1 class="text-3xl font-extrabold text-[#17362b]">System Overview</h1>
          <p class="mt-2 text-[#456254]">Live security, storage metrics, and system adoption.</p>
        </div>
        <Button
          icon="pi pi-refresh"
          label="Refresh Analytics"
          outlined
          size="small"
          @click="loadDashboardData"
          :loading="loading"
        />
      </div>

      <section class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card class="kpi-card">
          <template #content>
            <p class="kpi-label text-green-700">Live Sessions</p>
            <p class="kpi-value text-green-600">
              <i v-if="loading" class="pi pi-spinner pi-spin"></i>
              <span v-else>{{ systemStats.activeSessions }}</span>
            </p>
          </template>
        </Card>
        <Card class="kpi-card">
          <template #content>
            <p class="kpi-label">Storage Used (S3)</p>
            <p class="kpi-value">
              <i v-if="loading" class="pi pi-spinner pi-spin"></i>
              <span v-else>{{ systemStats.storageUsed }}</span>
            </p>
          </template>
        </Card>
        <Card class="kpi-card">
          <template #content>
            <p class="kpi-label">Total Files Hosted</p>
            <p class="kpi-value">
              <i v-if="loading" class="pi pi-spinner pi-spin"></i>
              <span v-else>{{ systemStats.totalFiles }}</span>
            </p>
          </template>
        </Card>
        <Card class="kpi-card">
          <template #content>
            <p class="kpi-label text-blue-700">New Users (30 Days)</p>
            <p class="kpi-value text-blue-600">
              <i v-if="loading" class="pi pi-spinner pi-spin"></i>
              <span v-else>+{{ systemStats.newUsers30d }}</span>
            </p>
          </template>
        </Card>
      </section>

      <section class="mb-6">
        <Card class="dashboard-card">
          <template #title>
            <div class="text-lg text-[#17362b]">System Role Distribution</div>
          </template>
          <template #content>
            <div v-if="loading" class="flex justify-center py-4">
              <i class="pi pi-spinner pi-spin text-2xl text-[#4a6a5a]"></i>
            </div>
            <ul v-else class="grid grid-cols-2 md:grid-cols-3 gap-6 mt-2">
              <li v-for="group in roleDistribution" :key="group.role">
                <div class="flex justify-between text-sm mb-1">
                  <span class="font-bold text-[#2f4c3f]">{{ group.role }}</span>
                  <span class="text-[#456254]">{{ group.count }} ({{ group.percentage }}%)</span>
                </div>
                <ProgressBar :value="group.percentage" :showValue="false" style="height: 8px" />
              </li>
              <li
                v-if="roleDistribution.length === 0"
                class="col-span-full text-center text-sm text-gray-500 py-2"
              >
                No role data available.
              </li>
            </ul>
          </template>
        </Card>
      </section>

      <section>
        <Card class="dashboard-card">
          <template #title>
            <div class="flex justify-between items-center text-lg text-[#17362b]">
              <span>Active User Sessions</span>
            </div>
          </template>
          <template #content>
            <DataTable
              :value="activeSessionsTable"
              :loading="loading"
              size="small"
              responsiveLayout="scroll"
              paginator
              :rows="10"
              :rowsPerPageOptions="[10, 20, 50]"
              stripedRows
            >
              <template #empty>
                <div class="text-center py-4 text-gray-500">No active sessions found.</div>
              </template>
              <Column field="user" header="User">
                <template #body="slotProps">
                  <div>
                    <span class="block font-bold">{{ slotProps.data.user }}</span>
                    <span class="block text-xs text-gray-500">{{ slotProps.data.email }}</span>
                  </div>
                </template>
              </Column>
              <Column field="ip" header="IP Address">
                <template #body="slotProps">
                  <Tag severity="secondary" :value="slotProps.data.ip" />
                </template>
              </Column>
              <Column field="device" header="Device / Browser"></Column>
              <Column field="loginTime" header="Logged In"></Column>
            </DataTable>
          </template>
        </Card>
      </section>
    </main>

    <footer>
      <Footer />
    </footer>
  </div>
</template>

<style scoped>
:deep(.kpi-card.p-card),
:deep(.dashboard-card.p-card) {
  border: 1px solid #d1dfd7;
  border-radius: 0.9rem;
  box-shadow: 0 10px 22px rgba(19, 52, 39, 0.06);
}

.kpi-label {
  margin: 0;
  color: #5a7466;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 700;
}

.kpi-value {
  margin: 0.3rem 0 0;
  color: #163328;
  font-weight: 800;
  font-size: 1.75rem;
}

:deep(.p-progressbar .p-progressbar-value) {
  background-color: #4a6a5a;
}
</style>
