import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import StudentHomeView from '../views/Student/StudentHomeView.vue'
import StudentTasksView from '../views/Student/StudentTasksView.vue'
import CapstoneDetailsView from '../views/CapstoneDetails.vue'
import SubmissionView from '../views/Student/SubmissionView.vue'
import RepositoryView from '../views/RepositoryView.vue'
import CompleteProfileWrapper from '../views/CompleteProfile.vue'
import FacultyCoordinatorHomeView from '../views/Coordinator/HomeView.vue'
import AdvisoryView from '../views/Coordinator/AdvisoryView.vue'
import FacultyCoordinatorSubmissionView from '../views/Coordinator/SubmissionMonitoringView.vue'
import CoordinatorTasksView from '../views/Coordinator/CoordinatorTasksView.vue'
import FacultyHomeView from '../views/Faculty/HomeView.vue'
import FacultyMyAdviseesView from '../views/Faculty/MyAdviseesView.vue'
import FacultyAdviseeDetailView from '../views/Faculty/AdviseeDetailView.vue'
import ReviewQueueView from '../views/Faculty/ReviewQueueView.vue'
import AdminDashboardView from '../views/Admin/DashboardView.vue'
import AdminUsersView from '../views/Admin/UserManagementView.vue'
import AdminProgramsView from '../views/Admin/ProgramManagementView.vue'
import AdminAuditLogsView from '../views/Admin/AuditLogsView.vue'
import ProfileView from '../views/ProfileView.vue'
import { getStoredUser, hasAccessToken, needsProfileCompletion } from '../services/authService'

const getRoleName = (user) =>
  String(user?.roleName || '')
    .trim()
    .toLowerCase()

const resolveCompleteProfilePath = (user) => {
  const roleName = getRoleName(user)
  if (roleName === 'admin') return '/complete-profile/admin'
  if (roleName === 'faculty') return '/complete-profile/faculty'
  if (roleName === 'coordinator') return '/complete-profile/coordinator'

  return '/complete-profile/student'
}

const resolveHomePath = (user) => {
  const roleName = getRoleName(user)
  if (roleName === 'admin') {
    return '/admin/dashboard'
  }

  if (roleName === 'faculty') {
    return '/faculty/home'
  }

  if (roleName === 'coordinator') {
    return '/coordinator/home'
  }

  return '/dashboard'
}

const resolveRepositoryPath = (user) => {
  const roleName = getRoleName(user)
  if (roleName === 'admin') return '/admin/repository'
  if (roleName === 'faculty') return '/faculty/repository'
  if (roleName === 'coordinator') return '/coordinator/repository'

  return '/repository'
}

const resolveCapstoneDetailsPath = (user, id) => {
  const roleName = getRoleName(user)
  const normalizedId = encodeURIComponent(String(id || ''))

  if (roleName === 'admin') return `/admin/capstone/${normalizedId}`
  if (roleName === 'faculty') return `/faculty/capstone/${normalizedId}`
  if (roleName === 'coordinator') return `/coordinator/capstone/${normalizedId}`

  return `/student/capstone/${normalizedId}`
}

const REPOSITORY_ROLE_BY_PATH = {
  '/repository': 'student',
  '/faculty/repository': 'faculty',
  '/coordinator/repository': 'coordinator',
  '/admin/repository': 'admin',
}

const CAPSTONE_ROUTE_ROLE_BY_NAME = {
  'student-capstone-details': 'student',
  'faculty-capstone-details': 'faculty',
  'coordinator-capstone-details': 'coordinator',
  'admin-capstone-details': 'admin',
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // General routes
    {
      path: '/',
      redirect: '/login',
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
    },
    {
      path: '/dashboard',
      name: 'student-home',
      component: StudentHomeView,
    },
    {
      path: '/complete-profile',
      name: 'complete-profile',
      redirect: () => resolveCompleteProfilePath(getStoredUser()),
    },
    {
      path: '/complete-profile/student',
      name: 'complete-profile-student',
      component: CompleteProfileWrapper,
      props: { role: 'student' },
    },
    {
      path: '/complete-profile/faculty',
      name: 'complete-profile-faculty',
      component: CompleteProfileWrapper,
      props: { role: 'faculty' },
    },
    {
      path: '/complete-profile/coordinator',
      name: 'complete-profile-coordinator',
      component: CompleteProfileWrapper,
      props: { role: 'coordinator' },
    },
    {
      path: '/complete-profile/admin',
      name: 'complete-profile-admin',
      component: CompleteProfileWrapper,
      props: { role: 'admin' },
    },
    {
      path: '/complete-profile/:role',
      name: 'complete-profile-role',
      component: CompleteProfileWrapper,
      props: true,
    },
    {
      path: '/complete-profile/faculty-coordinator',
      redirect: '/complete-profile/coordinator',
    },
    {
      path: '/profile',
      name: 'profile',
      component: ProfileView,
    },

    // Repository routes
    {
      path: '/capstone/:id',
      redirect: (to) => resolveCapstoneDetailsPath(getStoredUser(), to.params.id),
    },
    {
      path: '/student/capstone/:id',
      name: 'student-capstone-details',
      component: CapstoneDetailsView,
    },
    {
      path: '/faculty/capstone/:id',
      name: 'faculty-capstone-details',
      component: CapstoneDetailsView,
    },
    {
      path: '/coordinator/capstone/:id',
      name: 'coordinator-capstone-details',
      component: CapstoneDetailsView,
    },
    {
      path: '/admin/capstone/:id',
      name: 'admin-capstone-details',
      component: CapstoneDetailsView,
    },
    {
      path: '/submission',
      name: 'submission-view',
      component: SubmissionView,
    },
    {
      path: '/advisory',
      name: 'advisory-view',
      redirect: '/submission',
    },
    {
      path: '/repository',
      name: 'repository-view',
      component: RepositoryView,
    },

    // Student Routes
    // Student Routes
    {
      path: '/student/tasks',
      name: 'student-tasks',
      component: StudentTasksView,
    },

    // Admin Routes
    {
      path: '/admin/dashboard',
      name: 'admin-dashboard',
      component: AdminDashboardView,
    },
    {
      path: '/admin/users',
      name: 'admin-users',
      component: AdminUsersView,
    },
    {
      path: '/admin/programs',
      name: 'admin-programs',
      component: AdminProgramsView,
    },
    {
      path: '/admin/audit-logs',
      name: 'admin-audit-logs',
      component: AdminAuditLogsView,
    },

    // Faculty Routes
    {
      path: '/faculty/home',
      name: 'faculty-home',
      component: FacultyHomeView,
    },
    {
      path: '/faculty/my-advisees',
      name: 'faculty-my-advisees',
      component: FacultyMyAdviseesView,
    },
    {
      path: '/faculty/my-advisees/:id',
      name: 'faculty-advisee-detail',
      component: FacultyAdviseeDetailView,
      props: true,
    },
    {
      path: '/faculty/submissions',
      name: 'faculty-submissions',
      component: FacultyCoordinatorSubmissionView,
    },
    {
      path: '/faculty/review-queue',
      name: 'faculty-review-queue',
      component: ReviewQueueView,
    },
    {
      path: '/faculty/repository',
      name: 'faculty-repository',
      component: RepositoryView,
    },

    // Faculty / Coordinator Routes
    {
      path: '/coordinator/home',
      name: 'coordinator-home',
      component: FacultyCoordinatorHomeView,
    },
    {
      path: '/coordinator/advisory',
      name: 'coordinator-advisory',
      component: AdvisoryView,
    },
    {
      path: '/coordinator/submissions',
      name: 'coordinator-submissions',
      component: FacultyCoordinatorSubmissionView,
    },
    {
      path: '/coordinator/tasks',
      name: 'coordinator-tasks',
      component: CoordinatorTasksView,
    },
    {
      path: '/coordinator/repository',
      name: 'coordinator-repository',
      component: RepositoryView,
    },
    {
      path: '/faculty-coordinator/home',
      redirect: '/coordinator/home',
    },
    {
      path: '/faculty-coordinator/advisory',
      redirect: '/coordinator/advisory',
    },
    {
      path: '/faculty-coordinator/submissions',
      redirect: '/coordinator/submissions',
    },
    {
      path: '/faculty-coordinator/tasks',
      redirect: '/coordinator/tasks',
    },
    {
      path: '/faculty-coordinator/repository',
      redirect: '/coordinator/repository',
    },
  ],
})

router.beforeEach((to) => {
  const isPublicRoute = to.path === '/login'
  const authenticated = hasAccessToken()
  const user = getStoredUser()
  const roleName = getRoleName(user)
  const requiresProfileCompletion = needsProfileCompletion(user)
  const completeProfilePath = resolveCompleteProfilePath(user)
  const homePath = resolveHomePath(user)
  const repositoryPath = resolveRepositoryPath(user)
  const capstoneDetailsPath = resolveCapstoneDetailsPath(user, to.params?.id)
  const isCompleteProfileRoute = to.path.startsWith('/complete-profile')

  if (!authenticated && !isPublicRoute) {
    return '/login'
  }

  if (authenticated && isPublicRoute) {
    return requiresProfileCompletion ? completeProfilePath : homePath
  }

  if (
    authenticated &&
    !requiresProfileCompletion &&
    to.path === '/dashboard' &&
    homePath !== '/dashboard'
  ) {
    return homePath
  }

  if (authenticated && requiresProfileCompletion && !isCompleteProfileRoute) {
    return completeProfilePath
  }

  if (authenticated && !requiresProfileCompletion && isCompleteProfileRoute) {
    return homePath
  }

  const requiredRoleForPath = REPOSITORY_ROLE_BY_PATH[to.path]
  if (authenticated && !requiresProfileCompletion && requiredRoleForPath) {
    if (requiredRoleForPath === 'student' && roleName !== 'student') {
      return repositoryPath
    }

    if (requiredRoleForPath !== 'student' && roleName !== requiredRoleForPath) {
      return repositoryPath
    }
  }

  const requiredRoleForCapstoneRoute = CAPSTONE_ROUTE_ROLE_BY_NAME[to.name]
  if (authenticated && !requiresProfileCompletion && requiredRoleForCapstoneRoute) {
    if (requiredRoleForCapstoneRoute === 'student' && roleName !== 'student') {
      return capstoneDetailsPath
    }

    if (requiredRoleForCapstoneRoute !== 'student' && roleName !== requiredRoleForCapstoneRoute) {
      return capstoneDetailsPath
    }
  }

  return true
})

export default router
