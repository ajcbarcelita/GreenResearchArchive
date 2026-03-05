import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import StudentHomeView from '../views/StudentHomeView.vue'
import CapstoneDetailsView from '../views/CapstoneDetails.vue'
import CompleteProfileView from '../views/CompleteProfileView.vue'
import ProfileView from '../views/ProfileView.vue'
import {
  getStoredUser,
  hasAccessToken,
  needsProfileCompletion,
} from '../services/authService'

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
      component: CompleteProfileView,
    },
    {
      path: '/profile',
      name: 'profile',
      component: ProfileView,
    },

    // Repository routes
    // To be implemented id of capstone /id
    {
      path: '/capstone',
      name: 'capstone-details',
      component: CapstoneDetailsView,
    },

    // Student Routes



    // Faculty / Coordinator Routes


  ],
})

router.beforeEach((to) => {
  const isPublicRoute = to.path === '/login'
  const authenticated = hasAccessToken()
  const user = getStoredUser()
  const requiresProfileCompletion = needsProfileCompletion(user)

  if (!authenticated && !isPublicRoute) {
    return '/login'
  }

  if (authenticated && isPublicRoute) {
    return requiresProfileCompletion ? '/complete-profile' : '/dashboard'
  }

  if (authenticated && requiresProfileCompletion && to.path !== '/complete-profile') {
    return '/complete-profile'
  }

  if (authenticated && !requiresProfileCompletion && to.path === '/complete-profile') {
    return '/dashboard'
  }

  return true
})

export default router
