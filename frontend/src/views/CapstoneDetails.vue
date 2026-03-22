<template>
  <div class="min-h-screen flex flex-col bg-ash-white font-Montserrat">
    <Toast />

    <header>
      <NavbarAdmin v-if="useAdminNavbar" />
      <NavbarFaculty v-else-if="useFacultyNavbar" />
      <NavbarCoordinator v-else-if="useCoordinatorNavbar" />
      <Navbar v-else />
    </header>

    <main class="flex-1 container mx-auto px-6 py-6 pt-32">
      <div v-if="loading" class="animate-pulse grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="md:col-span-2">
          <div class="bg-white rounded-xl shadow-lg border-2 border-gray-300 p-8.5">
            <div class="h-8 bg-gray-200 rounded w-3/4 mb-6"></div>
            <div class="space-y-5">
              <div class="h-10 bg-gray-200 rounded"></div>
              <div class="grid grid-cols-2 gap-4">
                <div class="h-10 bg-gray-200 rounded"></div>
                <div class="h-10 bg-gray-200 rounded"></div>
              </div>
              <div class="h-10 bg-gray-200 rounded"></div>
              <div class="h-24 bg-gray-200 rounded"></div>
              <div class="h-10 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>

        <aside
          class="space-y-6 md:sticky md:top-32 self-start md:max-h-[calc(100vh-9rem)] md:overflow-y-auto md:pr-1"
        >
          <div class="bg-white rounded-xl shadow-lg border-2 border-gray-300 p-5">
            <div class="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div class="space-y-4">
              <div class="h-8 bg-gray-200 rounded"></div>
              <div class="h-8 bg-gray-200 rounded"></div>
              <div class="h-8 bg-gray-200 rounded"></div>
            </div>
          </div>

          <div class="bg-white rounded-xl shadow-lg border-2 border-gray-300 p-5">
            <div class="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div class="space-y-3">
              <div class="h-10 bg-gray-200 rounded"></div>
              <div class="h-10 bg-gray-200 rounded"></div>
            </div>
          </div>
        </aside>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <section class="md:col-span-2">
          <div
            class="bg-white rounded-xl shadow-lg border-2 border-gray-300 p-8.5 hover:border-green-text transition-all"
          >
            <h2
              class="text-green-text text-3xl font-semibold mb-6 pb-2 border-b-2 border-green-text/30"
            >
              Capstone Project Details
            </h2>

            <div class="space-y-5 text-base text-gray-800">
              <div class="bg-gray-100 border-2 border-gray-400 rounded-lg px-4 py-3 shadow-sm">
                <div class="text-xs font-bold uppercase tracking-wide text-gray-600 mb-1">
                  TITLE
                </div>
                <div class="text-gray-900 font-semibold text-base">{{ capstone?.title }}</div>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div class="bg-gray-100 border-2 border-gray-400 rounded-lg px-4 py-3 shadow-sm">
                  <div class="text-xs font-bold uppercase tracking-wide text-gray-600 mb-1">
                    AUTHORS
                  </div>
                  <div class="text-gray-900 font-medium text-base">
                    {{
                      capstone?.authors && capstone.authors.length
                        ? capstone.authors.join(', ')
                        : capstone?.groupName
                    }}
                  </div>
                </div>
                <div class="bg-gray-100 border-2 border-gray-400 rounded-lg px-4 py-3 shadow-sm">
                  <div class="text-xs font-bold uppercase tracking-wide text-gray-600 mb-2">
                    ADVISER
                  </div>
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="text-gray-900 font-medium text-base">{{
                      capstone?.adviserName
                    }}</span>
                  </div>
                </div>
              </div>

              <div class="bg-gray-100 border-2 border-gray-400 rounded-lg px-4 py-3 shadow-sm">
                <div class="text-xs font-bold uppercase tracking-wide text-gray-600 mb-1">
                  PROGRAM
                </div>
                <div class="text-gray-900 font-medium text-base">{{ capstone?.programCode }}</div>
              </div>

              <div class="bg-gray-100 border-2 border-gray-400 rounded-lg px-4 py-3 shadow-sm">
                <div class="text-xs font-bold uppercase tracking-wide text-gray-600 mb-1">
                  ACADEMIC YEAR
                </div>
                <div class="text-gray-900 font-medium text-base">2025 - 2026</div>
              </div>

              <div class="bg-gray-100 border-2 border-gray-400 rounded-lg px-4 py-3 shadow-sm">
                <div class="text-xs font-bold uppercase tracking-wide text-gray-600 mb-2">
                  ABSTRACT
                </div>
                <div class="bg-white border border-gray-300 rounded-lg p-3">
                  <p class="text-gray-700 leading-relaxed text-base">{{ capstone?.abstract }}</p>
                </div>
              </div>

              <div class="bg-gray-100 border-2 border-gray-400 rounded-lg px-4 py-3 shadow-sm">
                <div class="text-xs font-bold uppercase tracking-wide text-gray-600 mb-1">
                  Keywords
                </div>
                <div class="text-gray-900 font-medium text-base">
                  {{ (capstone?.keywords || []).join(', ') }}
                </div>
              </div>

              <div class="mt-4 pt-2 border-t-2 border-gray-300">
                <button
                  class="download-btn inline-flex items-center text-base px-6 py-3 bg-green-text text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition border-2 border-green-800 disabled:opacity-60 disabled:cursor-not-allowed"
                  :disabled="downloading"
                  @click="handleDownloadFiles"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-5 w-5 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 5v14m7-7H5" />
                  </svg>
                  {{ downloading ? 'Downloading...' : 'Download Files' }}
                </button>
              </div>
            </div>
          </div>

          <div
            v-if="canComment"
            class="mt-6 bg-white rounded-xl shadow-lg border-2 border-gray-300 p-5 hover:border-green-text transition-all"
          >
            <h3
              class="text-green-text text-xl font-semibold mb-4 pb-2 border-b-2 border-green-text/30"
            >
              Reviewer Comment
            </h3>
            <div class="space-y-3">
              <textarea
                v-model="commentText"
                rows="4"
                maxlength="1000"
                placeholder="Add your comment for this capstone submission"
                class="w-full rounded-lg border-2 border-gray-300 bg-gray-100 px-3 py-2 text-sm text-gray-800 outline-none focus:border-green-text"
              ></textarea>
              <div class="flex items-center justify-between gap-3">
                <span class="text-xs text-gray-600">{{ commentText.length }}/1000</span>
                <button
                  class="text-base px-4 py-2 bg-green-text text-white rounded-lg hover:bg-green-700 transition font-semibold shadow-md border-2 border-green-800 disabled:opacity-60 disabled:cursor-not-allowed"
                  :disabled="submittingComment || !commentText.trim()"
                  @click="handleSubmitComment"
                >
                  {{ submittingComment ? 'Submitting...' : 'Submit Comment' }}
                </button>
              </div>
              <p v-if="commentSuccessMessage" class="text-sm text-green-700">
                {{ commentSuccessMessage }}
              </p>
            </div>
          </div>

          <div
            v-if="canComment"
            class="mt-6 bg-white rounded-xl shadow-lg border-2 border-gray-300 p-5 hover:border-green-text transition-all"
          >
            <h3
              class="text-green-text text-xl font-semibold mb-4 pb-2 border-b-2 border-green-text/30"
            >
              Previous Comments
            </h3>

            <div v-if="loadingComments" class="text-sm text-gray-600">Loading comments...</div>

            <div v-else-if="!commentHistory.length" class="text-sm text-gray-600">
              No previous comments yet.
            </div>

            <div v-else class="max-h-80 md:max-h-[42vh] overflow-y-auto space-y-3 pr-1">
              <div
                v-for="entry in commentHistory"
                :key="entry.logId"
                class="rounded-lg border-2 border-gray-300 bg-gray-100 p-3 wrap-break-word"
              >
                <div class="flex items-start justify-between gap-2">
                  <div>
                    <div class="text-sm font-semibold text-gray-900">{{ entry.actorName }}</div>
                    <div class="text-xs uppercase tracking-wide text-gray-600">
                      {{ entry.actorRole || 'Reviewer' }}
                    </div>
                  </div>
                  <div class="text-xs text-gray-600">
                    {{ formatCommentDateTime(entry.changedAt) }}
                  </div>
                </div>
                <p
                  class="mt-2 text-sm leading-relaxed text-gray-800 whitespace-pre-line wrap-break-word"
                >
                  {{ entry.remarks }}
                </p>
              </div>
            </div>
          </div>
        </section>

        <aside class="space-y-6">
          <div
            class="bg-white rounded-xl shadow-lg border-2 border-gray-300 p-5 hover:border-green-text transition-all"
          >
            <h3
              class="text-green-text text-xl font-semibold mb-4 pb-2 border-b-2 border-green-text/30"
            >
              Info Summary
            </h3>
            <div class="text-base text-gray-700 space-y-4">
              <div class="bg-gray-100 border-2 border-gray-400 rounded-lg px-4 py-3 shadow-sm">
                <div class="text-xs font-bold uppercase tracking-wide text-gray-600 mb-1">
                  SUBMISSION DATE
                </div>
                <div class="text-gray-900 font-medium text-base">{{ capstone?.submittedAt }}</div>
              </div>

              <div class="bg-gray-100 border-2 border-gray-400 rounded-lg px-4 py-3 shadow-sm">
                <div class="text-xs font-bold uppercase tracking-wide text-gray-600 mb-1">
                  RESEARCH FIELD
                </div>
                <div class="text-gray-900 font-medium text-base">{{ capstone?.researchField }}</div>
              </div>

              <div class="bg-gray-100 border-2 border-gray-400 rounded-lg px-4 py-3 shadow-sm">
                <div class="text-xs font-bold uppercase tracking-wide text-gray-600 mb-1">
                  MONITORING STATUS
                </div>
                <div class="mt-1">
                  <span
                    :class="[
                      'inline-block px-4 py-1.5 rounded-full text-sm font-bold border-2 border-green-text/40',
                      statusBadgeClass,
                    ]"
                  >
                    {{ (capstone?.status || 'APPROVED').toUpperCase() }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div
            class="bg-white rounded-xl shadow-lg border-2 border-gray-300 p-5 hover:border-green-text transition-all"
          >
            <h3
              class="text-green-text text-xl font-semibold mb-4 pb-2 border-b-2 border-green-text/30"
            >
              Quick Actions
            </h3>
            <div class="space-y-3">
              <button
                class="w-full text-left text-base px-4 py-3 border-2 border-gray-400 bg-gray-100 rounded-lg hover:bg-gray-200 hover:border-green-text transition font-semibold text-gray-800 shadow-sm"
                @click="handleViewRelatedResearch"
              >
                View Related Research
              </button>
              <button
                class="w-full text-base px-4 py-3 bg-green-text text-white rounded-lg hover:bg-green-700 transition font-semibold shadow-md border-2 border-green-800 disabled:opacity-60 disabled:cursor-not-allowed"
                :disabled="fetchingSummary"
                @click="handleGenerateSummary"
              >
                {{ fetchingSummary ? 'Fetching Summary...' : 'Generate AI Summary' }}
              </button>
            </div>
          </div>
        </aside>
      </div>
    </main>

    <footer>
      <Footer />
    </footer>

    <div
      v-if="summaryModalVisible"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      @click.self="summaryModalVisible = false"
    >
      <div
        ref="summaryModalPanel"
        class="w-full max-w-3xl rounded-xl border-2 border-gray-300 bg-white shadow-2xl"
        :style="{ transform: `translate(${summaryModalOffsetX}px, ${summaryModalOffsetY}px)` }"
      >
        <div
          class="flex cursor-move select-none items-center justify-between border-b-3 border-gray-300 px-5 py-4 text-green-text"
          @pointerdown="startSummaryModalDrag"
        >
          <h4 class="text-lg font-semibold">AI Summary</h4>
          <button
            class="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-100"
            @click="summaryModalVisible = false"
          >
            Close
          </button>
        </div>

        <div class="max-h-[65vh] overflow-y-auto px-6 py-5 md:px-7 md:py-6">
          <p class="whitespace-pre-line leading-relaxed text-gray-800" style="text-align: justify">
            {{ summaryText }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Toast from 'primevue/toast'
import { useToast } from 'primevue/usetoast'
import Navbar from '@/components/Navbar.vue'
import NavbarFaculty from '@/components/NavbarFaculty.vue'
import NavbarCoordinator from '@/components/NavbarCoordinator.vue'
import NavbarAdmin from '@/components/NavbarAdmin.vue'
import Footer from '@/components/Footer.vue'
import {
  getCapstoneDetails,
  listCapstoneFiles,
  getCapstoneFileDownloadUrl,
  submitCapstoneComment,
  listCapstoneComments,
  generateCapstoneSummary,
} from '@/services/repositoryService'
import { getStoredUser } from '@/services/authService'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const user = ref(getStoredUser())
const capstone = ref(null)
const loading = ref(true)
const downloading = ref(false)
const fetchingSummary = ref(false)
const summaryModalVisible = ref(false)
const summaryText = ref('')
const summaryModalPanel = ref(null)
const summaryModalOffsetX = ref(0)
const summaryModalOffsetY = ref(0)
const commentText = ref('')
const submittingComment = ref(false)
const commentSuccessMessage = ref('')
const commentHistory = ref([])
const loadingComments = ref(false)
const draggingSummaryModal = ref(false)
let dragStartPointerX = 0
let dragStartPointerY = 0
let dragStartOffsetX = 0
let dragStartOffsetY = 0
const MIN_LOAD_MS = 300
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const onSummaryModalPointerMove = (event) => {
  if (!draggingSummaryModal.value) return

  const dx = event.clientX - dragStartPointerX
  const dy = event.clientY - dragStartPointerY

  summaryModalOffsetX.value = dragStartOffsetX + dx
  summaryModalOffsetY.value = dragStartOffsetY + dy
}

const stopSummaryModalDrag = () => {
  draggingSummaryModal.value = false
}

const startSummaryModalDrag = (event) => {
  if (event.button !== 0) return

  draggingSummaryModal.value = true
  dragStartPointerX = event.clientX
  dragStartPointerY = event.clientY
  dragStartOffsetX = summaryModalOffsetX.value
  dragStartOffsetY = summaryModalOffsetY.value
}

const getRepositoryRoute = () => {
  if (normalizedRoleName.value === 'faculty') return { name: 'faculty-repository' }
  if (normalizedRoleName.value === 'coordinator') return { name: 'coordinator-repository' }
  if (normalizedRoleName.value === 'admin') return { path: '/admin/repository' }
  return { name: 'repository-view' }
}

const handleViewRelatedResearch = () => {
  const keywordQuery = (capstone.value?.keywords || [])
    .map((keyword) => String(keyword || '').trim())
    .filter(Boolean)
    .join(' ')

  router.push({
    ...getRepositoryRoute(),
    query: keywordQuery ? { q: keywordQuery } : {},
  })
}

const normalizedRoleName = computed(() =>
  String(user.value?.roleName || '')
    .trim()
    .toLowerCase(),
)
const useAdminNavbar = computed(() => normalizedRoleName.value === 'admin')
const useFacultyNavbar = computed(() => normalizedRoleName.value === 'faculty')
const useCoordinatorNavbar = computed(() => normalizedRoleName.value === 'coordinator')
const isReviewerRole = computed(
  () => normalizedRoleName.value === 'faculty' || normalizedRoleName.value === 'coordinator',
)
const isFromSubmissionMonitoring = computed(
  () =>
    String(route.query.source || '')
      .trim()
      .toLowerCase() === 'monitoring',
)
const canComment = computed(() => isReviewerRole.value && isFromSubmissionMonitoring.value)

const statusSeverity = computed(() => {
  const s = capstone.value?.status
  if (s === 'Approved') return 'success'
  if (s === 'Revision Requested') return 'warn'
  if (s === 'Under Review') return 'info'
  if (s === 'Submitted') return 'contrast'
  if (s === 'Archived') return 'secondary'
  return 'secondary'
})

const statusBadgeClass = computed(() => {
  const s = capstone.value?.status
  if (s === 'Approved') return 'bg-green-highlight text-dark-green'
  if (s === 'Revision Requested') return 'bg-amber-100 text-amber-800'
  if (s === 'Under Review') return 'bg-blue-100 text-blue-800'
  if (s === 'Submitted') return 'bg-gray-200 text-gray-800'
  return 'bg-gray-100 text-gray-600'
})

const formatCommentDateTime = (value) => {
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

const getApiErrorMessage = (error) => {
  const payload = error?.response?.data
  const raw = payload?.error || payload?.detail || payload?.message || error?.message
  return String(raw || '').trim()
}

const triggerBrowserDownload = (url) => {
  const link = document.createElement('a')
  link.href = url
  link.target = '_blank'
  link.rel = 'noopener'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const loadComments = async (id) => {
  if (!canComment.value) {
    commentHistory.value = []
    return
  }

  loadingComments.value = true
  try {
    const data = await listCapstoneComments(id)
    commentHistory.value = Array.isArray(data) ? data : []
  } catch (e) {
    console.error('Failed to load capstone comments', e)
    commentHistory.value = []
  } finally {
    loadingComments.value = false
  }
}

const handleDownloadFiles = async () => {
  if (downloading.value) return

  const submissionId = Number(route.params.id)
  if (!Number.isInteger(submissionId) || submissionId <= 0) {
    alert('Invalid submission ID.')
    return
  }

  downloading.value = true
  try {
    const files = await listCapstoneFiles(submissionId)
    if (!files.length) {
      alert('No files found for this submission.')
      return
    }

    files.forEach((file, index) => {
      const delay = index * 180
      const url = getCapstoneFileDownloadUrl(file.fileId)
      setTimeout(() => triggerBrowserDownload(url), delay)
    })
  } catch (e) {
    console.error('Failed to download submission files', e)
    alert('Failed to download files. Please try again.')
  } finally {
    downloading.value = false
  }
}

const handleGenerateSummary = async () => {
  if (fetchingSummary.value) return

  const submissionId = Number(route.params.id)
  if (!Number.isInteger(submissionId) || submissionId <= 0) {
    toast.add({
      severity: 'error',
      summary: 'Invalid Submission',
      detail: 'Unable to fetch summary because the submission ID is invalid.',
      life: 3500,
    })
    return
  }

  fetchingSummary.value = true

  try {
    // Always fetch latest first to check current summary state
    const latest = await getCapstoneDetails(submissionId)
    if (latest) {
      capstone.value = {
        ...(capstone.value || {}),
        ...latest,
      }
    }

    const summary = String(latest?.summary || capstone.value?.summary || '').trim()

    // If summary already exists, just show it
    if (summary) {
      summaryText.value = summary
      summaryModalOffsetX.value = 0
      summaryModalOffsetY.value = 0
      summaryModalVisible.value = true

      toast.add({
        severity: 'success',
        summary: 'Summary Ready',
        detail: 'AI summary loaded successfully.',
        life: 2500,
      })
      return
    }

    // No summary — check if there's a file to generate from
    const hasFile = latest?.hasCapstonePaper || capstone.value?.hasCapstonePaper

    if (!hasFile) {
      toast.add({
        severity: 'warn',
        summary: 'No Capstone File',
        detail: 'This submission has no uploaded capstone paper. A summary cannot be generated.',
        life: 5000,
      })
      return
    }

    // Fire the job
    toast.add({
      severity: 'info',
      summary: 'Generating Summary',
      detail: 'AI summary generation has started. This may take a few minutes.',
      life: 4000,
    })

    const generated = await generateCapstoneSummary(submissionId)
    const generatedSummary = String(generated?.summary || '').trim()

    if (!generatedSummary) {
      toast.add({
        severity: 'warn',
        summary: 'Summary Not Yet Available',
        detail: 'The AI summary is still being generated or has not started yet. Try again in a few minutes.',
        life: 5000,
      })
      return
    }

    summaryText.value = generatedSummary
    summaryModalOffsetX.value = 0
    summaryModalOffsetY.value = 0
    summaryModalVisible.value = true

    toast.add({
      severity: 'success',
      summary: 'Summary Ready',
      detail: 'AI summary generated successfully.',
      life: 3000,
    })
  } catch (e) {
    console.error('Failed to fetch or generate summary', e)

    const backendError = getApiErrorMessage(e)
    if (backendError.toLowerCase().includes('no capstone paper file')) {
      toast.add({
        severity: 'warn',
        summary: 'No Capstone File',
        detail: backendError,
        life: 5000,
      })
      return
    }

    if (backendError) {
      toast.add({
        severity: 'error',
        summary: 'Summary Generation Failed',
        detail: backendError,
        life: 5500,
      })
      return
    }

    toast.add({
      severity: 'error',
      summary: 'Summary Generation Failed',
      detail: 'Could not generate summary. Please try again.',
      life: 4500,
    })
  } finally {
    fetchingSummary.value = false
  }
}

const handleSubmitComment = async () => {
  if (!canComment.value || submittingComment.value) return

  const remarks = commentText.value.trim()
  if (!remarks) return

  const submissionId = Number(route.params.id)
  if (!Number.isInteger(submissionId) || submissionId <= 0) {
    alert('Invalid submission ID.')
    return
  }

  submittingComment.value = true
  commentSuccessMessage.value = ''
  try {
    await submitCapstoneComment(submissionId, remarks)
    commentText.value = ''
    commentSuccessMessage.value = 'Comment submitted successfully.'
    await loadComments(submissionId)
  } catch (e) {
    console.error('Failed to submit capstone comment', e)
    alert('Failed to submit comment. Please try again.')
  } finally {
    submittingComment.value = false
  }
}

const load = async (id) => {
  loading.value = true
  const start = Date.now()
  try {
    const data = await getCapstoneDetails(id)
    const elapsed = Date.now() - start
    if (elapsed < MIN_LOAD_MS) await sleep(MIN_LOAD_MS - elapsed)
    capstone.value = data
  } catch (e) {
    console.error('Failed to load capstone details', e)
    capstone.value = null
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  window.addEventListener('pointermove', onSummaryModalPointerMove)
  window.addEventListener('pointerup', stopSummaryModalDrag)

  const id = route.params.id || null
  load(id)
  if (id) loadComments(id)
})

onUnmounted(() => {
  window.removeEventListener('pointermove', onSummaryModalPointerMove)
  window.removeEventListener('pointerup', stopSummaryModalDrag)
})

watch(
  () => route.params.id,
  (newId) => {
    if (newId) {
      load(newId)
      loadComments(newId)
    }
  },
)
</script>
