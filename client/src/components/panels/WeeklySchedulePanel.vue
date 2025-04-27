<template>
  <div class="panel weekly-schedule-panel">
    <div class="panel-header">
      <h2 class="panel-title">Regular Weekly Schedule</h2>
      <button @click="openWeeklyEditor" class="btn btn-primary btn-sm">
        Edit Schedule
      </button>
    </div>

     <div v-if="isLoading" class="loading">Loading schedule...</div>
     <div v-else-if="error" class="error-message">{{ error }}</div>
     <div v-else-if="hasSchedule" class="schedule-table-container">
        <table class="schedule-table">
            <thead>
                <tr>
                    <th>Time</th>
                    <th v-for="day in daysOfWeek" :key="day">{{ capitalize(day) }}</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td colspan="6" class="placeholder-content">Weekly schedule display goes here. (Needs implementation based on time slots)</td>
                 </tr>
                 </tbody>
        </table>
    </div>
     <p v-else class="placeholder-content">No regular weekly schedule defined yet.</p>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useStore } from 'vuex';

const store = useStore();

const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']; // Adjust as needed

// --- Computed Properties ---
const schedule = computed(() => store.getters['schedule/regularSchedule']);
const isLoading = computed(() => store.getters['schedule/isLoading']);
const error = computed(() => store.getters['schedule/error']);
// const classes = computed(() => store.getters['classes/allClasses']); // Needed for class names

const hasSchedule = computed(() => {
    return schedule.value && Object.keys(schedule.value).length > 0 && daysOfWeek.some(day => schedule.value[day]?.length > 0);
});

// --- Methods ---
const openWeeklyEditor = () => {
    console.log("Opening Weekly Schedule Editor Modal");
    // Pass the current schedule data to the modal
    store.dispatch('ui/openModal', {
        modalName: 'weeklySchedule',
        data: JSON.parse(JSON.stringify(schedule.value)) // Pass deep copy
    });
};

const capitalize = (s) => {
  if (typeof s !== 'string') return ''
  return s.charAt(0).toUpperCase() + s.slice(1)
}

// --- Lifecycle ---
onMounted(() => {
  // Ensure schedule is fetched if not already present
  if (!hasSchedule.value && !isLoading.value) {
    store.dispatch('schedule/fetchRegularSchedule');
  }
   // Ensure classes are fetched for names (if needed here)
   // if (store.getters['classes/allClasses'].length === 0) {
   //     store.dispatch('classes/fetchClasses');
   // }
});

// --- Data Processing (Placeholder) ---
// You would need logic here to determine time slots based on the schedule data
// and map schedule items to those slots for the table display.
// const timeSlots = computed(() => {
//    // Logic to extract unique start times and create slots
//    return ['09:00', '10:00', '11:00', '13:00', '14:00']; // Example
// });

</script>

<style scoped>
/* Styles for the panel */
.schedule-table-container {
  margin-top: 1rem;
  overflow-x: auto; /* Allow horizontal scrolling on small screens */
}

.schedule-table {
  width: 100%;
  border-collapse: collapse;
  border: 1px solid var(--border-color);
}

.schedule-table th,
.schedule-table td {
  border: 1px solid var(--border-color);
  padding: 0.6rem;
  text-align: left;
  font-size: 0.85rem;
  vertical-align: top;
}

.schedule-table th {
  background-color: var(--light);
  font-weight: 600;
  text-align: center;
}

.schedule-table td {
    min-height: 50px; /* Ensure cells have some height */
}

.btn-sm {
  padding: 0.2rem 0.5rem;
  font-size: 0.75rem;
}
.loading, .error-message {
    padding: 1rem;
    text-align: center;
    color: var(--secondary);
}
</style>

