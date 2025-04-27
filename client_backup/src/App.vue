<!-- client/src/App.vue -->
<template>
  <div class="teacher-scheduler">
    <nav class="navbar">
      <div class="container">
        <h1 class="app-title">Teacher Class Scheduler</h1>
        <div class="user-menu" v-if="isAuthenticated">
          <span>{{ user.username }}</span>
          <button @click="logout" class="btn-logout">Logout</button>
        </div>
      </div>
    </nav>

    <main class="main-container container">
      <template v-if="isAuthenticated">
        <div class="two-column-layout">
          <!-- Left column - contains management panels -->
          <div class="left-column">
            <div class="panel-group">
              <TextbooksPanel />
              <ClassesPanel />
              <SchoolYearPanel />
              <DaysOffPanel />
            </div>
          </div>

          <!-- Right column - contains schedule views -->
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
              <keep-alive>
                <TemplatesPanel v-if="activeTab === 'templates'" />
                <WeeklySchedulePanel v-else-if="activeTab === 'weekly'" />
                <DailySchedulePanel v-else-if="activeTab === 'daily'" />
              </keep-alive>
            </div>
          </div>
        </div>
      </template>
      
      <div v-else class="auth-container">
        <login-form v-if="showLogin" @toggle="showLogin = !showLogin" />
        <register-form v-else @toggle="showLogin = !showLogin" />
      </div>
    </main>

    <!-- Modals -->
    <TemplateEditorModal />
    <DailyExceptionModal />
    <WeeklyScheduleModal />
  </div>
</template>

<script>
import { mapState, mapActions } from 'vuex'
import TextbooksPanel from '@/components/panels/TextbooksPanel.vue'
import ClassesPanel from '@/components/panels/ClassesPanel.vue'
import SchoolYearPanel from '@/components/panels/SchoolYearPanel.vue'
import DaysOffPanel from '@/components/panels/DaysOffPanel.vue'
import TemplatesPanel from '@/components/panels/TemplatesPanel.vue'
import WeeklySchedulePanel from '@/components/panels/WeeklySchedulePanel.vue'
import DailySchedulePanel from '@/components/panels/DailySchedulePanel.vue'
import TemplateEditorModal from '@/components/modals/TemplateEditorModal.vue'
import DailyExceptionModal from '@/components/modals/DailyExceptionModal.vue'
import WeeklyScheduleModal from '@/components/modals/WeeklyScheduleModal.vue'
import LoginForm from '@/components/auth/LoginForm.vue'
import RegisterForm from '@/components/auth/RegisterForm.vue'

export default {
  name: 'App',
  components: {
    TextbooksPanel,
    ClassesPanel,
    SchoolYearPanel,
    DaysOffPanel,
    TemplatesPanel,
    WeeklySchedulePanel,
    DailySchedulePanel,
    TemplateEditorModal,
    DailyExceptionModal,
    WeeklyScheduleModal,
    LoginForm,
    RegisterForm
  },
  data() {
    return {
      activeTab: 'weekly',
      showLogin: true
    }
  },
  computed: {
    ...mapState('auth', ['isAuthenticated', 'user'])
  },
  methods: {
    ...mapActions('auth', ['logout'])
  },
  created() {
    // Load necessary data when app starts
    if (this.isAuthenticated) {
      this.$store.dispatch('textbooks/fetchTextbooks')
      this.$store.dispatch('classes/fetchClasses')
      this.$store.dispatch('templates/fetchTemplates')
      this.$store.dispatch('schedule/fetchRegularSchedule')
      this.$store.dispatch('schoolYear/fetchSchoolYear')
      this.$store.dispatch('daysOff/fetchDaysOff')
    }
  }
}
</script>

<style>
:root {
  --primary: #4b70e2;
  --primary-dark: #3a5bbf;
  --secondary: #6c757d;
  --success: #28a745;
  --danger: #dc3545;
  --warning: #ffc107;
  --info: #17a2b8;
  --light: #f8f9fa;
  --dark: #343a40;
  --body-bg: #f5f7fa;
  --card-bg: #ffffff;
  --border-color: #e2e8f0;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  margin: 0;
  padding: 0;
  background-color: var(--body-bg);
  color: #333;
  line-height: 1.5;
}

.container {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 1rem;
}

.navbar {
  background-color: var(--primary);
  color: white;
  padding: 1rem 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.app-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.main-container {
  padding: 1.5rem 1rem;
}

.two-column-layout {
  display: grid;
  grid-template-columns: 350px 1fr;
  gap: 1.5rem;
}

@media (max-width: 1024px) {
  .two-column-layout {
    grid-template-columns: 1fr;
  }
  
  .left-column {
    order: 2;
  }
  
  .right-column {
    order: 1;
  }
}

.left-column .panel-group {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

.right-column {
  display: flex;
  flex-direction: column;
}

.schedule-tabs {
  display: flex;
  margin-bottom: 1rem;
  border-bottom: 1px solid var(--border-color);
}

.tab-btn {
  padding: 0.75rem 1.5rem;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  font-size: 1rem;
  font-weight: 500;
  color: var(--secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn:hover {
  color: var(--primary);
}

.tab-btn.active {
  color: var(--primary);
  border-bottom-color: var(--primary);
}

.schedule-view {
  background-color: var(--card-bg);
  border-radius: 0.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  padding: 1.5rem;
  flex-grow: 1;
}

.auth-container {
  max-width: 400px;
  margin: 2rem auto;
}

.user-menu {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.btn-logout {
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  padding: 0.25rem 0.75rem;
  border-radius: 0.25rem;
  cursor: pointer;
  font-size: 0.875rem;
}

.btn-logout:hover {
  background-color: rgba(255, 255, 255, 0.3);
}
</style>
