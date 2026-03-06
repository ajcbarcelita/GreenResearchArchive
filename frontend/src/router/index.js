import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import StudentHomeView from '../views/Student/StudentHomeView.vue'
import CapstoneDetailsView from '../views/CapstoneDetails.vue'
import SubmissionView from '../views/Student/SubmissionView.vue'
import RepositoryView from '../views/RepositoryView.vue'
import StudentCompleteProfileView from '../views/Student/CompleteProfileView.vue'
import FacultyCoordinatorCompleteProfileView from '../views/Faculty & Coordinator/CompleteProfileView.vue'
import FacultyCoordinatorHomeView from '../views/Faculty & Coordinator/HomeView.vue'
import FacultyCoordinatorAdvisoryView from '../views/Faculty & Coordinator/AdvisoryView.vue'
import FacultyCoordinatorSubmissionView from '../views/Faculty & Coordinator/SubmissionMonitoringView.vue'
import ProfileView from '../views/ProfileView.vue'
import {
  getStoredUser,
  hasAccessToken,
  needsProfileCompletion,
} from '../services/authService'

const resolveCompleteProfilePath = (user) => {
  const roleName = String(user?.roleName || '').trim().toLowerCase()
  if (roleName === 'faculty' || roleName === 'coordinator') {
    return '/complete-profile/faculty-coordinator'
  }

  return '/complete-profile/student'
}

const resolveHomePath = (user) => {
  const roleName = String(user?.roleName || '').trim().toLowerCase()
  if (roleName === 'faculty' || roleName === 'coordinator') {
    return '/faculty-coordinator/home'
  }

  return '/dashboard'
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
      component: StudentCompleteProfileView,
    },
    {
      path: '/complete-profile/faculty-coordinator',
      name: 'complete-profile-faculty-coordinator',
      component: FacultyCoordinatorCompleteProfileView,
    },
    {
      path: '/profile',
      name: 'profile',
      component: ProfileView,
    },

    // Repository routes
    {
      path: '/capstone/:id',
      name: 'capstone-details',
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



    // Faculty / Coordinator Routes
    {
      path: '/faculty-coordinator/home',
      name: 'faculty-coordinator-home',
      component: FacultyCoordinatorHomeView,
    },
    {
      path: '/faculty-coordinator/advisory',
      name: 'faculty-coordinator-advisory',
      component: FacultyCoordinatorAdvisoryView,
    },
    {
      path: '/faculty-coordinator/submissions',
      name: 'faculty-coordinator-submissions',
      component: FacultyCoordinatorSubmissionView,
    },
    {
      path: '/faculty-coordinator/repository',
      name: 'faculty-coordinator-repository',
      component: RepositoryView,
    },


  ],
})

router.beforeEach((to) => {
  const isPublicRoute = to.path === '/login'
  const authenticated = hasAccessToken()
  const user = getStoredUser()
  const requiresProfileCompletion = needsProfileCompletion(user)
  const completeProfilePath = resolveCompleteProfilePath(user)
  const homePath = resolveHomePath(user)
  const isCompleteProfileRoute = to.path.startsWith('/complete-profile')

  if (!authenticated && !isPublicRoute) {
    return '/login'
  }

  if (authenticated && isPublicRoute) {
    return requiresProfileCompletion ? completeProfilePath : homePath
  }

  if (authenticated && !requiresProfileCompletion && to.path === '/dashboard' && homePath !== '/dashboard') {
    return homePath
  }

  if (authenticated && requiresProfileCompletion && !isCompleteProfileRoute) {
    return completeProfilePath
  }

  if (authenticated && !requiresProfileCompletion && isCompleteProfileRoute) {
    return homePath
  }

  return true
})

export default router
