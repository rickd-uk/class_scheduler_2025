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
    <LinkTextbookModal v-if="store.state.ui.modals.linkTextbookModal" />
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
import TextbookEditorModal from './components/modals/TextbookEditorModal.vue'
// --- Add the import for LinkTextbookModal ---
import LinkTextbookModal from './components/modals/LinkTextbookModal.vue'


// Auth Imports
import LoginForm from './components/auth/LoginForm.vue'
import RegisterForm from './components/auth/RegisterForm.vue'

// --- Store and Router ---
const store = useStore();
const router = useRouter();


// --- Watchers for Debugging ---
watch(() => store.state.ui.modals.textbookEditor, (newValue, oldValue) => {
  console.log(`[App.vue Watcher] textbookEditor modal state changed from ${oldValue} to ${newValue}`);
});
watch(() => store.state.ui.modals.weeklySchedule, (newValue, oldValue) => {
  console.log(`[App.vue Watcher] weeklySchedule modal state changed from ${oldValue} to ${newValue}`);
});
watch(() => store.state.ui.modals.linkTextbookModal, (newValue, oldValue) => {
  console.log(`[App.vue Watcher] linkTextbookModal modal state changed from ${oldValue} to ${newValue}`);
});


// --- Component State ---
const activeTab = ref('weekly');
const showLogin = ref(true);

// --- Computed Properties ---
const isAuthenticated = computed(() => store.getters['auth/isAuthenticated']);
const user = computed(() => store.getters['auth/currentUser']);
// Removed isModalOpen computed property as we access state directly in template now

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
    store.dispatch('textbooks/fetchTextbooks');
    store.dispatch('classes/fetchClasses');
    store.dispatch('templates/fetchTemplates');
    store.dispatch('schedule/fetchRegularSchedule');
    store.dispatch('schoolYear/fetchSchoolYear');
    store.dispatch('daysOff/fetchDaysOff');
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
.navbar-content { display: flex; justify-content: space-between; align-items: center; }
.user-menu { display: flex; align-items: center; gap: 1rem; font-size: 0.9rem; }
.btn-logout { background-color: rgba(255, 255, 255, 0.2); color: white; border: none; padding: 0.35rem 0.75rem; border-radius: 0.25rem; cursor: pointer; font-size: 0.875rem; font-weight: 500; transition: background-color 0.2s ease; }
.btn-logout:hover { background-color: rgba(255, 255, 255, 0.3); }
</style>

