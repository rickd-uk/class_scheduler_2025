<template>
  <div class="teacher-scheduler">
    <nav class="navbar">
      <div class="container navbar-content">
        <h1 class="app-title">Teacher Class Scheduler</h1>
        <div class="user-menu" v-if="isAuthenticated">
          <span>Welcome, {{ user?.username }}</span>
          <button @click="handleLogout" class="btn btn-logout">Logout</button>
        </div>
      </div>
    </nav>

    <main class="main-container container">
      <template v-if="isAuthenticated">
        <div class="two-column-layout">
          <div class="left-column">
            <div class="panel-group">
              <TextbooksPanel />
              <ClassesPanel />
              <SchoolYearPanel />
              <DaysOffPanel />
            </div>
          </div>

          <div class="right-column">
            <div class="schedule-tabs">
              <button
                @click="activeTab = 'templates'"
                :class="['tab-btn', { active: activeTab === 'templates' }]">
                Templates
              </button>
              <button
                @click="activeTab = 'weekly'"
                :class="['tab-btn', { active: activeTab === 'weekly' }]">
                Weekly Schedule
              </button>
              <button
                @click="activeTab = 'daily'"
                :class="['tab-btn', { active: activeTab === 'daily' }]">
                Daily Schedule
              </button>
            </div>

            <div class="schedule-view">
              <component :is="activeComponent" />
              </div>
          </div>
        </div>
      </template>

      <div v-else class="auth-container">
        <LoginForm v-if="showLogin" @toggle="showLogin = !showLogin" />
        <RegisterForm v-else @toggle="showLogin = !showLogin" />
      </div>
    </main>

    <TemplateEditorModal v-if="modals.templateEditor" />
    <DailyExceptionModal v-if="modals.dailyException" />
    <WeeklyScheduleModal v-if="modals.weeklySchedule" />
  </div>
</template>

<script setup>
import { computed, ref, watch, shallowRef, markRaw } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router' // Import useRouter for redirect after logout

// Panel Imports
import TextbooksPanel from './components/panels/TextbooksPanel.vue'
import ClassesPanel from './components/panels/ClassesPanel.vue'
import SchoolYearPanel from './components/panels/SchoolYearPanel.vue'
import DaysOffPanel from './components/panels/DaysOffPanel.vue'
import TemplatesPanel from './components/panels/TemplatesPanel.vue'
import WeeklySchedulePanel from './components/panels/WeeklySchedulePanel.vue'
import DailySchedulePanel from './components/panels/DailySchedulePanel.vue'

// Modal Imports
import TemplateEditorModal from './components/modals/TemplateEditorModal.vue'
import DailyExceptionModal from './components/modals/DailyExceptionModal.vue'
import WeeklyScheduleModal from './components/modals/WeeklyScheduleModal.vue'

// Auth Imports
import LoginForm from './components/auth/LoginForm.vue'
import RegisterForm from './components/auth/RegisterForm.vue'

const store = useStore()
const router = useRouter() // Initialize router

const activeTab = ref('weekly') // Default tab
const showLogin = ref(true) // Show login form by default

// Authentication status and user data
const isAuthenticated = computed(() => store.getters['auth/isAuthenticated'])
const user = computed(() => store.getters['auth/currentUser'])

// Modal visibility state
const modals = computed(() => store.state.ui.modals)

// Dynamically load the active schedule panel component
const activeComponent = shallowRef(WeeklySchedulePanel) // Default component
const componentsMap = markRaw({
  templates: TemplatesPanel,
  weekly: WeeklySchedulePanel,
  daily: DailySchedulePanel
})

watch(activeTab, (newTab) => {
  activeComponent.value = componentsMap[newTab] || WeeklySchedulePanel
})


// Function to load initial data for authenticated users
const loadInitialData = () => {
  if (isAuthenticated.value) {
    console.log("User authenticated, loading initial data...");
    store.dispatch('textbooks/fetchTextbooks')
    store.dispatch('classes/fetchClasses')
    store.dispatch('templates/fetchTemplates')
    store.dispatch('schedule/fetchRegularSchedule')
    store.dispatch('schoolYear/fetchSchoolYear')
    store.dispatch('daysOff/fetchDaysOff')
    // Set initial active component based on default tab
    activeComponent.value = componentsMap[activeTab.value] || WeeklySchedulePanel;
  } else {
     console.log("User not authenticated.");
     // Reset potentially sensitive state if needed
     activeTab.value = 'weekly'; // Reset tab
     activeComponent.value = null; // Or set to a default non-auth component if needed
  }
}

// Watch for changes in authentication status
watch(isAuthenticated, (newValue, oldValue) => {
  console.log(`Authentication status changed: ${oldValue} -> ${newValue}`);
  if (newValue) {
    loadInitialData();
    // If user just logged in, router guard should handle redirect
    // but ensure data is loaded if App component remounts or logic requires it
  } else {
    // User logged out, App.vue might re-render or stay mounted
    // Reset state handled within the template (v-if/v-else)
    // The router guard will handle redirecting away from protected routes
    // We might want to clear sensitive data from the store here
    // e.g., store.dispatch('clearSensitiveData')
    activeComponent.value = null; // Ensure no authenticated component tries to render
    showLogin.value = true; // Ensure login form shows if user logs out
  }
}, { immediate: true }); // Use immediate: true to run the watcher on component mount


// Logout handler
const handleLogout = async () => {
  try {
    await store.dispatch('auth/logout')
    // No need to manually push to /login here if the router guard is setup correctly.
    // The guard will detect the unauthenticated state on the next navigation attempt
    // or if the current route requires auth.
    // However, if you want an immediate redirect regardless of current route:
    // router.push({ name: 'login' });
    console.log('Logout successful');
  } catch (error) {
    console.error('Logout failed:', error)
    // Handle logout error (e.g., show notification)
  }
}

</script>

<style scoped>
/* Add component-specific styles if needed */
/* For example, styles specific to the layout within App.vue */
.navbar-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.user-menu {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 0.9rem;
}

.btn-logout {
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  padding: 0.35rem 0.75rem;
  border-radius: 0.25rem;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: background-color 0.2s ease;
}

.btn-logout:hover {
  background-color: rgba(255, 255, 255, 0.3);
}
</style>

