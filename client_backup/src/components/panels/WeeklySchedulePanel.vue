<!-- client/src/components/panels/WeeklySchedulePanel.vue -->
<template>
  <div class="weekly-schedule-panel">
    <div class="panel-header">
      <h2 class="panel-title">Regular Weekly Schedule</h2>
      <button @click="openWeeklyEditor" class="btn btn-primary">
        <i class="fas fa-edit"></i> Edit Schedule
      </button>
    </div>

    <div class="schedule-table-container">
      <table class="schedule-table">
        <thead>
          <tr>
            <th class="period-header">Period</th>
            <th v-for="day in weekdays" :key="day.index" class="day-header">
              {{ day.shortName }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="period in 6" :key="`period-${period}`" class="period-row">
            <td class="period-cell">P{{ period }}</td>
            <td 
              v-for="day in weekdays" 
              :key="`${day.index}-${period}`"
              class="schedule-cell"
            >
              <div v-if="getClassForPeriod(day.index, period)" class="class-info">
                <div class="class-code">{{ getClassForPeriod(day.index, period).className }}</div>
                <div class="class-title">{{ getClassForPeriod(day.index, period).title }}</div>
              </div>
              <div v-else class="empty-cell">---</div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex'

export default {
  name: 'WeeklySchedulePanel',
  data() {
    return {
      weekdays: [
        { index: 1, name: 'Monday', shortName: 'Mon' },
        { index: 2, name: 'Tuesday', shortName: 'Tue' },
        { index: 3, name: 'Wednesday', shortName: 'Wed' },
        { index: 4, name: 'Thursday', shortName: 'Thu' },
        { index: 5, name: 'Friday', shortName: 'Fri' }
      ]
    }
  },
  computed: {
    ...mapState('schedule', ['regularSchedule']),
    ...mapGetters('classes', ['getClassById'])
  },
  methods: {
    ...mapActions('ui', ['openModal']),
    
    openWeeklyEditor() {
      this.openModal('weeklySchedule')
    },
    
    getClassForPeriod(dayIndex, periodNum) {
      // Check if we have a schedule for this day
      const daySchedule = this.regularSchedule[dayIndex]
      if (!daySchedule) return null
      
      // Check if we have a class for this period
      const classId = daySchedule[periodNum]
      if (!classId) return null
      
      // Return the class info
      return this.getClassById(classId)
    }
  }
}
</script>

<style scoped>
.weekly-schedule-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.panel-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--dark);
  margin: 0;
}

.schedule-table-container {
  flex-grow: 1;
  overflow-x: auto;
}

.schedule-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.period-header, .day-header {
  background-color: #f3f4f6;
  padding: 0.75rem;
  text-align: center;
  font-weight: 600;
  border: 1px solid #e5e7eb;
}

.period-cell {
  background-color: #f3f4f6;
  padding: 0.5rem;
  text-align: center;
  font-weight: 600;
  border: 1px solid #e5e7eb;
}

.schedule-cell {
  height: 80px;
  border: 1px solid #e5e7eb;
  vertical-align: top;
  padding: 0.5rem;
}

.class-info {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.class-code {
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.class-title {
  font-size: 0.85rem;
  color: #4b5563;
}

.empty-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #9ca3af;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-primary {
  background-color: var(--primary);
  color: white;
}

.btn-primary:hover {
  background-color: var(--primary-dark);
}
</style>
