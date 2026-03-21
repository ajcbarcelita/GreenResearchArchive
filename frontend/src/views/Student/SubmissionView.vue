<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import FileUpload from 'primevue/fileupload'
import InputText from 'primevue/inputtext'
import Tag from 'primevue/tag'
import Textarea from 'primevue/textarea'
import Toast from 'primevue/toast'
import Navbar from '@/components/Navbar.vue'
import Footer from '@/components/Footer.vue'
import { getStoredUser } from '@/services/authService'
import {
  deleteCurrentSubmissionFile,
  getCurrentSubmission,
  saveCurrentSubmission,
  submitCurrentSubmission,
  uploadCurrentSubmissionFile,
} from '@/services/studentSubmissionService'

const route = useRoute()
const toast = useToast()

const currentTaskId = computed(() => {
  const val = route.query.taskId
  return val ? Number(val) : null
})
const currentTaskName = ref('')
const currentAcademicYear = ref('')
const currentTermNo = ref(null)
const currentReviewerName = ref('Not assigned')
const currentSubmitterName = ref('Unknown User')
const loading = ref(false)
const saving = ref(false)
const submitting = ref(false)
const uploading = ref(false)
const submissionFiles = ref([])
const currentSubmissionId = ref(null)
const currentGroupName = ref('No Group')
const currentVersionNo = ref(null)

const status = ref('Draft')

const termLabel = (termNo) => {
  if (termNo === 1) return '1st Semester'
  if (termNo === 2) return '2nd Semester'
  if (termNo === 3) return '3rd Semester'
  return termNo ? `Term ${termNo}` : ''
}

const academicYearLabel = computed(() => {
  return currentAcademicYear.value ? `A.Y. ${currentAcademicYear.value}` : 'Academic Year TBD'
})

const submissionHeadline = computed(() => {
  return currentTaskName.value || 'Submission Task'
})

const submissionSupportText = computed(() => {
  const pieces = []

  if (currentAcademicYear.value && currentTermNo.value) {
    pieces.push(`${academicYearLabel.value} • ${termLabel(currentTermNo.value)}`)
  } else if (currentAcademicYear.value) {
    pieces.push(academicYearLabel.value)
  }

  pieces.push('Complete the required files and metadata before finalizing your submission.')
  return pieces.join(' • ')
})

const form = ref({
  title: '',
  keywords: '',
  researchFields: '',
  abstract: '',
  repositoryLink: '',
  demoLink: '',
})

const submissionHistory = ref([])

const formatFileSizeMb = (value) => {
  const bytes = Number(value)
  if (!Number.isFinite(bytes) || bytes <= 0) return '0.00 MB'
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

const formatPhilippineDateTime = (value) => {
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

const normalizeOptionalInput = (value) => {
  const trimmed = String(value || '').trim()
  return trimmed ? trimmed : null
}

const parseCsvValues = (value) => {
  return String(value || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
}

const requiresKeywordAndResearchField = computed(() => {
  const taskName = String(currentTaskName.value || '').toLowerCase()
  return taskName.includes('manuscript') || taskName.includes('chapter')
})

const formatStoredUserName = (user) => {
  if (!user) return 'Unknown User'

  return (
    [user.firstName, user.middleName, user.lastName].filter(Boolean).join(' ') ||
    user.email ||
    'Unknown User'
  )
}

const loadSubmission = async () => {
  loading.value = true
  try {
    currentSubmitterName.value = formatStoredUserName(getStoredUser())
    const response = await getCurrentSubmission(currentTaskId.value)
    const submission = response?.submission
    const files = response?.files || []
    const history = response?.history || []
    const group = response?.group || null
    const reviewer = response?.reviewer || null

    currentSubmissionId.value = submission?.submissionId || null
    currentVersionNo.value = submission?.versionNo || null
    status.value = submission?.status || 'Draft'
    currentGroupName.value = group?.groupName || 'No Group'
    currentReviewerName.value = reviewer?.reviewerName || 'Not assigned'

    form.value.title = submission?.title || ''
    form.value.keywords = Array.isArray(submission?.keywords) ? submission.keywords.join(', ') : ''
    form.value.researchFields = Array.isArray(submission?.researchFields)
      ? submission.researchFields.join(', ')
      : ''
    form.value.abstract = submission?.abstract || ''
    form.value.repositoryLink = submission?.repositoryLink || ''
    form.value.demoLink = submission?.demoLink || ''

    submissionFiles.value = files
    currentTaskName.value = response?.task?.taskName || ''
    currentAcademicYear.value = response?.task?.academicYear || ''
    currentTermNo.value = response?.task?.termNo || null
    const effectiveTaskId =
      currentTaskId.value || response?.task?.taskId || submission?.taskId || null
    const filteredHistory = effectiveTaskId
      ? history.filter((item) => Number(item?.taskId) === Number(effectiveTaskId))
      : history

    submissionHistory.value = filteredHistory.map((item) => ({
      version: `v${item.versionNo}`,
      submittedAt: formatPhilippineDateTime(item.submittedAt || item.createdAt),
      submittedBy: currentSubmitterName.value,
      status: item.status,
    }))
  } catch (error) {
    console.error('Failed to load submission', error)
    toast.add({
      severity: 'error',
      summary: 'Load failed',
      detail: error?.response?.data?.message || 'Unable to fetch submission data.',
      life: 3500,
    })
  } finally {
    loading.value = false
  }
}

const canSubmit = computed(
  () =>
    Boolean(form.value.title.trim()) &&
    Boolean(form.value.abstract.trim()) &&
    submissionFiles.value.length > 0 &&
    (!requiresKeywordAndResearchField.value ||
      (parseCsvValues(form.value.keywords).length > 0 &&
        parseCsvValues(form.value.researchFields).length > 0)),
)

const assignedVersionLabel = computed(() => {
  if (!currentVersionNo.value) return 'Will be assigned on first save'

  const nextVersion =
    status.value === 'Draft' ? currentVersionNo.value : Number(currentVersionNo.value) + 1

  return `v${nextVersion}`
})

const statusSeverity = computed(() => {
  if (status.value === 'Approved') return 'success'
  if (status.value === 'Needs Revision') return 'warn'
  if (status.value === 'Rejected') return 'danger'
  return 'info'
})

async function handleUpload(event) {
  const files = event?.files || []
  if (!files.length) return

  if (!currentSubmissionId.value) {
    toast.add({
      severity: 'warn',
      summary: 'Save draft first',
      detail: 'Please save your draft before uploading files.',
      life: 3000,
    })
    return
  }

  uploading.value = true
  try {
    for (const file of files) {
      await uploadCurrentSubmissionFile({
        file,
        taskId: currentTaskId.value,
      })
    }

    toast.add({
      severity: 'success',
      summary: 'Upload complete',
      detail: 'File(s) uploaded to S3 and linked to this submission.',
      life: 3200,
    })
    await loadSubmission()
  } catch (error) {
    console.error('Upload failed', error)
    toast.add({
      severity: 'error',
      summary: 'Upload failed',
      detail: error?.response?.data?.message || 'Unable to upload file(s).',
      life: 3500,
    })
  } finally {
    uploading.value = false
  }
}

async function saveDraft() {
  saving.value = true
  try {
    await saveCurrentSubmission({
      ...(currentTaskId.value ? { taskId: currentTaskId.value } : {}),
      title: form.value.title,
      abstract: form.value.abstract,
      keywords: parseCsvValues(form.value.keywords),
      researchFields: parseCsvValues(form.value.researchFields),
      repositoryLink: normalizeOptionalInput(form.value.repositoryLink),
      demoLink: normalizeOptionalInput(form.value.demoLink),
    })

    toast.add({
      severity: 'info',
      summary: 'Draft saved',
      detail: 'Your current submission data was saved as draft.',
      life: 3000,
    })
    await loadSubmission()
  } catch (error) {
    console.error('Save draft failed', error)
    toast.add({
      severity: 'error',
      summary: 'Save failed',
      detail: error?.response?.data?.message || 'Unable to save draft.',
      life: 3500,
    })
  } finally {
    saving.value = false
  }
}

const buildSubmissionPayload = () => ({
  ...(currentTaskId.value ? { taskId: currentTaskId.value } : {}),
  title: form.value.title,
  abstract: form.value.abstract,
  keywords: parseCsvValues(form.value.keywords),
  researchFields: parseCsvValues(form.value.researchFields),
  repositoryLink: normalizeOptionalInput(form.value.repositoryLink),
  demoLink: normalizeOptionalInput(form.value.demoLink),
})

async function submitFinal() {
  if (!canSubmit.value) {
    toast.add({
      severity: 'warn',
      summary: 'Incomplete submission',
      detail: requiresKeywordAndResearchField.value
        ? 'Complete all required fields, including Keywords and Research Field, and upload at least one file.'
        : 'Complete all required fields and upload at least one file before submitting.',
      life: 3500,
    })
    return
  }

  submitting.value = true
  try {
    await saveCurrentSubmission(buildSubmissionPayload())
    await submitCurrentSubmission(currentTaskId.value)
    toast.add({
      severity: 'success',
      summary: 'Submission sent',
      detail: 'Your milestone submission has been sent for review.',
      life: 3500,
    })
    await loadSubmission()
  } catch (error) {
    console.error('Submit failed', error)
    toast.add({
      severity: 'error',
      summary: 'Submit failed',
      detail: error?.response?.data?.message || 'Unable to submit this draft.',
      life: 3500,
    })
  } finally {
    submitting.value = false
  }
}

async function removeFile(fileId) {
  try {
    await deleteCurrentSubmissionFile(fileId, currentTaskId.value)
    toast.add({
      severity: 'success',
      summary: 'File removed',
      detail: 'The file was deleted from this submission.',
      life: 2600,
    })
    await loadSubmission()
  } catch (error) {
    console.error('Delete file failed', error)
    toast.add({
      severity: 'error',
      summary: 'Delete failed',
      detail: error?.response?.data?.message || 'Unable to delete file.',
      life: 3500,
    })
  }
}

onMounted(() => {
  loadSubmission()
})
</script>

<template>
  <div class="submission-page min-h-screen flex flex-col font-Karla">
    <Toast />

    <header>
      <Navbar />
    </header>

    <main class="mx-auto w-full max-w-7xl flex-1 px-4 pb-8 pt-24 sm:px-6 sm:pt-28 lg:pt-32">
      <section class="grid gap-4 md:grid-cols-12">
        <Card class="panel-card md:col-span-8">
          <template #content>
            <p class="kicker">Capstone Submission</p>
            <h1 class="headline">{{ submissionHeadline }}</h1>
            <p class="support-text">
              {{ submissionSupportText }}
            </p>
          </template>
        </Card>

        <Card class="panel-card panel-card-accent md:col-span-4">
          <template #content>
            <p class="kicker">Current Status</p>
            <h2 class="record-id">{{ currentGroupName }}</h2>
            <div class="mt-2 flex flex-wrap gap-2">
              <Tag :value="status" :severity="statusSeverity" rounded />
              <Tag :value="academicYearLabel" severity="secondary" rounded />
              <Tag
                v-if="currentTermNo"
                :value="termLabel(currentTermNo)"
                severity="contrast"
                rounded
              />
            </div>
            <p class="support-text mt-3">Reviewer: {{ currentReviewerName }}</p>
          </template>
        </Card>
      </section>

      <section class="mt-4 grid gap-4 md:grid-cols-12">
        <Card class="panel-card md:col-span-12">
          <template #title>Submission Details</template>
          <template #content>
            <div class="version-display">
              <span class="field-label">Assigned Version</span>
              <Tag :value="assignedVersionLabel" severity="secondary" rounded />
            </div>
            <p class="support-text">Version is assigned automatically by the system.</p>

            <div class="mt-4 field-wrap">
              <label class="field-label">Submission Title <span class="req">*</span></label>
              <InputText v-model="form.title" class="w-full" placeholder="Enter title" />
            </div>

            <div v-if="requiresKeywordAndResearchField" class="mt-4 grid gap-4 sm:grid-cols-2">
              <div class="field-wrap">
                <label class="field-label">Keywords <span class="req">*</span></label>
                <InputText
                  v-model="form.keywords"
                  class="w-full"
                  placeholder="e.g., machine learning, NLP, recommendation"
                />
                <small class="support-text">Separate entries with commas.</small>
              </div>
              <div class="field-wrap">
                <label class="field-label">Research Field <span class="req">*</span></label>
                <InputText
                  v-model="form.researchFields"
                  class="w-full"
                  placeholder="e.g., Artificial Intelligence, Data Science"
                />
                <small class="support-text">Separate entries with commas.</small>
              </div>
            </div>

            <div class="mt-4 field-wrap">
              <label class="field-label">Abstract / Notes <span class="req">*</span></label>
              <Textarea
                v-model="form.abstract"
                class="w-full"
                autoResize
                rows="5"
                placeholder="Describe what changed in this submission"
              />
            </div>

            <div class="mt-4 grid gap-4 sm:grid-cols-2">
              <div class="field-wrap">
                <label class="field-label">Repository Link</label>
                <InputText
                  v-model="form.repositoryLink"
                  class="w-full"
                  placeholder="https://github.com/your-org/your-repository"
                />
              </div>
              <div class="field-wrap">
                <label class="field-label">Demo Link</label>
                <InputText
                  v-model="form.demoLink"
                  class="w-full"
                  placeholder="https://your-demo-url.example.com"
                />
              </div>
            </div>

            <div class="mt-5 flex flex-wrap gap-2">
              <Button
                label="Save Draft"
                severity="secondary"
                outlined
                :loading="saving"
                @click="saveDraft"
              />
              <Button
                label="Submit"
                :disabled="!canSubmit || loading || saving || submitting"
                :loading="submitting"
                @click="submitFinal"
              />
            </div>
          </template>
        </Card>
      </section>

      <section class="mt-4 grid gap-4 md:grid-cols-12">
        <Card class="panel-card md:col-span-12">
          <template #title>Upload Files</template>
          <template #content>
            <div class="upload-layout">
              <div class="upload-pane">
                <div class="upload-pane-header">
                  <h3 class="upload-pane-title">Attach Submission Files</h3>
                  <p class="upload-pane-caption">
                    Accepted: PDF, ZIP, PPT, DOC. Maximum 15 MB per file.
                  </p>
                  <p v-if="!currentSubmissionId" class="upload-warning">
                    Save the draft first to enable uploads.
                  </p>
                </div>

                <FileUpload
                  mode="advanced"
                  :customUpload="true"
                  chooseLabel="Choose Files"
                  uploadLabel="Upload to S3"
                  cancelLabel="Clear"
                  :multiple="true"
                  accept=".pdf,.zip,.ppt,.pptx,.doc,.docx"
                  :maxFileSize="15000000"
                  :disabled="uploading || !currentSubmissionId"
                  @uploader="handleUpload"
                >
                  <template #content="{ files, removeFileCallback }">
                    <div v-if="files?.length" class="queued-files">
                      <div
                        v-for="(file, index) in files"
                        :key="`${file.name}-${file.size}-${index}`"
                        class="queued-file-row"
                      >
                        <span class="queued-file-name">{{ file.name }}</span>
                        <button
                          type="button"
                          class="queued-file-remove"
                          @click="removeFileCallback(index)"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                    <p v-else class="support-text">Drag and drop files here.</p>
                  </template>
                </FileUpload>
              </div>

              <div class="files-pane">
                <div class="upload-pane-header files-header">
                  <h3 class="upload-pane-title">Uploaded Files</h3>
                  <Tag :value="`${submissionFiles.length} file(s)`" severity="secondary" />
                </div>

                <DataTable
                  :value="submissionFiles"
                  size="small"
                  responsiveLayout="scroll"
                  stripedRows
                  class="files-table"
                  :emptyMessage="'No files uploaded yet.'"
                >
                  <Column field="fileName" header="File" />
                  <Column field="fileType" header="Type" />
                  <Column header="Size (MB)">
                    <template #body="slotProps">
                      {{ formatFileSizeMb(slotProps.data.fileSize) }}
                    </template>
                  </Column>
                  <Column field="uploadedAt" header="Uploaded At" />
                  <Column header="Actions">
                    <template #body="slotProps">
                      <Button
                        text
                        severity="danger"
                        size="small"
                        icon="pi pi-trash"
                        label="Delete"
                        @click="removeFile(slotProps.data.fileId)"
                      />
                    </template>
                  </Column>
                </DataTable>
              </div>
            </div>
          </template>
        </Card>
      </section>

      <section class="mt-4 grid gap-4 md:grid-cols-12 pb-6">
        <Card class="panel-card md:col-span-12">
          <template #title>Submission History</template>
          <template #content>
            <DataTable
              :value="submissionHistory"
              stripedRows
              size="small"
              responsiveLayout="scroll"
              paginator
              :rows="5"
            >
              <Column field="version" header="Version" />
              <Column field="submittedAt" header="Submitted At" />
              <Column field="submittedBy" header="Submitted By" />
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
    </main>

    <footer>
      <Footer />
    </footer>
  </div>
</template>

<style scoped>
.submission-page {
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

.panel-card-accent {
  background: linear-gradient(150deg, #ffffff 20%, #e9f8ef 100%);
}

.kicker {
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.78rem;
  color: #4f695b;
  font-weight: 700;
}

.support-text {
  margin-top: 0.65rem;
  color: #4c6658;
}

.field-wrap {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.version-display {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.field-label {
  font-size: 0.85rem;
  color: #274336;
  font-weight: 700;
}

.req {
  color: #d22020;
}

.upload-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

.upload-pane,
.files-pane {
  border: 1px solid #d7e5dd;
  border-radius: 0.85rem;
  background: #fbfdfc;
  padding: 0.9rem;
}

.upload-pane-header {
  margin-bottom: 0.65rem;
}

.upload-pane-title {
  margin: 0;
  color: #19392d;
  font-weight: 700;
  font-size: 1rem;
}

.upload-pane-caption {
  margin: 0.35rem 0 0;
  color: #557164;
  font-size: 0.85rem;
}

.upload-warning {
  margin: 0.45rem 0 0;
  color: #9a5d12;
  font-size: 0.82rem;
  font-weight: 700;
}

.files-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.files-table {
  border-top: 1px dashed #d5e2db;
  padding-top: 0.5rem;
}

.queued-files {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  border-top: 1px dashed #d5e2db;
  margin-top: 0.75rem;
  padding-top: 0.75rem;
}

.queued-file-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.queued-file-name {
  color: #19392d;
  font-size: 0.95rem;
  line-height: 1.35;
  word-break: break-word;
}

.queued-file-remove {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  background: transparent;
  color: #dc2626;
  cursor: pointer;
  padding: 0.25rem 0.4rem;
  border-radius: 0.5rem;
  flex: 0 0 auto;
  font-size: 0.88rem;
  font-weight: 700;
}

.queued-file-remove:hover {
  background: rgba(220, 38, 38, 0.08);
}

.panel-card:hover,
.panel-card-accent:hover {
  border-color: #0e662e;
}

@media (min-width: 980px) {
  .upload-layout {
    grid-template-columns: minmax(18rem, 0.95fr) minmax(0, 1.3fr);
    align-items: start;
  }
}
</style>
