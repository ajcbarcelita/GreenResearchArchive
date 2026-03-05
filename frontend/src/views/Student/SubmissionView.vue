<script setup>
import { computed, ref } from 'vue'
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

const toast = useToast()

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
  title: 'Green Archive: A Capstone Repository Platform for DLSU CCS',
  abstract:
    'Green Archive centralizes capstone submissions, review workflows, and project discoverability for students and faculty.',
  repositoryLink: 'https://github.com/org/green-archive',
  demoLink: 'https://green-archive-demo.example.com',
})

const requiredChecklist = ref([
  { id: 1, label: 'Final Manuscript (PDF)', done: true },
  { id: 2, label: 'Source Code Archive (.zip)', done: false },
  { id: 3, label: 'Presentation Deck (PPT/PDF)', done: false },
  { id: 4, label: 'Deployment/Run Guide', done: true },
])

const submissionHistory = ref([
  {
    version: 'v0.8',
    submittedAt: '2026-02-18 19:40',
    submittedBy: 'John Kirbie Mendoza',
    status: 'Needs Revision',
    reviewerComment: 'Update methodology scope and refine abstract alignment.',
  },
  {
    version: 'v0.9',
    submittedAt: '2026-02-26 15:12',
    submittedBy: 'Mika Reyes',
    status: 'Needs Revision',
    reviewerComment: 'Attach missing source code archive and update section references.',
  },
])

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

function handleUpload() {
  toast.add({
    severity: 'success',
    summary: 'Upload queued',
    detail: 'Your file was added to this draft submission.',
    life: 3000,
  })
}

function saveDraft() {
  toast.add({
    severity: 'info',
    summary: 'Draft saved',
    detail: 'Your current submission data was saved as draft.',
    life: 3000,
  })
}

function submitFinal() {
  if (!canSubmit.value) {
    toast.add({
      severity: 'warn',
      summary: 'Incomplete requirements',
      detail: 'Complete all required fields and files before submitting.',
      life: 3500,
    })
    return
  }

  status.value = 'Submitted'
  submissionHistory.value.unshift({
    version: form.value.version,
    submittedAt: '2026-03-05 10:15',
    submittedBy: 'John Kirbie Mendoza',
    status: 'Submitted',
    reviewerComment: 'Pending adviser review.',
  })

  toast.add({
    severity: 'success',
    summary: 'Submission sent',
    detail: 'Your milestone submission has been sent for review.',
    life: 3500,
  })
}
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
            <h2 class="record-id">Group 4 - CAPIT3</h2>
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
              <Button label="Save Draft" severity="secondary" outlined @click="saveDraft" />
              <Button label="Submit" :disabled="!canSubmit" @click="submitFinal" />
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
            <FileUpload
              mode="advanced"
              chooseLabel="Choose Files"
              uploadLabel="Queue Upload"
              cancelLabel="Clear"
              :multiple="true"
              accept=".pdf,.zip,.ppt,.pptx,.doc,.docx"
              :maxFileSize="15000000"
              @upload="handleUpload"
            >
              <template #empty>
                <p class="support-text">Drag and drop files here. Accepted: PDF, ZIP, PPT, DOC (max 15 MB each).</p>
              </template>
            </FileUpload>
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

.panel-card:hover,
.panel-card-accent:hover {
  border-color: #0e662e; 
}
</style>
