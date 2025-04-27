import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
// Import the store instance directly
import store from '../store'

// Auth components (use these directly for routes)
import LoginForm from '../components/auth/LoginForm.vue'
import RegisterForm from '../components/auth/RegisterForm.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView, // The main view shown inside App.vue when logged in
    meta: { requiresAuth: true }
  },
  {
    path: '/login',
    name: 'login',
    // Use the component directly for the login page content
    component: LoginForm,
    meta: { requiresGuest: true }
  },
  {
    path: '/register',
    name: 'register',
     // Use the component directly for the registration page content
    component: RegisterForm,
    meta: { requiresGuest: true }
  },
  // Catch-all route (optional)
  // { path: '/:pathMatch(.*)*', name: 'NotFound', component: () => import('../views/NotFoundView.vue') }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL || '/'), // Use BASE_URL from Vite env if available
  routes
})

// Navigation guard
router.beforeEach((to, from, next) => {
  // Access the store state directly using the imported instance
  const isAuthenticated = store.getters['auth/isAuthenticated'] // Use getter for consistency

  // Check if route requires authentication
  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (!isAuthenticated) {
      // Redirect to login if trying to access a protected route without authentication
      console.log('Guard: Auth required, redirecting to login');
      next({ name: 'login', query: { redirect: to.fullPath } }) // Optional: redirect back after login
    } else {
      // Proceed if authenticated
      console.log('Guard: Auth required, user authenticated, proceeding');
      next()
    }
  }
  // Check if route requires guest (non-authenticated) status
  else if (to.matched.some(record => record.meta.requiresGuest)) {
    if (isAuthenticated) {
      // Redirect to home if trying to access guest routes (like login/register) when already authenticated
      console.log('Guard: Guest required, user authenticated, redirecting to home');
      next({ name: 'home' })
    } else {
      // Proceed if not authenticated
      console.log('Guard: Guest required, user not authenticated, proceeding');
      next()
    }
  }
  // Routes that don't require auth or guest status
  else {
    console.log('Guard: No specific auth requirement, proceeding');
    next()
  }
})

export default router

