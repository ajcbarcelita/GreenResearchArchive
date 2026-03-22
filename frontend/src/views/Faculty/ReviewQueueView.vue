<script setup>
import { ref, onMounted } from 'vue'
import NavbarFaculty from '@/components/NavbarFaculty.vue'
import Footer from '@/components/Footer.vue'
import { getReviewQueue, updateSubmissionStatus, deleteSubmission } from '@/services/advisoryService'
import { useToast } from 'primevue/usetoast'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Dialog from 'primevue/dialog'
import Textarea from 'primevue/textarea'
import InputText from 'primevue/inputtext'

const toast = useToast()
const submissions = ref([])
const loading = ref(true)
const selectedSubmission = ref(null)
const showReviewDialog = ref(false)
const remarks = ref('')
const processing = ref(false)

const fetchSubmissions = async () => {
  loading.value = true
  try {
    submissions.value = await getReviewQueue()
  } catch (error) {
    console.error('Error fetching review queue:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load review queue.',
      life: 3000,
    })
  } finally {
    loading.value = false
  }
}

const getStatusSeverity = (status) => {
  switch (status) {
    case 'Submitted':
      return 'info'
    case 'Under Review':
      return 'warn'
    case 'Approved':
      return 'success'
    case 'Revision Requested':
      return 'danger'
    case 'Draft':
      return 'secondary'
    default:
      return null
  }
}

const openReview = (submission) => {
  selectedSubmission.value = submission
  remarks.value = ''
  showReviewDialog.value = true
  
  // If status is 'Submitted', automatically move to 'Under Review'
  if (submission.status === 'Submitted') {
    handleStatusUpdate('Under Review', 'Started review process.', false)
  }
}

const handleStatusUpdate = async (newStatus, customRemarks = null, closeDialog = true) => {
  processing.value = true
  try {
    const finalRemarks = customRemarks !== null ? customRemarks : remarks.value
    await updateSubmissionStatus(selectedSubmission.value.submission_id, newStatus, finalRemarks)
    
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: `Submission status updated to ${newStatus}.`,
      life: 3000,
    })
    
    if (closeDialog) {
      showReviewDialog.value = false
    }
    await fetchSubmissions()
  } catch (error) {
    console.error('Error updating status:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to update status.',
      life: 3000,
    })
  } finally {
    processing.value = false
  }
}

const handleDeleteSubmission = async () => {
  if (!confirm('Are you sure you want to permanently DELETE this submission? This action cannot be undone.')) {
    return
  }
  
  processing.value = true
  try {
    await deleteSubmission(selectedSubmission.value.submission_id)
    toast.add({
      severity: 'success',
      summary: 'Deleted',
      detail: 'Submission has been permanently deleted.',
      life: 3000,
    })
    showReviewDialog.value = false
    await fetchSubmissions()
  } catch (error) {
    console.error('Error deleting submission:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to delete submission.',
      life: 3000,
    })
  } finally {
    processing.value = false
  }
}

const downloadFile = (file) => {
  const url = `${import.meta.env.VITE_API_BASE_URL}/api/repository/files/${file.file_id}/download`
  window.open(url, '_blank')
}

onMounted(fetchSubmissions)
</script>

<template>
  <div class="min-h-screen flex flex-col bg-linear-to-b from-[#eaf4ee] to-[#f8fbf9] font-Karla">
    <header>
      <NavbarFaculty />
    </header>

    <main class="flex-1 px-4 pt-24 pb-12 sm:px-6 sm:pt-28 lg:px-8">
      <div class="max-w-7xl mx-auto">
        <div class="mb-8">
          <h1 class="text-3xl font-extrabold text-[#17362b]">Review Queue</h1>
          <p class="mt-2 text-[#355347]">
            Inspect and validate submissions from your advisee groups.
          </p>
        </div>

        <div class="bg-white rounded-2xl shadow-sm border border-[#cfe0d6] overflow-hidden">
          <DataTable
            :value="submissions"
            :loading="loading"
            stripedRows
            paginator
            :rows="10"
            responsiveLayout="scroll"
            class="p-datatable-sm"
          >
            <template #empty>
              <div class="py-12 text-center text-gray-500">No submissions pending review.</div>
            </template>

            <Column field="group_name" header="Group" sortable style="width: 15%"></Column>
            <Column field="title" header="Project Title" sortable style="width: 35%"></Column>
            <Column field="program_code" header="Program" sortable style="width: 10%"></Column>
            <Column field="submitted_at" header="Submitted At" sortable style="width: 15%">
              <template #body="{ data }">
                {{ data.submitted_at ? new Date(data.submitted_at).toLocaleDateString() : 'N/A' }}
              </template>
            </Column>
            <Column field="status" header="Status" sortable style="width: 15%">
              <template #body="{ data }">
                <Tag :value="data.status" :severity="getStatusSeverity(data.status)" />
              </template>
            </Column>
            <Column header="Actions" style="width: 10%">
              <template #body="{ data }">
                <Button
                  icon="pi pi-eye"
                  label="Review"
                  class="p-button-sm p-button-text p-button-success"
                  @click="openReview(data)"
                />
              </template>
            </Column>
          </DataTable>
        </div>
      </div>
    </main>

    <!-- Review Dialog -->
    <Dialog
      v-model:visible="showReviewDialog"
      header="Review Submission"
      :style="{ width: '80vw', maxWidth: '900px' }"
      modal
      :closable="!processing"
    >
      <div v-if="selectedSubmission" class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-bold text-gray-700">Project Title</label>
              <div class="mt-1 p-3 bg-gray-50 rounded-lg border border-gray-200">
                {{ selectedSubmission.title }}
              </div>
            </div>
            <div>
              <label class="block text-sm font-bold text-gray-700">Abstract</label>
              <div class="mt-1 p-3 bg-gray-50 rounded-lg border border-gray-200 text-sm max-h-48 overflow-y-auto">
                {{ selectedSubmission.abstract }}
              </div>
            </div>
          </div>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-bold text-gray-700">Group Details</label>
              <div class="mt-1 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p><strong>Group:</strong> {{ selectedSubmission.group_name }}</p>
                <p><strong>Program:</strong> {{ selectedSubmission.program_code }}</p>
                <p><strong>Task:</strong> {{ selectedSubmission.task_name }}</p>
                <p><strong>Version:</strong> {{ selectedSubmission.version_no }}</p>
              </div>
            </div>

            <div>
              <label class="block text-sm font-bold text-gray-700">Project Files</label>
              <div class="mt-1 space-y-2">
                <div
                  v-for="file in selectedSubmission.files"
                  :key="file.file_id"
                  class="flex items-center justify-between p-2 bg-white border border-gray-200 rounded-lg shadow-xs hover:border-green-300 transition-colors"
                >
                  <div class="flex items-center space-x-3 truncate">
                    <i
                      :class="[
                        'pi',
                        file.file_type === 'Capstone Paper' ? 'pi-file-pdf text-red-500' : 'pi-file text-blue-500'
                      ]"
                    ></i>
                    <span class="text-sm font-medium truncate">{{ file.file_name }}</span>
                    <Tag :value="file.file_type" severity="secondary" class="text-[10px]" />
                  </div>
                  <Button
                    icon="pi pi-download"
                    class="p-button-rounded p-button-text p-button-sm"
                    @click="downloadFile(file)"
                  />
                </div>
                <div v-if="!selectedSubmission.files?.length" class="text-sm text-gray-500 italic">
                  No files uploaded.
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="pt-4 border-t border-gray-100">
          <label class="block text-sm font-bold text-gray-700 mb-2">Review Feedback</label>
          <Textarea
            v-model="remarks"
            placeholder="Provide specific comments, requested revisions, or overall feedback..."
            class="w-full"
            rows="4"
          />
        </div>
      </div>

      <template #footer>
        <div class="flex justify-between w-full">
          <div class="space-x-2">
            <Button
              label="Delete Submission"
              icon="pi pi-trash"
              class="p-button-text p-button-danger p-button-sm"
              v-tooltip.top="'Permanently remove this submission from the system'"
              :loading="processing"
              @click="handleDeleteSubmission"
            />
          </div>
          <div class="space-x-2">
            <Button
              label="Cancel"
              class="p-button-text p-button-secondary"
              @click="showReviewDialog = false"
              :disabled="processing"
            />
            <Button
              label="Request Revision"
              icon="pi pi-exclamation-triangle"
              class="p-button-warning"
              :loading="processing"
              @click="handleStatusUpdate('Revision Requested')"
            />
            <Button
              label="Approve Submission"
              icon="pi pi-check"
              class="p-button-success"
              :loading="processing"
              @click="handleStatusUpdate('Approved')"
            />
          </div>
        </div>
      </template>
    </Dialog>

    <footer>
      <Footer />
    </footer>
  </div>
</template>

<style scoped>
:deep(.p-datatable .p-datatable-thead > tr > th) {
  background: #f8faf9;
  color: #17362b;
  font-weight: 700;
}

:deep(.p-tag) {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.2rem 0.6rem;
}
</style>
