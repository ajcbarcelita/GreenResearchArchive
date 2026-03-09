<template>
  <div class="min-h-screen flex flex-col bg-linear-to-b from-[#eaf4ee] to-[#f8fbf9] font-Karla">
    <Toast />
    <ConfirmDialog />
    <header>
      <NavbarFaculty />
    </header>

    <main class="flex-1 px-4 pt-24 pb-10 sm:px-6 sm:pt-28 lg:pt-32">
      <section class="w-full max-w-5xl mx-auto">

        <!-- Page header -->
        <div class="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 class="text-2xl font-extrabold text-[#17362b]">My Advisees</h1>
            <p class="mt-1 text-sm text-[#355347]">Manage your capstone groups and assign or remove members.</p>
          </div>
          <button @click="openCreateDialog"
            class="flex items-center gap-1 rounded-lg bg-[#17362b] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#1f4a3a] transition-colors shrink-0">
            <img src="../../assets/plus.png" alt="plus icon" class="w-4 h-4" />
            <i class="pi pi-plus text-xs"></i>
            Create Group
          </button>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="flex items-center justify-center py-20 text-[#355347]">
          <i class="pi pi-spin pi-spinner text-2xl mr-3"></i>
          <span class="text-base">Loading groups…</span>
        </div>

        <!-- Empty state -->
        <div v-else-if="groups.length === 0"
          class="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#cfe0d6] bg-white py-20 text-center shadow-sm">
          <div class="mb-4 flex h-16 w-16 items-center justify-center">
            <img src="../../assets/Groups.png" alt="plus icon" class="w-14 h-14" />
          </div>
          <h2 class="text-lg font-bold text-[#17362b]">No groups yet</h2>
          <p class="mt-1 max-w-xs text-sm text-[#355347]">You haven't created any capstone groups. Get started by
            creating your first group.</p>
          <button @click="openCreateDialog"
            class="mt-6 flex items-center gap-2 rounded-lg bg-[#17362b] px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-[#1f4a3a] transition-colors">
            <img src="../../assets/plus.png" alt="plus icon" class="w-4 h-4" />
            Create your first group
          </button>
        </div>

        <!-- Group cards -->
        <div v-else class="space-y-5">
          <div v-for="group in groups" :key="group.groupId"
            class="rounded-2xl border border-[#cfe0d6] bg-white shadow-sm overflow-hidden">
            <!-- Card header -->
            <div class="flex items-center justify-between bg-[#f0f8f3] px-5 py-4 border-b border-[#cfe0d6]">
              <div>
                <div class="text-base font-bold text-[#17362b]">{{ group.groupName }}</div>
                <div class="mt-0.5 text-xs text-[#355347]">
                  <span class="inline-flex items-center gap-1">
                    <i class="pi pi-tag text-[10px]"></i>
                    {{ group.programCode || 'No program assigned' }}
                  </span>
                </div>
              </div>
              <span
                class="inline-flex items-center gap-1.5 rounded-full bg-[#d8eedf] px-3 py-1 text-xs font-semibold text-[#1b4332]">
                <i class="pi pi-users text-[10px]"></i>
                {{ members[group.groupId]?.length ?? group.memberCount }} member{{ (members[group.groupId]?.length ??
                  group.memberCount) !== 1 ? 's' : '' }}
              </span>
              <button
                @click="confirmDeleteGroup(group)"
                class="ml-2 rounded-md px-2.5 py-1 text-xs font-medium text-red-600 border border-red-200 hover:bg-red-50 transition-colors">
                <i class="pi pi-trash text-[10px] mr-1"></i>Delete Group
              </button>
            </div>

            <!-- Card body -->
            <div class="px-5 py-4">

              <!-- Member list -->
              <div v-if="members[group.groupId] && members[group.groupId].length" class="mb-4">
                <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-[#355347]">Members</p>
                <ul class="divide-y divide-[#eaf4ee]">
                  <li v-for="m in members[group.groupId]" :key="m.student_id"
                    class="flex items-center justify-between py-2">
                    <div class="flex items-center gap-3">
                      <div
                        class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#d8eedf] text-xs font-bold text-[#1b4332]">
                        {{ (m.fname?.[0] ?? '') }}{{ (m.lname?.[0] ?? '') }}
                      </div>
                      <div>
                        <div class="text-sm font-medium text-[#17362b]">{{ m.fname }} {{ m.mname ? m.mname + ' ' : ''
                          }}{{ m.lname }}</div>
                        <div class="text-xs text-[#5a877a]">{{ m.email || m.university_id }}</div>
                      </div>
                    </div>
                    <button @click="handleRemove(group.groupId, m.student_id, `${m.fname} ${m.lname}`)"
                      class="rounded-md px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors">
                      Remove
                    </button>
                  </li>
                </ul>
              </div>
              <div v-else class="mb-4 rounded-lg bg-[#f0f8f3] px-4 py-3 text-sm text-[#355347]">
                No members yet. Use the search below to add students.
              </div>

              <!-- Add student search -->
              <div>
                <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-[#355347]">Add Student</p>
                <div class="relative">
                  <span class="absolute inset-y-0 left-3 flex items-center text-[#7aaf96]">
                    <i class="pi pi-search text-xs"></i>
                  </span>
                  <input v-model="searchQueries[group.groupId]" @input="debouncedSearch(group.groupId)"
                    placeholder="Search by name, email or student ID…"
                    class="w-full rounded-lg border border-[#cfe0d6] bg-white pl-8 pr-4 py-2 text-sm text-[#17362b] placeholder-[#aac8b8] focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/30 focus:border-[#2d6a4f]" />
                </div>

                <div v-if="searching[group.groupId]" class="mt-2 text-xs text-[#5a877a]">
                  <i class="pi pi-spin pi-spinner mr-1"></i>Searching…
                </div>

                <ul v-if="searchResults[group.groupId] && searchResults[group.groupId].length"
                  class="mt-1 max-h-44 overflow-auto rounded-lg border border-[#cfe0d6] bg-white shadow-sm">
                  <li v-for="s in searchResults[group.groupId]" :key="s.user_id"
                    class="flex items-center justify-between px-3 py-2 hover:bg-[#f0f8f3] transition-colors">
                    <div>
                      <div class="text-sm font-medium text-[#17362b]">{{ s.fname }} {{ s.mname ? s.mname + ' ' : '' }}{{
                        s.lname }}</div>
                      <div class="text-xs text-[#5a877a]">{{ s.email || s.university_id }}</div>
                    </div>
                    <button @click.prevent="selectStudent(group.groupId, s)"
                      class="ml-4 shrink-0 rounded-md bg-[#17362b] px-2.5 py-1 text-xs font-semibold text-white hover:bg-[#1f4a3a] transition-colors">
                      Add
                    </button>
                  </li>
                </ul>

                <div
                  v-if="searchResults[group.groupId] && searchResults[group.groupId].length === 0 && searchQueries[group.groupId]"
                  class="mt-2 text-xs text-[#5a877a]">
                  No students found for "{{ searchQueries[group.groupId] }}".
                </div>
              </div>
            </div>
          </div>
        </div>

      </section>
    </main>

    <footer>
      <Footer />
    </footer>

    <!-- Create Group Popup -->
    <Dialog v-model:visible="createDialogVisible" modal header="Create New Group" :style="{ width: 'min(95vw, 38rem)' }"
      :pt="{
        header: { class: 'bg-[#f0f8f3] border-b border-[#cfe0d6]' },
        title: { class: 'text-[#17362b] font-bold text-lg' },
        content: { class: 'pt-4 pb-6 px-6' },
        footer: { class: 'bg-[#f0f8f3] border-t border-[#cfe0d6] px-6 py-3' },
      }">
      <div class="space-y-5">

        <!-- Group name -->
        <div>
          <label class="block mb-1.5 mt-3 text-xs font-semibold uppercase tracking-wide text-[#355347]">Group Name <span
              class="text-red-500">*</span></label>
          <input v-model="newGroupName" placeholder="e.g. Group Alpha"
            class="w-full rounded-lg border border-[#cfe0d6] px-3 py-2 text-sm text-[#17362b] placeholder-[#aac8b8] focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/30 focus:border-[#2d6a4f]" />
          <p v-if="createErrors.groupName" class="mt-1 text-xs text-red-600">{{ createErrors.groupName }}</p>
        </div>

        <!-- Program -->
        <div>
          <label class="block mb-1.5 text-xs font-semibold uppercase tracking-wide text-[#355347]">Degree Program <span
              class="text-[#7aaf96] font-normal normal-case">(optional)</span></label>
          <select v-model="newGroupProgramId"
            class="w-full rounded-lg border border-[#cfe0d6] px-3 py-2 text-sm text-[#17362b] bg-white focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/30 focus:border-[#2d6a4f]">
            <option value="">— No program —</option>
            <option v-for="p in programs" :key="p.program_id" :value="p.program_id">{{ p.program_code }} – {{ p.program_name
              }}</option>
          </select>
        </div>

        <!-- Student picker -->
        <div>
          <label class="block mb-1.5 text-xs font-semibold uppercase tracking-wide text-[#355347]">Add Students <span
              class="text-[#7aaf96] font-normal normal-case">(optional)</span></label>
          <div class="relative">
            <span class="absolute inset-y-0 left-3 flex items-center text-[#7aaf96]">
              <i class="pi pi-search text-xs"></i>
            </span>
            <input v-model="newSearchQuery" @input="debouncedNewSearch"
              placeholder="Search by name, email or student ID…"
              class="w-full rounded-lg border border-[#cfe0d6] pl-8 pr-4 py-2 text-sm text-[#17362b] placeholder-[#aac8b8] focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/30 focus:border-[#2d6a4f]" />
          </div>

          <div v-if="newSearching" class="mt-2 text-xs text-[#5a877a]">
            <i class="pi pi-spin pi-spinner mr-1"></i>Searching…
          </div>

          <ul v-if="newSearchResults.length"
            class="mt-1 max-h-40 overflow-auto rounded-lg border border-[#cfe0d6] bg-white shadow-sm">
            <li v-for="s in newSearchResults" :key="s.user_id"
              class="flex items-center justify-between px-3 py-2 hover:bg-[#f0f8f3] transition-colors"
              :class="{ 'opacity-40 pointer-events-none': !!newSelected.find(x => x.user_id === s.user_id) }">
              <div>
                <div class="text-sm font-medium text-[#17362b]">{{ s.fname }} {{ s.mname ? s.mname + ' ' : '' }}{{
                  s.lname }}</div>
                <div class="text-xs text-[#5a877a]">{{ s.email || s.university_id }}</div>
              </div>
              <button @click.prevent="addNewSelected(s)"
                class="ml-4 shrink-0 rounded-md bg-[#17362b] px-2.5 py-1 text-xs font-semibold text-white hover:bg-[#1f4a3a] transition-colors">
                {{newSelected.find(x => x.user_id === s.user_id) ? 'Added' : 'Select'}}
              </button>
            </li>
          </ul>
        </div>

        <!-- Selected students chip list -->
        <div v-if="newSelected.length">
          <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-[#355347]">Selected ({{ newSelected.length
            }})</p>
          <ul class="flex flex-wrap gap-2">
            <li v-for="s in newSelected" :key="s.user_id"
              class="flex items-center gap-1.5 rounded-full bg-[#d8eedf] pl-3 pr-1.5 py-1 text-xs font-medium text-[#1b4332]">
              <span>{{ s.fname }} {{ s.lname }}</span>
              <button @click.prevent="removeNewSelected(s.user_id)"
                class="flex h-4 w-4 items-center justify-center rounded-full bg-[#1b4332]/20 hover:bg-[#1b4332]/40 transition-colors">
                <i class="pi pi-times text-[8px]"></i>
              </button>
            </li>
          </ul>
        </div>

      </div>

      <template #footer>
        <div class="flex justify-end gap-3">
          <button @click="createDialogVisible = false"
            class="rounded-lg border border-[#cfe0d6] mt-4 px-4 py-2 text-sm font-medium text-[#355347] hover:bg-[#eaf4ee] transition-colors">
            Cancel
          </button>
          <button @click="createGroup" :disabled="creating"
            class="flex items-center gap-2 rounded-lg bg-[#17362b] mt-4 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-[#1f4a3a] disabled:opacity-60 transition-colors">
            <img src="../../assets/plus.png" alt="plus icon" class="w-4 h-4" />
            <i v-if="creating" class="pi pi-spin pi-spinner text-xs"></i>
            <i v-else class="pi pi-plus text-xs"></i>
            Create Group
          </button>
        </div>
      </template>
    </Dialog>
  </div>
</template>


<script setup>
import { ref, onMounted } from 'vue'
import Dialog from 'primevue/dialog'
import ConfirmDialog from 'primevue/confirmdialog'
import Toast from 'primevue/toast'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import Footer from '@/components/Footer.vue'
import NavbarFaculty from '@/components/NavbarFaculty.vue'
import * as advisoryService from '@/services/advisoryService.js'
import * as authService from '@/services/authService.js'

const toast = useToast()
const confirm = useConfirm()
const groups = ref([])
const members = ref({})
const loading = ref(true)

// ── Per-group student search ────────────────────
const searchQueries = ref({})
const searchResults = ref({})
const searching = ref({})
const searchTimeouts = {}

const debouncedSearch = (groupId) => {
  if (searchTimeouts[groupId]) clearTimeout(searchTimeouts[groupId])
  searchTimeouts[groupId] = setTimeout(() => doSearch(groupId), 300)
}

const doSearch = async (groupId) => {
  const q = String(searchQueries.value[groupId] || '').trim()
  if (!q) {
    searchResults.value = { ...searchResults.value, [groupId]: [] }
    searching.value = { ...searching.value, [groupId]: false }
    return
  }
  searching.value = { ...searching.value, [groupId]: true }
  try {
    const res = await advisoryService.searchStudents(q)
    searchResults.value = { ...searchResults.value, [groupId]: res }
  } catch (err) {
    console.error(err)
    searchResults.value = { ...searchResults.value, [groupId]: [] }
  } finally {
    searching.value = { ...searching.value, [groupId]: false }
  }
}

const selectStudent = async (groupId, student) => {
  try {
    await advisoryService.addGroupMember(groupId, { studentId: student.user_id })
    searchQueries.value = { ...searchQueries.value, [groupId]: '' }
    searchResults.value = { ...searchResults.value, [groupId]: [] }
    await loadMembers(groupId)
    toast.add({ severity: 'success', summary: 'Student added', detail: `${student.fname} ${student.lname} was added to the group.`, life: 2500 })
  } catch (err) {
    console.error(err)
    toast.add({ severity: 'error', summary: 'Failed to add', detail: err?.response?.data?.error || 'Unable to add student.', life: 3000 })
  }
}

const handleRemove = async (groupId, studentId, studentName) => {
  confirm.require({
    message: `Remove ${studentName} from this group?`,
    header: 'Remove Student',
    rejectLabel: 'Cancel',
    acceptLabel: 'Remove',
    acceptClass: 'bg-red-600 hover:bg-red-700',
    accept: async () => {
      try {
        await advisoryService.removeGroupMember(groupId, studentId)
        await loadMembers(groupId)
        toast.add({ severity: 'success', summary: 'Student removed', detail: `${studentName} was removed from the group.`, life: 2500 })
      } catch (err) {
        console.error(err)
        toast.add({ severity: 'error', summary: 'Failed to remove', detail: err?.response?.data?.error || 'Unable to remove student.', life: 3000 })
      }
    },
  })
}

const confirmDeleteGroup = (group) => {
  confirm.require({
    message: `Permanently delete "${group.groupName}"? This cannot be undone.`,
    header: 'Delete Group',
    rejectLabel: 'Cancel',
    acceptLabel: 'Delete',
    acceptClass: 'bg-red-600 hover:bg-red-700',
    accept: async () => {
      try {
        await advisoryService.deleteGroup(group.groupId)
        toast.add({ severity: 'success', summary: 'Group deleted', detail: `"${group.groupName}" was deleted.`, life: 2500 })
        await loadGroups()
      } catch (err) {
        console.error(err)
        toast.add({ severity: 'error', summary: 'Failed to delete', detail: err?.response?.data?.error || 'Unable to delete group.', life: 3000 })
      }
    },
  })
}

const loadGroups = async () => {
  loading.value = true
  try {
    const resp = await advisoryService.getMyGroups()
    groups.value = resp || []
    for (const g of groups.value) {
      await loadMembers(g.groupId)
    }
  } catch (err) {
    console.error(err)
    toast.add({ severity: 'error', summary: 'Load failed', detail: 'Unable to fetch your groups.', life: 3000 })
  } finally {
    loading.value = false
  }
}

const loadMembers = async (groupId) => {
  try {
    const m = await advisoryService.getGroupMembers(groupId)
    members.value = { ...members.value, [groupId]: m }
  } catch (err) {
    console.error(err)
    members.value = { ...members.value, [groupId]: [] }
  }
}

// ── Create Group Dialog ─────────────────────────
const createDialogVisible = ref(false)
const creating = ref(false)
const programs = ref([])
const newGroupName = ref('')
const newGroupProgramId = ref('')
const newSearchQuery = ref('')
const newSearchResults = ref([])
const newSearching = ref(false)
const newSelected = ref([])
const createErrors = ref({ groupName: '' })
const newSearchTimeout = { id: null }

const openCreateDialog = () => {
  newGroupName.value = ''
  newGroupProgramId.value = ''
  newSearchQuery.value = ''
  newSearchResults.value = []
  newSelected.value = []
  createErrors.value = { groupName: '' }
  createDialogVisible.value = true
}

const loadPrograms = async () => {
  try {
    const resp = await authService.getDegreePrograms()
    programs.value = resp?.programs || []
  } catch (err) {
    console.error(err)
  }
}

const debouncedNewSearch = () => {
  if (newSearchTimeout.id) clearTimeout(newSearchTimeout.id)
  newSearchTimeout.id = setTimeout(doNewSearch, 300)
}

const doNewSearch = async () => {
  const q = String(newSearchQuery.value || '').trim()
  if (!q) {
    newSearchResults.value = []
    newSearching.value = false
    return
  }
  newSearching.value = true
  try {
    const res = await advisoryService.searchStudents(q)
    newSearchResults.value = res || []
  } catch (err) {
    console.error(err)
    newSearchResults.value = []
  } finally {
    newSearching.value = false
  }
}

const addNewSelected = (s) => {
  if (!newSelected.value.find(x => x.user_id === s.user_id)) newSelected.value.push(s)
}

const removeNewSelected = (id) => {
  newSelected.value = newSelected.value.filter(x => x.user_id !== id)
}

const createGroup = async () => {
  createErrors.value = { groupName: '' }
  if (!newGroupName.value || !String(newGroupName.value).trim()) {
    createErrors.value.groupName = 'Group name is required.'
    return
  }
  creating.value = true
  try {
    await advisoryService.createGroup({
      groupName: String(newGroupName.value).trim(),
      programId: newGroupProgramId.value || null,
      studentIds: newSelected.value.map(s => s.user_id),
    })
    createDialogVisible.value = false
    toast.add({ severity: 'success', summary: 'Group created', detail: `"${newGroupName.value.trim()}" was created successfully.`, life: 2800 })
    await loadGroups()
  } catch (err) {
    console.error(err)
    toast.add({ severity: 'error', summary: 'Creation failed', detail: err?.response?.data?.error || 'Unable to create group.', life: 3500 })
  } finally {
    creating.value = false
  }
}

onMounted(() => {
  loadGroups()
  loadPrograms()
})
</script>