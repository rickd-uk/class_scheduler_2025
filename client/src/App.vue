// --- client/src/App.vue ---
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
    <TemplateEditorModal v-if="store.state.ui.modals.templateEditor" />
    <DailyExceptionModal v-if="store.state.ui.modals.dailyException" />
    <WeeklyScheduleModal v-if="store.state.ui.modals.weeklySchedule" />
    <TextbookEditorModal v-if="store.state.ui.modals.textbookEditor" />
    </div>
</template>

<script setup>
// --- Imports ---
import { computed, ref, watch, shallowRef, markRaw } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'

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
// Import the new edit modal
import TextbookEditorModal from './components/modals/TextbookEditorModal.vue'
// Remove import for TextbookFormModal if using separate edit modal
// import TextbookFormModal from './components/modals/TextbookFormModal.vue'

// Auth Imports
import LoginForm from './components/auth/LoginForm.vue'
import RegisterForm from './components/auth/RegisterForm.vue'

// --- Store and Router ---
const store = useStore()
const router = useRouter()


// --- Add this watcher ---
watch(() => store.state.ui.modals.textbookEditor, (newValue, oldValue) => {
  console.log(`[App.vue Watcher] textbookEditor modal state changed from ${oldValue} to ${newValue}`);
});

// --- Component State ---
const activeTab = ref('weekly') // Default schedule view tab
const showLogin = ref(true) // Show login form initially if not authenticated

// --- Computed Properties ---
const isAuthenticated = computed(() => store.getters['auth/isAuthenticated'])
const user = computed(() => store.getters['auth/currentUser'])
// Helper computed to check if a specific modal is open using the UI store getter
const isModalOpen = (modalName) => computed(() => store.getters['ui/isModalOpen'](modalName))

// --- Dynamic Component Loading for Schedule Tabs ---
const activeComponent = shallowRef(WeeklySchedulePanel) // Default component
const componentsMap = markRaw({ // Map tab names to component imports
  templates: TemplatesPanel,
  weekly: WeeklySchedulePanel,
  daily: DailySchedulePanel
})

// Watch for changes in the active tab and update the component to display
watch(activeTab, (newTab) => {
  activeComponent.value = componentsMap[newTab] || WeeklySchedulePanel
})

// --- Initial Data Loading ---
// Function to load necessary data when user is authenticated
const loadInitialData = () => {
  if (isAuthenticated.value) {
    console.log("User authenticated, loading initial data...");
    // Dispatch actions to fetch data - these check internally if data already exists or needs fetching
    store.dispatch('textbooks/fetchTextbooks');
    store.dispatch('classes/fetchClasses');
    store.dispatch('templates/fetchTemplates');
    store.dispatch('schedule/fetchRegularSchedule');
    store.dispatch('schoolYear/fetchSchoolYear');
    store.dispatch('daysOff/fetchDaysOff');
    // Set initial active component based on default tab
    activeComponent.value = componentsMap[activeTab.value] || WeeklySchedulePanel;
  } else {
     console.log("User not authenticated.");
     // Reset potentially sensitive state if needed when user is not logged in
     activeTab.value = 'weekly'; // Reset tab
     activeComponent.value = null; // Clear active schedule component
  }
}

// --- Watch Authentication Status ---
// Watch for changes in authentication status (login/logout)
watch(isAuthenticated, (newValue, oldValue) => {
  console.log(`Authentication status changed: ${oldValue} -> ${newValue}`);
  if (newValue) {
    // If user logs in, load initial data
    loadInitialData();
  } else {
    // If user logs out
    activeComponent.value = null; // Ensure no authenticated component tries to render
    showLogin.value = true; // Ensure login form shows if user logs out
  }
}, { immediate: true }); // Use immediate: true to run the watcher on component mount

// --- Logout Handler ---
const handleLogout = async () => {
  try {
    await store.dispatch('auth/logout');
    console.log('Logout successful');
  } catch (error) {
    console.error('Logout failed:', error);
  }
}
</script>

<style scoped>
/* Component-specific styles for App.vue layout */
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

