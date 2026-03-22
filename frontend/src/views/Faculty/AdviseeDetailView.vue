<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Card from 'primevue/card'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Timeline from 'primevue/timeline'
import Toast from 'primevue/toast'
import ConfirmDialog from 'primevue/confirmdialog'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import NavbarFaculty from '@/components/NavbarFaculty.vue'
import Footer from '@/components/Footer.vue'
import * as advisoryService from '@/services/advisoryService'
import {
  getAdvisoryLoad,
  getGroupMembers,
  getGroupSubmissions,
  searchStudents,
  addGroupMember,
  removeGroupMember,
  deleteGroup,
} from '@/services/advisoryService'
import { getCapstoneFileDownloadUrl } from '@/services/repositoryService'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const confirm = useConfirm()
const groupId = route.params.id

const loading = ref(true)
const group = ref(null)
const members = ref([])
const timelineItems = ref([])

const confirmDeleteGroup = () => {
  confirm.require({
    message: `Permanently delete "${group.value.groupName}"? This cannot be undone.`,
    header: 'Delete Group',
    rejectLabel: 'Cancel',
    acceptLabel: 'Delete',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await advisoryService.deleteGroup(groupId)
        toast.add({
          severity: 'success',
          summary: 'Group deleted',
          detail: `"${group.value.groupName}" was deleted.`,
          life: 2500,
        })
        router.push('/faculty/my-advisees')
      } catch (err) {
        toast.add({
          severity: 'error',
          summary: 'Failed to delete',
          detail: err?.response?.data?.error || 'Unable to delete group.',
          life: 3000,
        })
      }
    },
  })
}

// Search state
const searchQuery = ref('')
const searchResults = ref([])
const searching = ref(false)
let searchTimeout = null

const debouncedSearch = () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(doSearch, 300)
}

const doSearch = async () => {
  const q = searchQuery.value.trim()
  if (!q) {
    searchResults.value = []
    return
  }
  searching.value = true
  try {
    const res = await searchStudents(q)
    searchResults.value = res
  } catch (err) {
    console.error(err)
  } finally {
    searching.value = false
  }
}

const selectStudent = async (student) => {
  try {
    await addGroupMember(groupId, { studentId: student.user_id })
    searchQuery.value = ''
    searchResults.value = []
    members.value = await getGroupMembers(groupId)
    toast.add({
      severity: 'success',
      summary: 'Student added',
      detail: `${student.fname} ${student.lname} was added to the group.`,
      life: 2500,
    })
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: 'Failed to add',
      detail: err?.response?.data?.error || 'Unable to add student.',
      life: 3000,
    })
  }
}

const handleRemove = async (studentId, studentName) => {
  confirm.require({
    message: `Remove ${studentName} from this group?`,
    header: 'Remove Student',
    rejectLabel: 'Cancel',
    acceptLabel: 'Remove',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await removeGroupMember(groupId, studentId)
        members.value = await getGroupMembers(groupId)
        toast.add({
          severity: 'success',
          summary: 'Student removed',
          detail: `${studentName} was removed.`,
          life: 2500,
        })
      } catch (err) {
        toast.add({
          severity: 'error',
          summary: 'Failed to remove',
          detail: err?.response?.data?.error || 'Unable to remove student.',
          life: 3000,
        })
      }
    },
  })
}

const getStatusColor = (status) => {
  switch (status) {
    case 'Approved':
      return '#17362b'
    case 'Archived':
      return '#000000'
    case 'Revision Requested':
      return '#ef4444'
    case 'Under Review':
      return '#355347'
    case 'Submitted':
      return '#7aaf96'
    default:
      return '#a3b8af'
  }
}

const formatFileSize = (bytes) => {
  if (!bytes || isNaN(bytes)) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const handleDownloadFile = (fileId) => {
  const url = getCapstoneFileDownloadUrl(fileId)
  const link = document.createElement('a')
  link.href = url
  link.target = '_blank'
  link.rel = 'noopener'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const fetchDetailData = async () => {
  loading.value = true
  try {
    const advisoryData = await getAdvisoryLoad()
    const allGroups = advisoryData.rows || []
    group.value = allGroups.find((g) => String(g.groupId) === String(groupId))

    if (group.value) {
      const [membersData, submissionsData] = await Promise.all([
        getGroupMembers(groupId),
        getGroupSubmissions(groupId),
      ])

      members.value = membersData

      // Map submissions to timeline items
      const items = submissionsData.map((s) => ({
        id: s.submission_id,
        title: s.title,
        status: s.status,
        date: s.submitted_at,
        version: s.version_no,
        task: s.task_name,
        files: s.files || [],
        audit: s.audit_logs || [],
        icon: s.status === 'Approved' ? 'pi pi-check-circle' : 'pi pi-file',
        color: getStatusColor(s.status),
      }))

      // Add "Creation" event
      items.push({
        status: 'Group Created',
        date: group.value.groupCreatedAt,
        icon: 'pi pi-plus',
        color: '#cfe0d6',
        description: 'The capstone group was established.',
      })

      timelineItems.value = items.sort((a, b) => new Date(b.date) - new Date(a.date))
    }
  } catch (error) {
    console.error('Failed to fetch group details:', error)
  } finally {
    loading.value = false
  }
}

onMounted(fetchDetailData)
</script>

<template>
  <div class="min-h-screen flex flex-col bg-linear-to-b from-[#eaf4ee] to-[#f8fbf9] font-Karla">
    <Toast />
    <ConfirmDialog />
    <header class="flex-none">
      <NavbarFaculty />
    </header>

    <main class="flex-1 px-4 pt-24 pb-10 sm:px-6 lg:pt-32">
      <div class="max-w-6xl mx-auto w-full space-y-6">
        <!-- Back Button & Title -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Button
              icon="pi pi-arrow-left"
              label="Back to Advisees"
              class="p-button-text p-button-sm text-[#355347] mb-2 p-0"
              @click="router.push('/faculty/my-advisees')"
            />
            <h1 class="text-3xl font-extrabold text-[#17362b]">
              {{ group?.groupName || 'Group Details' }}
            </h1>
            <p class="text-[#5a877a] flex items-center gap-2 mt-1">
              <i class="pi pi-tag text-xs"></i>
              {{ group?.programCode || 'No Program' }} • {{ members.length }} Members
            </p>
          </div>
          <div v-if="group" class="flex gap-2">
            <Tag
              :value="group.latestSubmissionStatus || 'No Submission'"
              severity="success"
              class="bg-[#d8eedf] text-[#1b4332] border-[#cfe0d6]"
            />
            <Button
              label="Delete Group"
              icon="pi pi-trash"
              class="p-button-outlined p-button-danger p-button-sm font-bold"
              @click="confirmDeleteGroup"
            />
          </div>
        </div>

        <div v-if="loading" class="flex flex-col items-center justify-center py-20 text-[#355347]">
          <i class="pi pi-spin pi-spinner text-3xl mb-4"></i>
          <p>Loading group progress...</p>
        </div>

        <div
          v-else-if="!group"
          class="text-center py-20 border border-dashed border-[#cfe0d6] rounded-2xl bg-white"
        >
          <i class="pi pi-exclamation-circle text-4xl text-red-400 mb-4"></i>
          <h2 class="text-xl font-bold text-[#17362b]">Group Not Found</h2>
          <p class="text-[#5a877a] mb-6">
            The group you're looking for doesn't exist or you don't have access.
          </p>
          <Button
            label="Return to List"
            icon="pi pi-arrow-left"
            @click="router.push('/faculty/my-advisees')"
            class="bg-[#17362b] border-none"
          />
        </div>

        <div v-else class="space-y-6">
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            <!-- Left Column: Submission Journey -->
            <div class="lg:col-span-2 flex flex-col min-h-0">
              <Card class="shadow-sm border-[#cfe0d6] flex flex-col h-full overflow-hidden">
                <template #title>
                  <div class="text-lg font-bold text-[#17362b]">Submission Journey</div>
                </template>
                <template #content>
                  <div class="flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-0">
                    <div
                      v-if="
                        timelineItems.length === 1 && timelineItems[0].status === 'Group Created'
                      "
                      class="text-center py-10"
                    >
                      <i class="pi pi-inbox text-3xl text-gray-300 mb-2"></i>
                      <p class="text-sm text-[#5a877a]">No submissions yet.</p>
                    </div>
                    <Timeline :value="timelineItems" class="custom-timeline mt-4">
                      <template #opposite="slotProps">
                        <small class="text-[#5a877a] font-bold">{{
                          new Date(slotProps.item.date).toLocaleDateString()
                        }}</small>
                      </template>
                      <template #marker="slotProps">
                        <span
                          class="flex w-8 h-8 items-center justify-center text-white rounded-full z-1 shadow-sm"
                          :style="{ backgroundColor: slotProps.item.color }"
                        >
                          <i :class="slotProps.item.icon"></i>
                        </span>
                      </template>
                      <template #content="slotProps">
                        <div class="mb-10 bg-[#f8faf9] p-4 rounded-xl border border-[#eaf4ee]">
                          <div class="flex items-center justify-between mb-2">
                            <div class="font-bold text-[#17362b] text-base">
                              {{ slotProps.item.task || slotProps.item.status }}
                            </div>
                            <Tag
                              v-if="slotProps.item.version"
                              :value="`v${slotProps.item.version}`"
                              severity="info"
                              class="text-[10px]"
                            />
                          </div>

                          <div
                            v-if="slotProps.item.title"
                            class="text-sm font-semibold text-[#355347] mb-2 italic"
                          >
                            "{{ slotProps.item.title }}"
                          </div>

                          <!-- Remarks/Audit Logs -->
                          <div
                            v-if="slotProps.item.audit && slotProps.item.audit.length"
                            class="mt-3 space-y-2"
                          >
                            <div
                              v-for="log in slotProps.item.audit"
                              :key="log.log_id"
                              class="text-[11px] bg-white p-2 rounded border border-[#cfe0d6]"
                            >
                              <div class="flex justify-between font-bold text-[#17362b] mb-1">
                                <span>Status: {{ log.new_status }}</span>
                                <span class="text-gray-400">{{
                                  new Date(log.changed_at).toLocaleDateString()
                                }}</span>
                              </div>
                              <p v-if="log.remarks" class="text-[#5a877a] italic">
                                "{{ log.remarks }}"
                              </p>
                            </div>
                          </div>

                          <!-- Files -->
                          <div
                            v-if="slotProps.item.files && slotProps.item.files.length"
                            class="mt-4 flex flex-wrap gap-2"
                          >
                            <a
                              v-for="file in slotProps.item.files"
                              :key="file.file_id"
                              href="javascript:void(0)"
                              @click="handleDownloadFile(file.file_id)"
                              class="flex items-center gap-2 px-3 py-1.5 bg-white border border-[#cfe0d6] rounded-lg text-xs font-medium text-[#17362b] hover:bg-[#eaf4ee] transition-colors"
                            >
                              <i class="pi pi-file-pdf text-red-500"></i>
                              <span>{{ file.file_name }}</span>
                              <span class="text-[9px] text-gray-400"
                                >({{ formatFileSize(file.file_size) }})</span
                              >
                            </a>
                          </div>

                          <p v-if="slotProps.item.description" class="text-sm text-[#5a877a] mt-1">
                            {{ slotProps.item.description }}
                          </p>
                        </div>
                      </template>
                    </Timeline>
                  </div>
                </template>
              </Card>
            </div>

            <!-- Right Column: Stats & Notes -->
            <div class="space-y-6 flex flex-col">
              <Card class="shadow-sm border-[#cfe0d6] bg-[#f0f8f3] flex-none">
                <template #title>
                  <div class="text-lg font-bold text-[#17362b]">Risk Indicator</div>
                </template>
                <template #content>
                  <div class="text-center py-4">
                    <div class="text-4xl font-black text-[#17362b] mb-1">
                      {{ group.latestVersionNo || 1 }}
                    </div>
                    <div class="text-xs font-bold text-[#355347] uppercase tracking-widest">
                      Total Revisions
                    </div>
                  </div>
                  <div class="mt-4 p-3 bg-white rounded-xl border border-[#cfe0d6]">
                    <div class="flex justify-between text-xs mb-1">
                      <span class="font-bold text-[#355347]">Last Activity</span>
                      <span class="text-[#5a877a]">{{
                        group.latestSubmittedAt
                          ? new Date(group.latestSubmittedAt).toLocaleDateString()
                          : 'None'
                      }}</span>
                    </div>
                    <div class="w-full bg-gray-100 rounded-full h-1.5 mt-2">
                      <div class="bg-[#17362b] h-1.5 rounded-full" style="width: 70%"></div>
                    </div>
                  </div>
                </template>
              </Card>

              <Card class="shadow-sm border-[#cfe0d6] flex-1 flex flex-col">
                <template #title>
                  <div class="text-lg font-bold text-[#17362b]">Internal Notes</div>
                </template>
                <template #content>
                  <div class="flex flex-col h-full">
                    <p class="text-xs text-[#5a877a] italic mb-4">
                      Private notes only visible to you.
                    </p>
                    <textarea
                      class="flex-1 w-full rounded-lg border border-[#cfe0d6] p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#17362b]/20 bg-[#fafafa] min-h-[120px]"
                      placeholder="Type notes here..."
                    ></textarea>
                    <Button
                      label="Save Notes"
                      class="w-full mt-3 bg-[#17362b] border-none text-sm"
                    />
                  </div>
                </template>
              </Card>
            </div>
          </div>

          <!-- Bottom Row: Roster & Management -->
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <!-- 2/3 List: Group Roster -->
            <Card class="lg:col-span-2 shadow-sm border-[#cfe0d6]">
              <template #title>
                <div class="text-lg font-bold text-[#17362b]">Group Roster</div>
              </template>
              <template #content>
                <div class="mt-2">
                  <p class="text-xs font-semibold uppercase tracking-wide text-[#355347] mb-4">
                    Current Members
                  </p>
                  <DataTable
                    :value="members"
                    class="p-datatable-sm shadow-xs border border-[#eaf4ee] rounded-lg overflow-hidden"
                  >
                    <Column header="Student">
                      <template #body="{ data }">
                        <div class="flex items-center gap-3">
                          <div
                            class="w-8 h-8 rounded-full bg-[#d8eedf] flex items-center justify-center text-[#1b4332] font-bold text-xs"
                          >
                            {{ data.fname?.[0] }}{{ data.lname?.[0] }}
                          </div>
                          <div>
                            <div class="font-bold text-sm text-[#17362b]">
                              {{ data.fname }} {{ data.lname }}
                            </div>
                            <div class="text-[10px] text-[#5a877a]">{{ data.email }}</div>
                          </div>
                        </div>
                      </template>
                    </Column>
                    <Column
                      field="university_id"
                      header="ID Number"
                      class="text-sm text-[#355347]"
                    ></Column>
                    <Column header="Actions" class="text-right">
                      <template #body="{ data }">
                        <Button
                          label="Remove"
                          class="p-button-text p-button-danger p-button-sm font-bold"
                          @click="handleRemove(data.student_id, `${data.fname} ${data.lname}`)"
                        />
                      </template>
                    </Column>
                  </DataTable>
                </div>
              </template>
            </Card>

            <!-- 1/3: Add Student -->
            <Card class="lg:col-span-1 shadow-sm border-[#cfe0d6]">
              <template #title>
                <div class="text-lg font-bold text-[#17362b]">Add Member</div>
              </template>
              <template #content>
                <div class="mt-2">
                  <p class="text-xs font-semibold uppercase tracking-wide text-[#355347] mb-4">
                    Search Students
                  </p>
                  <div class="relative">
                    <span class="absolute inset-y-0 left-3 flex items-center text-[#7aaf96]">
                      <i class="pi pi-search text-xs"></i>
                    </span>
                    <input
                      v-model="searchQuery"
                      @input="debouncedSearch"
                      placeholder="Name or ID..."
                      class="w-full rounded-lg border border-[#cfe0d6] bg-white pl-8 pr-4 py-2 text-sm text-[#17362b] placeholder-[#aac8b8] focus:outline-none focus:ring-2 focus:ring-[#17362b]/20"
                    />
                  </div>

                  <div v-if="searching" class="mt-2 text-xs text-[#5a877a]">
                    <i class="pi pi-spin pi-spinner mr-1"></i>Searching...
                  </div>

                  <ul
                    v-if="searchResults.length"
                    class="mt-2 max-h-60 overflow-y-auto rounded-lg border border-[#cfe0d6] bg-white divide-y divide-[#eaf4ee]"
                  >
                    <li
                      v-for="s in searchResults"
                      :key="s.user_id"
                      class="p-2 hover:bg-[#f8faf9] transition-colors flex items-center justify-between gap-2"
                    >
                      <div class="min-w-0">
                        <div class="text-xs font-bold text-[#17362b] truncate">
                          {{ s.fname }} {{ s.lname }}
                        </div>
                        <div class="text-[9px] text-[#5a877a] truncate">{{ s.university_id }}</div>
                      </div>
                      <Button
                        icon="pi pi-plus"
                        class="p-button-rounded p-button-text p-button-sm text-[#17362b]"
                        @click="selectStudent(s)"
                      />
                    </li>
                  </ul>
                  <div
                    v-else-if="searchQuery && !searching"
                    class="mt-2 text-center py-4 text-xs text-[#5a877a] italic"
                  >
                    No students found.
                  </div>
                </div>
              </template>
            </Card>
          </div>
        </div>
      </div>
    </main>

    <footer class="flex-none">
      <Footer />
    </footer>
  </div>
</template>

<style scoped>
:deep(.p-card-body) {
  padding: 1.5rem !important;
}
:deep(.p-timeline-event-opposite) {
  flex: 0;
  min-width: 100px;
  text-align: left !important;
}

.custom-timeline :deep(.p-timeline-event-content) {
  padding-left: 2rem;
}
</style>
