<template>
  <div class="panel weekly-schedule-panel">
    <div class="panel-header">
      <h2 class="panel-title">Regular Weekly Schedule</h2>
      <button @click="openWeeklyEditor" class="btn btn-primary btn-sm">
        Edit Schedule
      </button>
    </div>

    <div v-if="isLoadingSchedule || isLoadingClasses" class="loading">
      Loading schedule...
    </div>
    <div v-else-if="scheduleError || classesError" class="error-message">
      {{ scheduleError || classesError || 'Error loading data.' }}
    </div>

    <div v-else-if="hasScheduleData" class="schedule-table-container">
      <table class="schedule-table">
        <thead>
          <tr>
            <th>Period</th>
            <th v-for="day in daysOfWeek" :key="day">{{ capitalize(day) }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="period in periods" :key="period">
            <td>{{ period }}</td>
            <td v-for="day in daysOfWeek" :key="`${day}-${period}`"
              :style="{ backgroundColor: getClassColor(day, period) || 'transparent' }">
              <div v-if="getClassForPeriod(day, period)" class="schedule-item">
                <span v-if="getClassForPeriod(day, period).classType === 'numbered'">
                  {{ formatNumberedClassName(getClassForPeriod(day, period)) }}
                </span>
                <span v-else-if="getClassForPeriod(day, period).classType === 'special'">
                  {{ getClassForPeriod(day, period).className }}
                  <span v-if="getClassForPeriod(day, period).yearLevel" class="special-year-level-display">
                    (Yr {{ getClassForPeriod(day, period).yearLevel }})
                  </span>
                </span>
                <span v-else>?</span>
              </div>
              <div v-else class="no-class">--</div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <p v-else class="placeholder-content">
      No regular weekly schedule defined yet. Click 'Edit Schedule' to create one.
    </p>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useStore } from 'vuex';

const store = useStore();

// Define days (including Saturday) and periods for the grid
const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const periods = [1, 2, 3, 4, 5, 6];

// --- Computed Properties from Store ---
const scheduleData = computed(() => store.getters['schedule/regularSchedule']);
const classesList = computed(() => store.getters['classes/allClasses']);
const isLoadingSchedule = computed(() => store.getters['schedule/isLoading']);
const isLoadingClasses = computed(() => store.getters['classes/isLoading']);
const scheduleError = computed(() => store.getters['schedule/error']);
const classesError = computed(() => store.getters['classes/error']);

// Check if there is any actual schedule data to display
const hasScheduleData = computed(() => {
  return (
    scheduleData.value &&
    Object.keys(scheduleData.value).length > 0 &&
    daysOfWeek.some((day) => scheduleData.value[day]?.some((slot) => slot !== null))
  );
});

// --- Methods ---

// Open the weekly editor modal
const openWeeklyEditor = () => {
  console.log('Opening Weekly Schedule Editor Modal');
  store.dispatch('ui/openModal', {
    modalName: 'weeklySchedule',
    data: JSON.parse(JSON.stringify(scheduleData.value)),
  });
};

// Capitalize day names for headers
const capitalize = (s) => {
  if (typeof s !== 'string') return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
};

// Find full class details for a given day & period
const getClassForPeriod = (day, period) => {
  const idx = period - 1;
  const slot = scheduleData.value?.[day]?.[idx];
  if (!slot || !slot.classId) return null;
  return classesList.value.find((c) => String(c.id) === String(slot.classId)) || null;
};

// Get the background color for a class slot
const getClassColor = (day, period) => {
  const cls = getClassForPeriod(day, period);
  return cls ? cls.color || '#FFFFFF' : null;
};

// Format numbered class names like "1J-3" or "3H-8"
const formatNumberedClassName = (cls) => {
  if (!cls || cls.classType !== 'numbered') return '?';
  const yearNum = parseInt(cls.yearLevel, 10);
  const displayYear = yearNum <= 3 ? yearNum : yearNum - 3;
  const suffix = yearNum <= 3 ? 'J' : 'H';
  return `${displayYear}${suffix}-${cls.classNumber}`;
};

// --- Lifecycle Hook ---
onMounted(() => {
  if (
    (!scheduleData.value || Object.keys(scheduleData.value).length === 0) &&
    !isLoadingSchedule.value
  ) {
    console.log('[WeeklySchedulePanel] Fetching regular schedule on mount.');
    store.dispatch('schedule/fetchRegularSchedule');
  }
  if (classesList.value.length === 0 && !isLoadingClasses.value) {
    console.log('[WeeklySchedulePanel] Fetching classes on mount.');
    store.dispatch('classes/fetchClasses');
  }
});
</script>

<style scoped>
.schedule-table-container {
  margin-top: 1rem;
  overflow-x: auto;
}

.schedule-table {
  width: 100%;
  border-collapse: collapse;
  border: 1px solid var(--border-color);
  table-layout: fixed;
}

.schedule-table th,
.schedule-table td {
  border: 1px solid var(--border-color);
  padding: 0.6rem;
  text-align: center;
  font-size: 0.85rem;
  vertical-align: middle;
  height: 50px;
  min-width: 90px;
  transition: background-color 0.3s ease;
}

.schedule-table th {
  background-color: var(--light);
  font-weight: 600;
}

.schedule-table td:first-child {
  font-weight: 600;
  background-color: var(--light) !important;
  color: var(--secondary);
  min-width: 60px;
  width: 60px;
}

.schedule-item {
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.special-year-level-display {
  font-size: 0.8em;
  color: var(--secondary);
  margin-left: 0.3em;
  font-style: italic;
}

.no-class {
  color: var(--secondary);
  font-style: italic;
  font-size: 0.8rem;
}

.loading,
.error-message,
.placeholder-content {
  padding: 1rem;
  text-align: center;
  color: var(--secondary);
}

.error-message {
  color: var(--danger);
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: var(--border-radius);
}
</style>
