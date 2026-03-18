<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Tag from 'primevue/tag'
import Navbar from '@/components/Navbar.vue'
import Footer from '@/components/Footer.vue'
import { getStudentTasks } from '@/services/studentSubmissionService'

const router = useRouter()
const loading = ref(false)
const groupName = ref('My Group')
const tasks = ref([])

const termLabel = (termNo) => {
  if (termNo === 1) return '1st Semester'
  if (termNo === 2) return '2nd Semester'
  return `Term ${termNo}`
}

const formatDate = (raw) => {
  if (!raw) return '—'
  return new Date(raw).toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const statusSeverity = (status) => {
  if (!status) return 'secondary'
  const s = String(status).toLowerCase()
  if (s === 'approved') return 'success'
  if (s === 'submitted' || s === 'under review') return 'info'
  if (s === 'revision requested' || s === 'needs revision') return 'warn'
  if (s === 'rejected') return 'danger'
  return 'secondary'
}

const isDue = (dueDate) => {
  if (!dueDate) return false
  return new Date(dueDate) < new Date()
}

// Group tasks by academicYear + termNo for rendering
const termGroups = computed(() => {
  const map = new Map()
  for (const task of tasks.value) {
    const key = `${task.academicYear}|${task.termNo}`
    if (!map.has(key)) {
      map.set(key, {
        academicYear: task.academicYear,
        termNo: task.termNo,
        isActiveTerm: task.isActiveTerm,
        tasks: [],
      })
    }
    map.get(key).tasks.push(task)
  }
  return Array.from(map.values())
})

const loadTasks = async () => {
  loading.value = true
  try {
    const data = await getStudentTasks()
    groupName.value = data?.group?.groupName || 'My Group'
    tasks.value = data?.tasks || []
  } catch (err) {
    console.error('Failed to load tasks', err)
  } finally {
    loading.value = false
  }
}

const openSubmission = (task) => {
  router.push({ name: 'submission-view', query: { taskId: task.taskId } })
}

onMounted(loadTasks)
</script>

<template>
  <div class="tasks-page min-h-screen flex flex-col font-Karla">
    <header>
      <Navbar />
    </header>

    <main class="mx-auto w-full max-w-7xl flex-1 px-4 pb-8 pt-24 sm:px-6 sm:pb-10 sm:pt-28 lg:pt-32">

      <!-- Hero -->
      <Card class="panel-card mb-6">
        <template #content>
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p class="kicker">Student Portal</p>
              <h1 class="headline">Submission Tasks</h1>
              <p class="support-text">
                Select a milestone task below to open the corresponding submission form.
              </p>
            </div>
            <Tag value="Student" severity="success" rounded />
          </div>
        </template>
      </Card>

      <!-- Loading skeleton -->
      <div v-if="loading" class="term-section">
        <div v-for="n in 3" :key="n" class="task-card task-card-skeleton" />
      </div>

      <!-- Empty state -->
      <Card v-else-if="!tasks.length" class="panel-card">
        <template #content>
          <div class="empty-state">
            <p class="empty-icon">📋</p>
            <p class="empty-title">No tasks available yet</p>
            <p class="empty-sub">Ask your coordinator to set up the academic term and milestone tasks.</p>
          </div>
        </template>
      </Card>

      <!-- Task groups by term -->
      <template v-else>
        <section
          v-for="group in termGroups"
          :key="`${group.academicYear}-${group.termNo}`"
          class="term-section"
        >
          <!-- Term header -->
          <div class="term-header">
            <div class="term-label-row">
              <span class="term-title">AY {{ group.academicYear }} — {{ termLabel(group.termNo) }}</span>
              <Tag
                v-if="group.isActiveTerm"
                value="Current Term"
                severity="success"
                rounded
              />
            </div>
          </div>

          <!-- Task cards -->
          <div class="tasks-grid">
            <Card
              v-for="task in group.tasks"
              :key="task.taskId"
              class="panel-card task-card"
              :class="{ 'task-card--active': group.isActiveTerm }"
            >
              <template #content>
                <div class="task-inner">
                  <div class="task-main">
                    <div class="task-top">
                      <h2 class="task-name">{{ task.taskName }}</h2>
                      <div class="task-badges">
                        <Tag
                          v-if="task.submission"
                          :value="task.submission.status"
                          :severity="statusSeverity(task.submission.status)"
                          rounded
                        />
                        <Tag v-else value="Not Started" severity="secondary" rounded />
                        <Tag
                          v-if="isDue(task.dueDate) && !task.submission"
                          value="Overdue"
                          severity="danger"
                          rounded
                        />
                      </div>
                    </div>

                    <p v-if="task.description" class="task-desc">{{ task.description }}</p>

                    <div class="task-meta">
                      <span class="meta-item">
                        <span class="meta-label">Due:</span>
                        <span :class="{ 'text-red-600 font-semibold': isDue(task.dueDate) && !task.submission }">
                          {{ formatDate(task.dueDate) }}
                        </span>
                      </span>
                      <span v-if="task.submission" class="meta-item">
                        <span class="meta-label">Version:</span>
                        v{{ task.submission.versionNo }}
                      </span>
                      <span v-if="task.submission?.submittedAt" class="meta-item">
                        <span class="meta-label">Submitted:</span>
                        {{ formatDate(task.submission.submittedAt) }}
                      </span>
                    </div>
                  </div>

                  <div class="task-action">
                    <Button
                      :label="task.isLocked ? 'Locked' : (task.submission ? 'Open Submission' : 'Start Submission')"
                      :severity="task.isLocked ? 'danger' : (task.submission ? 'secondary' : 'primary')"
                      :outlined="task.isLocked ? false : !!task.submission"
                      :disabled="task.isLocked"
                      size="small"
                      @click="openSubmission(task)"
                    />
                  </div>
                </div>
              </template>
            </Card>
          </div>
        </section>
      </template>
    </main>

    <footer>
      <Footer />
    </footer>
  </div>
</template>

<style scoped>
.tasks-page {
  background: linear-gradient(180deg, #e8f0eb 0%, #f4f9f6 45%, #eaf3ee 100%);
}

.panel-card {
  border-radius: 1rem;
  border: 1px solid #d5e2db;
  box-shadow: 0 12px 32px rgba(18, 43, 32, 0.07);
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
  font-size: 0.95rem;
}

/* Term sections */
.term-section {
  margin-bottom: 2rem;
}

.term-header {
  margin-bottom: 0.85rem;
}

.term-label-row {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  flex-wrap: wrap;
}

.term-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: #1f4535;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Task grid */
.tasks-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: 1fr;
}

@media (min-width: 700px) {
  .tasks-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1100px) {
  .tasks-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* Task card */
.task-card {
  transition: border-color 180ms ease, box-shadow 180ms ease, transform 120ms ease;
}

.task-card:hover {
  border-color: #9ec9b0;
  box-shadow: 0 16px 40px rgba(18, 43, 32, 0.12);
  transform: translateY(-2px);
}

.task-card--active {
  border-color: #6db992;
}

.task-card-skeleton {
  min-height: 10rem;
  border-radius: 1rem;
  background: linear-gradient(90deg, #e4ede8 25%, #edf4ef 50%, #e4ede8 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.task-inner {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  height: 100%;
}

.task-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.task-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.task-name {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: #143025;
  line-height: 1.3;
}

.task-badges {
  display: flex;
  gap: 0.35rem;
  flex-wrap: wrap;
  flex-shrink: 0;
}

.task-desc {
  margin: 0;
  font-size: 0.88rem;
  color: #3f5f4f;
  line-height: 1.45;
}

.task-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem 1.2rem;
  margin-top: 0.25rem;
}

.meta-item {
  font-size: 0.83rem;
  color: #3f5f4f;
  display: flex;
  gap: 0.3rem;
}

.meta-label {
  font-weight: 600;
  color: #1f4535;
}

.task-action {
  display: flex;
  justify-content: flex-end;
}

/* Empty state */
.empty-state {
  text-align: center;
  padding: 3rem 1rem;
}

.empty-icon {
  font-size: 2.5rem;
  margin: 0 0 0.5rem;
}

.empty-title {
  margin: 0 0 0.4rem;
  font-size: 1.1rem;
  font-weight: 700;
  color: #17362b;
}

.empty-sub {
  margin: 0;
  color: #4a6a5a;
  font-size: 0.95rem;
}
</style>
