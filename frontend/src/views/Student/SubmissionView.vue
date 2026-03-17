<script setup>
import { computed, onMounted, ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import FileUpload from 'primevue/fileupload'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Tag from 'primevue/tag'
import Textarea from 'primevue/textarea'
import Toast from 'primevue/toast'
import Navbar from '@/components/Navbar.vue'
import Footer from '@/components/Footer.vue'
import {
  deleteCurrentSubmissionFile,
  getCurrentSubmission,
  saveCurrentSubmission,
  submitCurrentSubmission,
  uploadCurrentSubmissionFile,
} from '@/services/studentSubmissionService'

const toast = useToast()
const loading = ref(false)
const saving = ref(false)
const submitting = ref(false)
const uploading = ref(false)
const submissionFiles = ref([])
const currentSubmissionId = ref(null)
const currentGroupName = ref('No Group')

const status = ref('Draft')

const milestoneOptions = [
  { label: 'Proposal', value: 'proposal' },
  { label: 'Chapter 1-3', value: 'chapter_1_3' },
  { label: 'Final Manuscript', value: 'final_manuscript' },
  { label: 'Poster', value: 'poster' },
  { label: 'Source Code', value: 'source_code' },
]

const selectedMilestone = ref(milestoneOptions[2])

const form = ref({
  version: 'v1.0',
  title: '',
  abstract: '',
  repositoryLink: 'https://github.com/org/green-archive',
  demoLink: 'https://green-archive-demo.example.com',
})

const requiredChecklist = ref([
  { id: 1, label: 'Final Manuscript (PDF)', done: true },
  { id: 2, label: 'Source Code Archive (.zip)', done: false },
  { id: 3, label: 'Presentation Deck (PPT/PDF)', done: false },
  { id: 4, label: 'Deployment/Run Guide', done: true },
])

const submissionHistory = ref([])

const parseVersionNo = () => {
  const raw = String(form.value.version || '').trim().toLowerCase().replace(/^v/, '')
  const parsed = Number.parseInt(raw, 10)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1
}

const loadSubmission = async () => {
  loading.value = true
  try {
    const response = await getCurrentSubmission()
    const submission = response?.submission
    const files = response?.files || []
    const history = response?.history || []
    const group = response?.group || null

    currentSubmissionId.value = submission?.submissionId || null
    status.value = submission?.status || 'Draft'
    currentGroupName.value = group?.groupName || 'No Group'

    form.value.version = submission?.versionNo ? `v${submission.versionNo}` : 'v1.0'
    form.value.title = submission?.title || ''
    form.value.abstract = submission?.abstract || ''

    submissionFiles.value = files
    submissionHistory.value = history.map((item) => ({
      version: `v${item.versionNo}`,
      submittedAt: item.submittedAt || item.createdAt || 'N/A',
      submittedBy: 'Group Member',
      status: item.status,
      reviewerComment: item.status === 'Submitted' ? 'Pending review.' : 'Saved as draft.',
    }))

    requiredChecklist.value = requiredChecklist.value.map((item) => ({
      ...item,
      done: files.length > 0 ? item.done || true : item.done,
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

const completionCount = computed(
  () => requiredChecklist.value.filter((item) => item.done).length,
)

const canSubmit = computed(
  () =>
    Boolean(form.value.version.trim()) &&
    Boolean(form.value.title.trim()) &&
    Boolean(form.value.abstract.trim()) &&
    requiredChecklist.value.every((item) => item.done),
)

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
        versionNo: parseVersionNo(),
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
      title: form.value.title,
      abstract: form.value.abstract,
      versionNo: parseVersionNo(),
      keywords: [],
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

async function submitFinal() {
  if (!canSubmit.value) {
    toast.add({
      severity: 'warn',
      summary: 'Incomplete requirements',
      detail: 'Complete all required fields and files before submitting.',
      life: 3500,
    })
    return
  }

  submitting.value = true
  try {
    await submitCurrentSubmission()
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
    await deleteCurrentSubmissionFile(fileId)
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
            <h1 class="headline">Final Manuscript Milestone</h1>
            <p class="support-text">
              Complete the required files and metadata before finalizing your submission.
            </p>
          </template>
        </Card>

        <Card class="panel-card panel-card-accent md:col-span-4">
          <template #content>
            <p class="kicker">Current Status</p>
            <h2 class="record-id">{{ currentGroupName }}</h2>
            <div class="mt-2 flex flex-wrap gap-2">
              <Tag :value="status" :severity="statusSeverity" rounded />
              <Tag value="A.Y. 2025-2026" severity="secondary" rounded />
            </div>
            <p class="support-text mt-3">
              {{ completionCount }}/{{ requiredChecklist.length }} required items complete.
            </p>
          </template>
        </Card>
      </section>

      <section class="mt-4 grid gap-4 md:grid-cols-12">
        <Card class="panel-card md:col-span-8">
          <template #title>Submission Details</template>
          <template #content>
            <div class="grid gap-4 sm:grid-cols-2">
              <div class="field-wrap">
                <label class="field-label">Milestone</label>
                <Select
                  v-model="selectedMilestone"
                  :options="milestoneOptions"
                  optionLabel="label"
                  placeholder="Select milestone"
                  class="w-full"
                />
              </div>

              <div class="field-wrap">
                <label class="field-label">Version <span class="req">*</span></label>
                <InputText v-model="form.version" class="w-full" placeholder="e.g., v1.0" />
              </div>
            </div>

            <div class="mt-4 field-wrap">
              <label class="field-label">Submission Title <span class="req">*</span></label>
              <InputText v-model="form.title" class="w-full" placeholder="Enter title" />
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
                <InputText v-model="form.repositoryLink" class="w-full" placeholder="https://" />
              </div>
              <div class="field-wrap">
                <label class="field-label">Demo Link</label>
                <InputText v-model="form.demoLink" class="w-full" placeholder="https://" />
              </div>
            </div>

            <div class="mt-5 flex flex-wrap gap-2">
              <Button label="Save Draft" severity="secondary" outlined :loading="saving" @click="saveDraft" />
              <Button label="Submit" :disabled="!canSubmit || loading" :loading="submitting" @click="submitFinal" />
            </div>
          </template>
        </Card>

        <Card class="panel-card md:col-span-4">
          <template #title>Requirements Checklist</template>
          <template #content>
            <div class="space-y-2">
              <label
                v-for="item in requiredChecklist"
                :key="item.id"
                class="check-item"
              >
                <input v-model="item.done" type="checkbox" class="h-4 w-4 accent-[#1d9f58]" />
                <span>{{ item.label }}</span>
              </label>
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
                  <template #empty>
                    <p class="support-text">Drag and drop files here.</p>
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
                  <Column field="fileSize" header="Size (bytes)" />
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
            <DataTable :value="submissionHistory" stripedRows size="small" responsiveLayout="scroll">
              <Column field="version" header="Version" />
              <Column field="submittedAt" header="Submitted At" />
              <Column field="submittedBy" header="Submitted By" />
              <Column field="status" header="Status">
                <template #body="slotProps">
                  <Tag :value="slotProps.data.status" :severity="slotProps.data.status === 'Submitted' ? 'info' : 'warn'" rounded />
                </template>
              </Column>
              <Column field="reviewerComment" header="Reviewer Comment" />
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
  transition: border-color 200ms ease, box-shadow 200ms ease;
}

.panel-card-accent {
  background: linear-gradient(150deg, #ffffff 20%, #e9f8ef 100%);
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

.record-id {
  margin-top: 0.3rem;
  color: #17362b;
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

.field-label {
  font-size: 0.85rem;
  color: #274336;
  font-weight: 700;
}

.req {
  color: #d22020;
}

.check-item {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  border: 1px solid #d5e2db;
  border-radius: 0.65rem;
  background: #f9fcfa;
  padding: 0.55rem 0.7rem;
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
