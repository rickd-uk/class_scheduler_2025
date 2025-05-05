<template>
  <div class="teacher-scheduler">
    <nav class="navbar">
      <div class="container navbar-content">
        <h1 class="app-title">Teacher Class Scheduler</h1>
        <div class="user-menu" v-if="isAuthenticated">
          <span>Welcome, {{ user?.username }}</span>
          <span v-if="isAdminUser" class="admin-badge">(Admin)</span>
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
              <!-- <SchoolYearPanel /> -->
              <DaysOffPanel />
              <ExceptionPatternsPanel />
              <template v-if="isAdminUser">
                <hr class="admin-divider">
                <GlobalSettingsPanel />
              </template>
            </div>
          </div>
          <div class="right-column">
            <div class="schedule-tabs">
              <!-- <button @click="activeTab = 'templates'" :class="['tab-btn', { active: activeTab === 'templates' }]"> -->
              <!--   Templates -->
              <!-- </button> -->
              <button @click="activeTab = 'weekly'" :class="['tab-btn', { active: activeTab === 'weekly' }]">
                Weekly Schedule
              </button>
              <button @click="activeTab = 'daily'" :class="['tab-btn', { active: activeTab === 'daily' }]">
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

    <TemplateEditorModal v-if="store.state.ui.modals.templateEditor"
      :key="'templateEditor-' + store.state.ui.modals.templateEditor" />
    <DailyExceptionModal v-if="store.state.ui.modals.dailyException"
      :key="'dailyException-' + store.state.ui.modals.dailyException" />
    <WeeklyScheduleModal v-if="store.state.ui.modals.weeklySchedule"
      :key="'weeklySchedule-' + store.state.ui.modals.weeklySchedule" />
    <TextbookFormModal v-if="store.state.ui.modals.textbookFormModal"
      :key="'textbookFormModal-' + store.state.ui.modals.textbookFormModal" />
    <LinkTextbookModal v-if="store.state.ui.modals.linkTextbookModal"
      :key="'linkTextbookModal-' + store.state.ui.modals.linkTextbookModal" />
    <DayOffEditorModal v-if="store.state.ui.modals.dayOffEditor"
      :key="'dayOffEditor-' + store.state.ui.modals.dayOffEditor" />
    <ExceptionPatternEditorModal v-if="store.state.ui.modals.exceptionPatternEditor"
      :key="'exceptionPatternEditor-' + store.state.ui.modals.exceptionPatternEditor" />
    <ClassFormModal v-if="store.state.ui.modals.classFormModal"
      :key="'classFormModal-' + store.state.ui.modals.classFormModal" />

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
import ExceptionPatternsPanel from './components/panels/ExceptionPatternsPanel.vue';
import TemplatesPanel from './components/panels/TemplatesPanel.vue'
import WeeklySchedulePanel from './components/panels/WeeklySchedulePanel.vue'
import DailySchedulePanel from './components/panels/DailySchedulePanel.vue'
// *** Import Global Settings Panel ***
import GlobalSettingsPanel from './components/panels/GlobalSettingsPanel.vue';
// *** Removed imports for GlobalDaysOffPanel, GlobalAppliedExceptionsPanel ***

// Modal Imports
import TemplateEditorModal from './components/modals/TemplateEditorModal.vue'
import DailyExceptionModal from './components/modals/DailyExceptionModal.vue'
import WeeklyScheduleModal from './components/modals/WeeklyScheduleModal.vue'
import TextbookFormModal from './components/modals/TextbookFormModal.vue';
import LinkTextbookModal from './components/modals/LinkTextbookModal.vue'
import DayOffEditorModal from './components/modals/DayOffEditorModal.vue'
import ExceptionPatternEditorModal from './components/modals/ExceptionPatternEditorModal.vue';
import ClassFormModal from './components/modals/ClassFormModal.vue';


// Auth Imports
import LoginForm from './components/auth/LoginForm.vue'
import RegisterForm from './components/auth/RegisterForm.vue'

// --- Store and Router ---
const store = useStore();
const router = useRouter();


// --- Watchers for Debugging ---
// ... (Keep existing watchers) ...
watch(() => store.state.ui.modals.classFormModal, (newValue, oldValue) => { console.log(`[App.vue Watcher] classFormModal modal state changed from ${oldValue} to ${newValue}`); });


// --- Component State ---
const activeTab = ref('weekly');
const showLogin = ref(true);

// --- Computed Properties ---
const isAuthenticated = computed(() => store.getters['auth/isAuthenticated']);
const user = computed(() => store.getters['auth/currentUser']);
// Computed property to check if user is admin
const isAdminUser = computed(() => !!user.value?.isAdmin);

// --- Dynamic Component Loading for Schedule Tabs ---
const activeComponent = shallowRef(WeeklySchedulePanel);
const componentsMap = markRaw({
  templates: TemplatesPanel,
  weekly: WeeklySchedulePanel,
  daily: DailySchedulePanel
});

watch(activeTab, (newTab) => {
  activeComponent.value = componentsMap[newTab] || WeeklySchedulePanel;
});

// --- Initial Data Loading ---
const loadInitialData = () => {
  if (isAuthenticated.value) {
    console.log("User authenticated, loading initial data...");
    // Fetch user-specific data
    store.dispatch('textbooks/fetchTextbooks');
    store.dispatch('classes/fetchClasses');
    store.dispatch('templates/fetchTemplates');
    store.dispatch('schedule/fetchRegularSchedule');
    store.dispatch('schedule/fetchAppliedExceptions'); // User exceptions
    store.dispatch('schoolYear/fetchSchoolYear');
    store.dispatch('daysOff/fetchDaysOff'); // User days off
    store.dispatch('exceptionPatterns/fetchPatterns');

    // Fetch global data (needed by DailySchedulePanel and Admin Settings Panel)
    store.dispatch('globalDaysOff/fetchGlobalDaysOff');
    store.dispatch('globalAppliedExceptions/fetchGlobalExceptions');
    store.dispatch('globalSettings/fetchSettings'); // Fetch global toggle settings

    activeComponent.value = componentsMap[activeTab.value] || WeeklySchedulePanel;
  } else {
    console.log("User not authenticated.");
    activeTab.value = 'weekly';
    activeComponent.value = null;
  }
}

// --- Watch Authentication Status ---
watch(isAuthenticated, (newValue, oldValue) => {
  console.log(`Authentication status changed: ${oldValue} -> ${newValue}`);
  if (newValue) {
    loadInitialData();
  } else {
    activeComponent.value = null;
    showLogin.value = true;
    // Optionally reset stores on logout
  }
}, { immediate: true });

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
/* Styles remain the same */
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

.admin-badge {
  font-size: 0.75rem;
  font-weight: bold;
  color: var(--warning);
  background-color: rgba(255, 193, 7, 0.2);
  padding: 0.1em 0.4em;
  border-radius: 3px;
  margin-left: 0.5em;
}

.admin-divider {
  border: none;
  border-top: 2px dashed var(--warning);
  margin: 1rem 0;
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
