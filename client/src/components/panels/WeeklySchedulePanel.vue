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
      {{ scheduleError || classesError }}
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
            <td class="period-cell">{{ period }}</td>
            <td v-for="day in daysOfWeek" :key="`${day}-${period}`" :style="{ backgroundColor: getColor(day, period) }">
              <div v-if="getClassForPeriod(day, period)" class="schedule-item">
                {{ getDisplayName(day, period) }}
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
import { computed, onMounted, watch } from 'vue';
import { useStore } from 'vuex';

const store = useStore();

// days and periods
const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const periods = [1, 2, 3, 4, 5, 6];

const scheduleData = computed(() => store.getters['schedule/regularSchedule']);

// getters
const mergedSchedule = computed(() => store.getters['schedule/mergedSchedule']);
const classesList = computed(() => store.getters['classes/allClasses']);

watch(
  () => classesList.value,
  cl => console.log('👥 classesList IDs:', cl.map(c => c.id)),
  { immediate: true }
);

const isLoadingSchedule = computed(() => store.getters['schedule/isLoading']);
const isLoadingClasses = computed(() => store.getters['classes/isLoading']);
const scheduleError = computed(() => store.getters['schedule/error']);
const classesError = computed(() => store.getters['classes/error']);

// check data exists
const hasScheduleData = computed(() =>
  Object.values(mergedSchedule.value).some(dayArr =>
    dayArr.some(slot => slot !== null)
  )
);

const getClassForPeriod = (day, period) => {
  const idx = period - 1;
  const daySlots = mergedSchedule.value[day] || [];
  const slot = daySlots[idx];

  // console.log(`getClassForPeriod →`, { day, period, daySlots, slot });

  if (!slot || !slot.classId) return null;
  return (
    classesList.value.find((c) => String(c.id) === String(slot.classId)) ||
    null
  );
};

// capitalize utility
const capitalize = s => s.charAt(0).toUpperCase() + s.slice(1);

// open modal
const openWeeklyEditor = () => {
  store.dispatch('ui/openModal', {
    modalName: 'weeklySchedule',
    data: JSON.parse(JSON.stringify(mergedSchedule.value))
  });
};

// helpers to get slot, class, name, color
function getSlot(day, period) {
  const arr = mergedSchedule.value[day] || [];
  return arr[period - 1] || null;
}
function getClass(day, period) {
  const slot = getSlot(day, period);
  if (!slot?.classId) return null;
  return classesList.value.find(c => c.id === slot.classId) || null;
}
function getDisplayName(day, period) {
  const cls = getClass(day, period);
  if (!cls) return '';
  if (cls.classType === 'numbered') {
    const y = +cls.yearLevel;
    const displayYear = y <= 3 ? y : y - 3;
    const suffix = y <= 3 ? 'J' : 'H';
    return `${displayYear}${suffix}-${cls.classNumber}`;
  }
  return cls.className;
}
function getColor(day, period) {
  const cls = getClass(day, period);
  return cls?.color || 'transparent';
}

watch(
  () => scheduleData.value,
  (newSched) => {
    console.log('🕵️‍♂️ [WeeklySchedulePanel] scheduleData now is:', newSched);
    console.log('🕵️‍♂️ Tuesday slots:', newSched.tuesday);
  },
  { immediate: true }
);

watch(
  () => classesList.value,
  (cl) => console.log('👥 [WeeklySchedulePanel] classesList is now:', cl),
  { immediate: true }
);

// fetch on mount
onMounted(() => {
  if (!isLoadingSchedule.value) store.dispatch('schedule/fetchRegularSchedule');
  if (!isLoadingClasses.value) store.dispatch('classes/fetchClasses');
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
  table-layout: fixed;
}

.schedule-table th,
.schedule-table td {
  border: 1px solid var(--border-color);
  padding: 0.5rem;
  text-align: center;
}

.schedule-table th {
  background: var(--light);
}

.period-cell {
  background: var(--light);
  font-weight: 600;
}

.schedule-item {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.no-class {
  color: var(--secondary);
  font-style: italic;
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
  background: #f8d7da;
}

.btn-sm {
  padding: 0.2rem 0.5rem;
  font-size: 0.75rem;
}
</style>
