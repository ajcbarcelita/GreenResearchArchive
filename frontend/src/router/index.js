import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import IndexView from '../views/index.vue'
import CapstoneDetailsView from '../views/CapstoneDetails.vue'

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
      name: 'index',
      component: IndexView,
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

export default router
