<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import Avatar from 'primevue/avatar'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Chip from 'primevue/chip'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Dialog from 'primevue/dialog'
import Tag from 'primevue/tag'
import Navbar from '@/components/Navbar.vue'
import Footer from '@/components/Footer.vue'
import { getStoredUser } from '../../services/authService'
import {
  getCurrentSubmission,
  getLatestStudentSubmission,
  getStudentTasks,
  getSubmissionAuditLogs,
} from '@/services/studentSubmissionService'

const user = getStoredUser()
const router = useRouter()

const fullName = computed(() => {
  const first = user?.firstName || ''
  const middle = user?.middleName || ''
  const last = user?.lastName || ''
  return [first, middle, last].filter(Boolean).join(' ') || 'Student User'
})

const loading = ref(false)
const groupSnapshot = ref({
  groupId: null,
  groupName: 'No Group',
  programCode: 'N/A',
  adviserName: 'Not assigned',
})

const currentSubmission = ref(null)

const submissionFiles = ref({
  capstonePaperCount: 0,
  datasetCount: 0,
  latestUploadAt: 'N/A',
})

const pendingTasks = ref([])
const submissionHistory = ref([])
const taskNameById = ref({})
const showCommentsModal = ref(false)
const selectedHistoryRow = ref(null)
const loadingComments = ref(false)
const submissionComments = ref([])

const groupMembers = [
  { name: 'John Kirbie Mendoza', universityId: '12307823' },
  { name: 'Mika Reyes', universityId: '12307831' },
  { name: 'Allen Cruz', universityId: '12307844' },
  { name: 'Paolo Dela Cruz', universityId: '12307857' },
]

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

const formatVersionChip = (versionNo) => {
  if (!versionNo) return 'Version: N/A'
  return `Version: v${versionNo}`
}

const formatSubmittedChip = (submittedAt) => {
  if (!submittedAt) return 'Submitted: Not submitted'
  return `Submitted: ${submittedAt}`
}

const formatArchivedChip = (archivedAt) => {
  if (!archivedAt) return 'Archived: Not archived'
  return `Archived: ${archivedAt}`
}

const formatDateOnly = (value) => {
  if (!value) return 'No deadline'
  return new Date(value).toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  })
}

const historyWithTaskName = computed(() => {
  return submissionHistory.value.map((item) => ({
    ...item,
    taskName: taskNameById.value[item.taskId] || 'Unknown Task',
  }))
})

const loadPendingTasks = async () => {
  try {
    const data = await getStudentTasks()
    const tasks = Array.isArray(data?.tasks) ? data.tasks : []

    taskNameById.value = tasks.reduce((acc, task) => {
      if (task?.taskId) {
        acc[task.taskId] = task.taskName || 'Untitled Task'
      }
      return acc
    }, {})

    pendingTasks.value = tasks
      .filter((task) => {
        const status = task?.submission?.status || null
        return !status || status === 'Draft'
      })
      .map((task) => ({
        taskId: task.taskId,
        taskName: task.taskName || 'Untitled Task',
        dueDate: task.dueDate,
      }))
      .sort((a, b) => {
        const aTime = a.dueDate ? new Date(a.dueDate).getTime() : Number.POSITIVE_INFINITY
        const bTime = b.dueDate ? new Date(b.dueDate).getTime() : Number.POSITIVE_INFINITY
        return aTime - bTime
      })
  } catch (error) {
    console.error('Failed to load pending tasks', error)
    pendingTasks.value = []
  }
}

const loadSubmissionHistory = async () => {
  try {
    const data = await getCurrentSubmission()
    const history = Array.isArray(data?.history) ? data.history : []

    submissionHistory.value = history.map((item) => ({
      submissionId: item.submissionId,
      taskId: item.taskId,
      title: item.title || 'Untitled Submission',
      version: `v${item.versionNo || 1}`,
      status: item.status || 'Draft',
      submittedAt: formatDateTime(item.submittedAt || item.createdAt),
    }))
  } catch (error) {
    console.error('Failed to load submission history', error)
    submissionHistory.value = []
  }
}

const submissionSeverity = computed(() => {
  const status = currentSubmission.value?.status
  if (status === 'Approved') return 'success'
  if (status === 'Revision Requested') return 'warn'
  return 'info'
})

const loadLatestSubmission = async () => {
  loading.value = true
  try {
    const data = await getLatestStudentSubmission()
    const group = data?.group || null
    const reviewer = data?.reviewer || null
    const submission = data?.submission || null
    const task = data?.task || null
    const fileStats = data?.fileStats || null

    groupSnapshot.value = {
      groupId: group?.groupId || null,
      groupName: group?.groupName || 'No Group',
      programCode: task?.academicYear || 'N/A',
      adviserName: reviewer?.reviewerName || 'Not assigned',
    }

    currentSubmission.value = submission
      ? {
          ...submission,
          taskId: task?.taskId || submission.taskId || null,
          title: submission.title || task?.taskName || 'Untitled Submission',
          submittedAt: formatDateTime(submission.submittedAt || submission.createdAt),
          archivedAt: submission.archivedAt ? formatDateTime(submission.archivedAt) : null,
        }
      : null

    submissionFiles.value = {
      capstonePaperCount: Number(fileStats?.capstonePaperCount || 0),
      datasetCount: Number(fileStats?.datasetCount || 0),
      latestUploadAt: formatDateTime(fileStats?.latestUploadAt),
    }
  } catch (error) {
    console.error('Failed to load latest submission', error)
  } finally {
    loading.value = false
  }
}

const openSubmission = () => {
  if (!currentSubmission.value?.taskId) {
    router.push('/student/tasks')
    return
  }

  router.push({ name: 'submission-view', query: { taskId: currentSubmission.value.taskId } })
}

const openHistoryComments = async (event) => {
  const row = event?.data || null
  if (!row?.submissionId) return

  selectedHistoryRow.value = row
  showCommentsModal.value = true
  loadingComments.value = true
  submissionComments.value = []

  try {
    const response = await getSubmissionAuditLogs(row.submissionId)
    const logs = Array.isArray(response?.data) ? response.data : []

    submissionComments.value = logs.map((log) => ({
      reviewer: log.actorName || 'Unknown Reviewer',
      role: log.actorRole || 'N/A',
      comment: log.remarks || 'No comment provided.',
      commentedAt: formatDateTime(log.changedAt),
    }))
  } catch (error) {
    console.error('Failed to load submission comments', error)
    submissionComments.value = []
  } finally {
    loadingComments.value = false
  }
}

onMounted(async () => {
  await Promise.all([loadLatestSubmission(), loadPendingTasks(), loadSubmissionHistory()])
})
</script>

<template>
  <div class="dashboard-page min-h-screen flex flex-col font-Karla">
    <header>
      <Navbar />
    </header>

    <main
      class="mx-auto w-full max-w-7xl flex-1 px-4 pb-8 pt-24 sm:px-6 sm:pb-10 sm:pt-28 lg:pt-32"
    >
      <section class="grid gap-4 md:grid-cols-12 lg:gap-5">
        <Card class="panel-card md:col-span-12">
          <template #content>
            <div class="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p class="kicker">Student Dashboard</p>
                <h1 class="headline">Welcome back, {{ fullName }}</h1>
                <p class="support-text">
                  Monitor your group, submission lifecycle, file uploads, and audit trail in one
                  place.
                </p>
              </div>
              <div class="flex items-center gap-2">
                <Tag value="Student" severity="success" rounded />
                <Tag value="Active" severity="info" rounded />
              </div>
            </div>
          </template>
        </Card>
      </section>

      <section class="mt-4 grid gap-4 md:grid-cols-12 lg:gap-5">
        <Card class="panel-card current-submission-card md:col-span-8">
          <template #title>
            <div class="flex items-center justify-between gap-3">
              <span>Current Submission</span>
              <Tag
                :value="currentSubmission?.status || 'Draft'"
                :severity="submissionSeverity"
                rounded
              />
            </div>
          </template>
          <template #content>
            <h3 class="submission-title">
              {{ currentSubmission?.title || 'No submission found for your group yet.' }}
            </h3>
            <div class="mt-2 flex flex-wrap gap-2 text-sm">
              <Chip :label="formatVersionChip(currentSubmission?.versionNo)" />
              <Chip :label="formatSubmittedChip(currentSubmission?.submittedAt)" />
              <Chip :label="formatArchivedChip(currentSubmission?.archivedAt)" />
            </div>
            <p class="schema-note">
              Files: Capstone Paper ({{ submissionFiles.capstonePaperCount }}), Dataset ({{
                submissionFiles.datasetCount
              }}). Latest upload: {{ submissionFiles.latestUploadAt }}.
            </p>
            <div class="mt-4 flex flex-wrap gap-2 current-submission-actions">
              <Button
                :label="currentSubmission ? 'Open Submission' : 'Choose Task'"
                @click="openSubmission"
              />
            </div>
          </template>
        </Card>

        <Card class="panel-card md:col-span-4">
          <template #title> Pending Tasks </template>
          <template #content>
            <DataTable
              :value="pendingTasks"
              stripedRows
              size="small"
              responsiveLayout="scroll"
              scrollable
              scrollHeight="9.2rem"
              :emptyMessage="'All tasks are already submitted.'"
            >
              <Column field="taskName" header="Task" />
              <Column header="Deadline">
                <template #body="slotProps">
                  {{ formatDateOnly(slotProps.data.dueDate) }}
                </template>
              </Column>
            </DataTable>
          </template>
        </Card>
      </section>

      <section class="mt-4 grid gap-4 md:grid-cols-12 lg:gap-5">
        <Card class="panel-card md:col-span-5">
          <template #title> Group Snapshot </template>
          <template #content>
            <div class="group-meta">
              <p><strong>Group ID:</strong> {{ groupSnapshot.groupId }}</p>
              <p><strong>Group Name:</strong> {{ groupSnapshot.groupName }}</p>
              <p><strong>Program:</strong> {{ groupSnapshot.programCode }}</p>
              <p><strong>Adviser:</strong> {{ groupSnapshot.adviserName }}</p>
            </div>
            <div class="mt-3 grid gap-2">
              <div v-for="member in groupMembers" :key="member.universityId" class="member-item">
                <Avatar :label="member.name.charAt(0)" shape="circle" />
                <span>{{ member.name }} ({{ member.universityId }})</span>
              </div>
            </div>
          </template>
        </Card>

        <Card class="panel-card md:col-span-7">
          <template #title> Submission History </template>
          <template #content>
            <DataTable
              :value="historyWithTaskName"
              stripedRows
              size="small"
              responsiveLayout="scroll"
              paginator
              :rows="5"
              class="history-table"
              :emptyMessage="'No submission history found yet.'"
              @row-click="openHistoryComments"
            >
              <Column field="taskName" header="Task" />
              <Column field="title" header="Title" />
              <Column field="version" header="Version" />
              <Column field="submittedAt" header="Submitted At" />
              <Column field="status" header="Status">
                <template #body="slotProps">
                  <Tag
                    :value="slotProps.data.status"
                    :severity="slotProps.data.status === 'Submitted' ? 'info' : 'warn'"
                    rounded
                  />
                </template>
              </Column>
            </DataTable>
          </template>
        </Card>
      </section>

      <Dialog
        v-model:visible="showCommentsModal"
        modal
        :closable="true"
        :dismissableMask="true"
        header="Submission Comments"
        :style="{ width: 'min(96vw, 62rem)' }"
      >
        <div class="comments-modal-wrap">
          <p class="comments-modal-meta">
            <strong>Submission:</strong>
            {{ selectedHistoryRow?.title || 'N/A' }}
            •
            <strong>Version:</strong>
            {{ selectedHistoryRow?.version || 'N/A' }}
          </p>

          <DataTable
            v-if="loadingComments || submissionComments.length"
            :value="submissionComments"
            stripedRows
            size="small"
            responsiveLayout="scroll"
            :loading="loadingComments"
            :emptyMessage="'No comments found for this submission.'"
          >
            <Column field="reviewer" header="Reviewer" />
            <Column field="role" header="Role" />
            <Column field="comment" header="Comment" />
            <Column field="commentedAt" header="Commented At" />
          </DataTable>

          <div v-else class="comments-empty-state">
            <h4 class="comments-empty-title">No reviewer comments yet</h4>
            <p class="comments-empty-text">
              This submission does not have comment logs yet. Comments will appear here once a
              reviewer records remarks.
            </p>
          </div>
        </div>
      </Dialog>
    </main>

    <footer>
      <Footer />
    </footer>
  </div>
</template>

<style scoped>
.dashboard-page {
  background: linear-gradient(180deg, #e8f0eb 0%, #f4f9f6 45%, #eaf3ee 100%);
}

.panel-card {
  border-radius: 1rem;
  border: 1px solid #d5e2db;
  box-shadow: 0 12px 32px rgba(18, 43, 32, 0.07);
  transition:
    border-color 200ms ease,
    box-shadow 200ms ease;
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
  font-size: clamp(1.25rem, 2.8vw, 2rem);
  font-weight: 700;
}

.support-text {
  margin: 0.5rem 0 0;
  color: #3f5f4f;
}

.submission-title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  color: #143025;
}

.schema-note {
  margin: 0.75rem 0 0;
  font-size: 0.92rem;
  color: #365347;
  line-height: 1.45;
}

:deep(.current-submission-card .p-card-content) {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.current-submission-actions {
  margin-top: auto;
  justify-content: flex-end;
}

.comments-modal-wrap {
  display: grid;
  gap: 0.65rem;
}

.comments-modal-meta {
  margin: 0;
  color: #2f4e40;
  font-size: 0.92rem;
}

.comments-empty-state {
  border: 1px dashed #b9cec2;
  border-radius: 0.75rem;
  background: #f7fbf9;
  padding: 1rem;
}

.comments-empty-title {
  margin: 0;
  color: #1f3f33;
  font-size: 1rem;
  font-weight: 700;
}

.comments-empty-text {
  margin: 0.35rem 0 0;
  color: #4f695b;
  font-size: 0.9rem;
  line-height: 1.45;
}

:deep(.history-table .p-datatable-tbody > tr) {
  cursor: pointer;
}

.group-meta p {
  margin: 0.2rem 0;
  font-size: 0.92rem;
  color: #2f4e40;
}

.member-item {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.55rem 0.65rem;
  border: 1px solid #d4e2db;
  border-radius: 0.7rem;
  background-color: #f8fcf9;
}

.scroll-box {
  max-height: 20rem;
  overflow-y: auto;
  padding-right: 0.35rem;
}

.scroll-box::-webkit-scrollbar {
  width: 0.45rem;
}

.scroll-box::-webkit-scrollbar-thumb {
  background: #9db7a8;
  border-radius: 999px;
}

.scroll-box::-webkit-scrollbar-track {
  background: #e8f2ed;
  border-radius: 999px;
}

footer {
  margin-top: auto;
}

.panel-card:hover {
  border-color: #0e662e;
}
</style>
