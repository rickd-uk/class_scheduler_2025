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
                <hr class="admin-divider" />
                <GlobalSettingsPanel />
              </template>
            </div>
          </div>
          <div class="right-column">
            <div class="schedule-tabs">
              <button
                @click="activeTab = 'weekly'"
                :class="['tab-btn', { active: activeTab === 'weekly' }]"
              >
                Weekly Schedule
              </button>
              <button
                @click="activeTab = 'weekview'"
                :class="['tab-btn', { active: activeTab === 'weekview' }]"
              >
                Week
              </button>
              <button
                @click="activeTab = 'daily'"
                :class="['tab-btn', { active: activeTab === 'daily' }]"
              >
                Daily
              </button>
              <button
                @click="activeTab = 'monthly'"
                :class="['tab-btn', { active: activeTab === 'monthly' }]"
              >
                Monthly
              </button>
            </div>
            <div class="schedule-view">
              <component :is="activeComponent" />
            </div>
          </div>
        </div>
      </template>

      <div v-else class="auth-container">
        <LoginForm v-if="showLogin" @toggle="handleAuthToggle" />
        <div v-else>
          <div v-if="isLoadingGlobalSettings" class="loading-message">
            <p>Loading registration status...</p>
          </div>
          <RegisterForm
            v-else-if="isRegistrationAllowedByAdmin"
            @toggle="handleAuthToggle"
          />
          <div v-else class="registration-disabled-message">
            <h2>Registration Disabled</h2>
            <p>
              New user registration is currently not allowed by the
              administrator.
            </p>
            <p>
              Already have an account?
              <a
                @click.prevent="handleLoginToggleFromDisabled"
                href="#"
                class="toggle-link"
                >Login</a
              >
            </p>
          </div>
        </div>
      </div>
    </main>

    <TemplateEditorModal
      v-if="store.state.ui.modals.templateEditor"
      :key="'templateEditor-' + store.state.ui.modals.templateEditor"
    />
    <DailyExceptionModal
      v-if="store.state.ui.modals.dailyException"
      :key="'dailyException-' + store.state.ui.modals.dailyException"
    />
    <WeeklyScheduleModal
      v-if="store.state.ui.modals.weeklySchedule"
      :key="'weeklySchedule-' + store.state.ui.modals.weeklySchedule"
    />
    <TextbookFormModal
      v-if="store.state.ui.modals.textbookFormModal"
      :key="'textbookFormModal-' + store.state.ui.modals.textbookFormModal"
    />
    <LinkTextbookModal
      v-if="store.state.ui.modals.linkTextbookModal"
      :key="'linkTextbookModal-' + store.state.ui.modals.linkTextbookModal"
    />
    <DayOffEditorModal
      v-if="store.state.ui.modals.dayOffEditor"
      :key="'dayOffEditor-' + store.state.ui.modals.dayOffEditor"
    />
    <ExceptionPatternEditorModal
      v-if="store.state.ui.modals.exceptionPatternEditor"
      :key="
        'exceptionPatternEditor-' + store.state.ui.modals.exceptionPatternEditor
      "
    />
    <ClassFormModal
      v-if="store.state.ui.modals.classFormModal"
      :key="'classFormModal-' + store.state.ui.modals.classFormModal"
    />
  </div>
</template>

<script setup>
// --- Imports ---
import { computed, ref, watch, shallowRef, markRaw, onMounted } from "vue";
import { useStore } from "vuex";
import { useRouter } from "vue-router";

// Panel Imports
import TextbooksPanel from "./components/panels/TextbooksPanel.vue";
import ClassesPanel from "./components/panels/ClassesPanel.vue";
// import SchoolYearPanel from './components/panels/SchoolYearPanel.vue';
import DaysOffPanel from "./components/panels/DaysOffPanel.vue";
import ExceptionPatternsPanel from "./components/panels/ExceptionPatternsPanel.vue";
// import TemplatesPanel from './components/panels/TemplatesPanel.vue'; // Was commented out
import WeeklySchedulePanel from "./components/panels/WeeklySchedulePanel.vue";
import WeeklyViewPanel from "./components/panels/WeeklyViewPanel.vue";
import DailySchedulePanel from "./components/panels/DailySchedulePanel.vue";
import MonthlySchedulePanel from "./components/panels/MonthlySchedulePanel.vue";
import GlobalSettingsPanel from "./components/panels/GlobalSettingsPanel.vue";

// Modal Imports (ensure paths are correct if these are in a subfolder like 'modals')
import TemplateEditorModal from "./components/modals/TemplateEditorModal.vue";
import DailyExceptionModal from "./components/modals/DailyExceptionModal.vue";
import WeeklyScheduleModal from "./components/modals/WeeklyScheduleModal.vue";
import TextbookFormModal from "./components/modals/TextbookFormModal.vue";
import LinkTextbookModal from "./components/modals/LinkTextbookModal.vue";
import DayOffEditorModal from "./components/modals/DayOffEditorModal.vue";
import ExceptionPatternEditorModal from "./components/modals/ExceptionPatternEditorModal.vue";
import ClassFormModal from "./components/modals/ClassFormModal.vue";

// Auth Imports
import LoginForm from "./components/auth/LoginForm.vue";
import RegisterForm from "./components/auth/RegisterForm.vue";

// --- Store and Router ---
const store = useStore();
const router = useRouter();

// --- Component State ---
const activeTab = ref("daily"); // Default tab
const showLogin = ref(true); // Initially show login form

// --- Computed Properties ---
const isAuthenticated = computed(() => store.getters["auth/isAuthenticated"]);
const user = computed(() => store.getters["auth/currentUser"]);
const isAdminUser = computed(() => !!user.value?.isAdmin);

const isRegistrationAllowedByAdmin = computed(
  () => store.getters["globalSettings/isRegistrationAllowed"],
);
const isLoadingGlobalSettings = computed(
  () => store.getters["globalSettings/isLoading"],
);

// --- Watchers for Debugging ---
watch(isRegistrationAllowedByAdmin, (newValue, oldValue) => {
  console.log(
    `[App.vue Watcher] isRegistrationAllowedByAdmin changed from ${oldValue} to ${newValue}`,
  );
  console.log(
    `[App.vue Watcher] AT THIS MOMENT, isLoadingGlobalSettings is: ${isLoadingGlobalSettings.value}`,
  );
});

watch(isLoadingGlobalSettings, (newValue, oldValue) => {
  console.log(
    `[App.vue Watcher] isLoadingGlobalSettings changed from ${oldValue} to ${newValue}`,
  );
});

watch(
  () => store.state.ui.modals.classFormModal,
  (newValue, oldValue) => {
    console.log(
      `[App.vue Watcher] classFormModal modal state changed from ${oldValue} to ${newValue}`,
    );
  },
);

// --- Dynamic Component Loading for Schedule Tabs ---
const componentsMap = markRaw({
  // templates: TemplatesPanel, // Ensure TemplatesPanel is imported if used
  weekly: WeeklySchedulePanel,
  weekview: WeeklyViewPanel,
  daily: DailySchedulePanel,
  monthly: MonthlySchedulePanel,
});
const activeComponent = shallowRef(
  componentsMap[activeTab.value] || DailySchedulePanel,
); // Default to daily or weekly

watch(activeTab, (newTab) => {
  activeComponent.value = componentsMap[newTab] || DailySchedulePanel;
});

// --- Initial Data Loading ---
const loadInitialData = async () => {
  if (!isAuthenticated.value) {
    console.log(
      "[App.vue loadInitialData] User not authenticated. Aborting data load.",
    );
    activeComponent.value = null; // Or a placeholder component
    return;
  }
  console.log(
    "[App.vue loadInitialData] User authenticated, loading initial data...",
  );

  // Group 1: Non-critical, can load in parallel (fire and forget)
  Promise.allSettled([
    // Use allSettled to not fail all if one fails
    store.dispatch("textbooks/fetchTextbooks"),
    store.dispatch("classes/fetchClasses"),
    // store.dispatch('templates/fetchTemplates'), // Ensure TemplatesPanel is imported if this is active
    store.dispatch("schoolYear/fetchSchoolYear"),
    store.dispatch("daysOff/fetchDaysOff"),
    store.dispatch("exceptionPatterns/fetchPatterns"),
  ]).then((results) => {
    results.forEach((result) => {
      if (result.status === "rejected") {
        console.warn(
          "[App.vue loadInitialData] A non-critical data fetch failed:",
          result.reason,
        );
      }
    });
  });

  // Group 2: Critical data for primary views - await these.
  // fetchGlobalSettings is now called by the isAuthenticated watcher or onMount.
  // Only fetch other critical data here if needed.
  try {
    await Promise.all([
      store.dispatch("schedule/fetchRegularSchedule"),
      store.dispatch("schedule/fetchAppliedExceptions"),
      store.dispatch("globalDaysOff/fetchGlobalDaysOff"),
      store.dispatch("globalAppliedExceptions/fetchGlobalExceptions"),
      // store.dispatch('globalSettings/fetchGlobalSettings'), // MOVED - see below
    ]);
  } catch (err) {
    console.error(
      "[App.vue loadInitialData] Failed to fetch critical schedule-related data:",
      err,
    );
  }

  // Ensure the active schedule tab component is set
  activeComponent.value = componentsMap[activeTab.value] || DailySchedulePanel;
};

// --- Watch Authentication Status & Initial Global Settings Load ---
watch(
  isAuthenticated,
  async (newValue, oldValue) => {
    console.log(
      `[App.vue Watcher] Authentication status changed: ${oldValue} -> ${newValue}`,
    );
    if (newValue) {
      // User just logged in or was already authenticated
      console.log(
        "[App.vue Watcher] User is authenticated. Dispatching fetchGlobalSettings then loadInitialData.",
      );
      await store.dispatch("globalSettings/fetchGlobalSettings").then(() => {
        loadInitialData(); // Load other data after global settings are fetched
      });
    } else {
      // User just logged out
      activeComponent.value = null;
      showLogin.value = true; // Default to login screen
      console.log(
        "[App.vue Watcher] User logged out. Dispatching fetchGlobalSettings for auth view.",
      );
      await store.dispatch("globalSettings/fetchGlobalSettings"); // Fetch settings for the logged-out view
    }
  },
  { immediate: true },
); // immediate: true ensures this runs on component mount

// --- Lifecycle Hook ---
onMounted(() => {
  console.log("[App.vue onMounted] Component mounted.");
  // The `isAuthenticated` watcher with `immediate: true` handles the initial call
  // to `fetchGlobalSettings` and `loadInitialData` based on auth state.
  // If you want to ensure global settings are fetched even if the watcher logic is complex,
  // an additional dispatch here could be a fallback, but it might be redundant.
  // For now, relying on the immediate watcher.
  console.log(
    "[App.vue onMounted] Initial isRegistrationAllowedByAdmin:",
    isRegistrationAllowedByAdmin.value,
  );
  console.log(
    "[App.vue onMounted] Initial isLoadingGlobalSettings:",
    isLoadingGlobalSettings.value,
  );
});

// --- Logout Handler ---
const handleLogout = async () => {
  try {
    await store.dispatch("auth/logout");
    console.log("Logout successful");
    // showLogin is set to true by the isAuthenticated watcher when newValue is false.
  } catch (error) {
    console.error("Logout failed:", error);
  }
};

// --- Auth Form Toggle Handler ---
const handleAuthToggle = () => {
  showLogin.value = !showLogin.value;
  console.log("[App.vue] Toggled showLogin to:", showLogin.value);
  console.log(
    "[App.vue] (During toggle) isRegistrationAllowedByAdmin is:",
    isRegistrationAllowedByAdmin.value,
  );
  console.log(
    "[App.vue] (During toggle) isLoadingGlobalSettings is:",
    isLoadingGlobalSettings.value,
  );
};

const handleLoginToggleFromDisabled = () => {
  showLogin.value = true;
  console.log(
    "[App.vue] Clicked Login link from disabled message, showLogin set to true",
  );
};
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

.registration-disabled-message {
  text-align: center;
  padding: 20px;
  margin: 20px auto;
  /* Center the box */
  max-width: 360px;
  /* Consistent with auth forms */
  background-color: #fff3cd;
  /* Light yellow for informational */
  color: #856404;
  /* Dark yellow/brown text */
  border: 1px solid #ffeeba;
  border-radius: 8px;
  /* Match auth form styling */
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.registration-disabled-message h2 {
  margin-top: 0;
  font-size: 1.25rem;
  color: #66512c;
}

.registration-disabled-message p {
  margin-bottom: 0.5rem;
}

.loading-message {
  text-align: center;
  padding: 20px;
  color: #6c757d;
  /* Bootstrap's text-muted color */
}

.toggle-link {
  color: var(--primary);
  text-decoration: underline;
  cursor: pointer;
}

.toggle-link:hover {
  color: var(--primary-dark);
}
</style>
