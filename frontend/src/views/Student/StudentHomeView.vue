<script setup>
import { computed } from 'vue'
import Avatar from 'primevue/avatar'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Chip from 'primevue/chip'
import Tag from 'primevue/tag'
import Navbar from '@/components/Navbar.vue'
import Footer from '@/components/Footer.vue'
import { getStoredUser } from '../../services/authService'

const user = getStoredUser()

const fullName = computed(() => {
  const first = user?.firstName || ''
  const middle = user?.middleName || ''
  const last = user?.lastName || ''
  return [first, middle, last].filter(Boolean).join(' ') || 'Student User'
})

const groupSnapshot = {
  groupId: 4,
  groupName: 'GROUP-4',
  programCode: 'BSIT',
  adviserName: 'Prof. Maria Santos',
}

const currentSubmission = {
  submissionId: 1024,
  title: 'Automated Barangay Complaint Management with NLP Routing',
  versionNo: 3,
  status: 'Revision Requested',
  isLocked: false,
  submittedAt: '2026-03-03 21:24',
  archivedAt: null,
}

const submissionFiles = {
  capstonePaperCount: 1,
  datasetCount: 1,
  latestUploadAt: '2026-03-03 21:24',
}

const pendingActions = [
  'Upload updated Capstone Paper file.',
  'Upload latest Dataset file.',
  'Address the latest audit log remarks.',
  'Resubmit to move status to Submitted.',
  'Verify keywords array reflects final manuscript scope.',
  'Confirm abstract revision aligns with adviser comments.',
  'Check submission status before end-of-day cutoff.',
  'Prepare supporting files for next review cycle.',
  'Review group member assignments and ownership.',
]

const groupMembers = [
  { name: 'John Kirbie Mendoza', universityId: '12307823' },
  { name: 'Mika Reyes', universityId: '12307831' },
  { name: 'Allen Cruz', universityId: '12307844' },
  { name: 'Paolo Dela Cruz', universityId: '12307857' },
]

const activityFeed = [
  {
    status: 'Status Changed',
    date: '2026-03-03 21:24',
    detail: 'Under Review -> Revision Requested',
  },
  {
    status: 'Audit Remark Logged',
    date: '2026-03-03 21:22',
    detail: 'Clarify dataset description and add architecture labels.',
  },
  {
    status: 'File Uploaded',
    date: '2026-03-03 20:58',
    detail: 'Uploaded new Capstone Paper (version_no = 3).',
  },
  {
    status: 'Metadata Updated',
    date: '2026-03-03 20:40',
    detail: 'Updated title and keywords before resubmission.',
  },
  {
    status: 'Dataset Replaced',
    date: '2026-03-03 20:21',
    detail: 'Uploaded revised dataset package for validation.',
  },
  {
    status: 'Audit Remark Logged',
    date: '2026-03-03 20:03',
    detail: 'Coordinator requested clearer methodology details.',
  },
  {
    status: 'Submission Created',
    date: '2026-03-01 18:10',
    detail: 'Initial submission record created for Group 4.',
  },
]

const submissionSeverity = computed(() => {
  if (currentSubmission.status === 'Approved') return 'success'
  if (currentSubmission.status === 'Revision Requested') return 'warn'
  return 'info'
})
</script>

<template>
  <div class="dashboard-page min-h-screen flex flex-col font-Karla">
    <header>
      <Navbar />
    </header>

    <main class="mx-auto w-full max-w-7xl flex-1 px-4 pb-8 pt-24 sm:px-6 sm:pb-10 sm:pt-28 lg:pt-32">
      <section class="grid gap-4 md:grid-cols-12 lg:gap-5">
        <Card class="panel-card md:col-span-8">
          <template #content>
            <div class="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p class="kicker">Student Dashboard</p>
                <h1 class="headline">Welcome back, {{ fullName }}</h1>
                <p class="support-text">
                  Monitor your group, submission lifecycle, file uploads, and audit trail in one place.
                </p>
              </div>
              <div class="flex items-center gap-2">
                <Tag value="Student" severity="success" rounded />
                <Tag value="Active" severity="info" rounded />
              </div>
            </div>
          </template>
        </Card>

        <Card class="panel-card panel-card-accent md:col-span-4">
          <template #content>
            <p class="kicker">Submission Record</p>
            <h2 class="record-id">#{{ currentSubmission.submissionId }}</h2>
            <p class="record-meta">Submitted: {{ currentSubmission.submittedAt }}</p>
            <div class="mt-3 flex flex-wrap gap-2">
              <Tag :value="currentSubmission.status" :severity="submissionSeverity" rounded />
              <Tag :value="currentSubmission.isLocked ? 'Locked' : 'Unlocked'" :severity="currentSubmission.isLocked ? 'danger' : 'success'" rounded />
            </div>
          </template>
        </Card>
      </section>

      <section class="mt-4 grid gap-4 md:grid-cols-12 lg:gap-5">
        <Card class="panel-card md:col-span-8">
          <template #title>
            <div class="flex items-center justify-between gap-3">
              <span>Current Submission</span>
              <Tag :value="currentSubmission.status" :severity="submissionSeverity" rounded />
            </div>
          </template>
          <template #content>
            <h3 class="submission-title">{{ currentSubmission.title }}</h3>
            <div class="mt-2 flex flex-wrap gap-2 text-sm">
              <Chip :label="`Version: ${currentSubmission.versionNo}`" />
              <Chip :label="`Submitted: ${currentSubmission.submittedAt}`" />
              <Chip :label="`Archived: ${currentSubmission.archivedAt || 'No'}`" />
            </div>
            <p class="schema-note">
              Files: Capstone Paper ({{ submissionFiles.capstonePaperCount }}), Dataset ({{ submissionFiles.datasetCount }}).
              Latest upload: {{ submissionFiles.latestUploadAt }}.
            </p>
            <div class="mt-4 flex flex-wrap gap-2">
              <Button label="Open Submission" />
              <Button label="Open Files" severity="secondary" outlined />
            </div>
          </template>
        </Card>

        <Card class="panel-card md:col-span-4">
          <template #title>
            Pending Actions
          </template>
          <template #content>
            <div class="scroll-box pending-scroll-box">
              <ul class="action-list">
                <li v-for="item in pendingActions" :key="item">{{ item }}</li>
              </ul>
            </div>
          </template>
        </Card>
      </section>

      <section class="mt-4 grid gap-4 md:grid-cols-12 lg:gap-5">
        <Card class="panel-card md:col-span-5">
          <template #title>
            Group Snapshot
          </template>
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
          <template #title>
            Recent Activity
          </template>
          <template #content>
            <div class="activity-list-wrap scroll-box">
              <article v-for="item in activityFeed" :key="`${item.status}-${item.date}`" class="activity-item">
                <div class="activity-head">
                  <p class="activity-status">{{ item.status }}</p>
                  <small class="activity-date">{{ item.date }}</small>
                </div>
                <p class="activity-detail">{{ item.detail }}</p>
              </article>
            </div>
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
.dashboard-page {
  background: linear-gradient(180deg, #e8f0eb 0%, #f4f9f6 45%, #eaf3ee 100%);
}

.panel-card {
  border-radius: 1rem;
  border: 1px solid #d5e2db;
  box-shadow: 0 12px 32px rgba(18, 43, 32, 0.07);
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
  line-height: 1.15;
}

.support-text {
  margin: 0.5rem 0 0;
  color: #3f5f4f;
}

.record-id {
  margin: 0.3rem 0 0;
  font-size: 1.35rem;
  font-weight: 700;
  color: #17352a;
}

.record-meta {
  margin: 0.2rem 0 0;
  font-size: 0.92rem;
  color: #456657;
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

.action-list {
  margin: 0;
  padding-left: 1.2rem;
  list-style: disc;
  display: grid;
  gap: 0.55rem;
}

.action-list li {
  color: #1f3f33;
  font-size: 0.95rem;
  line-height: 1.45;
}

.action-list li::marker {
  color: #0f8f5a;
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

.activity-list-wrap {
  display: grid;
  gap: 0.75rem;
}

.scroll-box {
  max-height: 20rem;
  overflow-y: auto;
  padding-right: 0.35rem;
}

.pending-scroll-box {
  max-height: 12.25rem;
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

.activity-item {
  border: 1px solid #d5e2db;
  border-radius: 0.7rem;
  padding: 0.75rem 0.85rem;
  background: #fbfefc;
}

.activity-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.75rem;
}

.activity-status {
  margin: 0;
  font-weight: 700;
  color: #173428;
}

.activity-date {
  color: #4a6a5a;
  white-space: nowrap;
}

.activity-detail {
  margin: 0.35rem 0 0;
  color: #3a5a4a;
  font-size: 0.92rem;
  line-height: 1.4;
}

footer {
  margin-top: auto;
}

@media (max-width: 640px) {
  .activity-head {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.15rem;
  }
}
</style>
