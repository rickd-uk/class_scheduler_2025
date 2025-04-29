<template>
  <div class="panel weekly-schedule-panel">
    <div class="panel-header">
      <h2 class="panel-title">Regular Weekly Schedule</h2>
      <button @click="openWeeklyEditor" class="btn btn-primary btn-sm">
        Edit Schedule
      </button>
    </div>

     <div v-if="isLoadingSchedule || isLoadingClasses" class="loading">Loading schedule...</div>
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
                    <td v-for="day in daysOfWeek" :key="`${day}-${period}`">
                        <div v-if="getClassForSlot(day, period)" class="schedule-item">
                            {{ getClassForSlot(day, period).yearLevel }}-{{ getClassForSlot(day, period).classNumber }}
                        </div>
                        <div v-else class="no-class">--</div>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
    <p v-else class="placeholder-content">No regular weekly schedule defined yet. Click 'Edit Schedule' to create one.</p>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useStore } from 'vuex';

const store = useStore();

// Define days and periods for the grid
const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
const periods = [1, 2, 3, 4, 5, 6];

// --- Computed Properties from Store ---
// Get the raw schedule data (object with days as keys, arrays of {classId: id} or null as values)
const scheduleData = computed(() => store.getters['schedule/regularSchedule']);
// Get the list of all defined classes {id, classNumber, yearLevel, ...}
const classes = computed(() => store.getters['classes/allClasses']);
// Loading and error states
const isLoadingSchedule = computed(() => store.getters['schedule/isLoading']);
const isLoadingClasses = computed(() => store.getters['classes/isLoading']);
const scheduleError = computed(() => store.getters['schedule/error']);
const classesError = computed(() => store.getters['classes/error']);

// Check if there is any actual schedule data to display
const hasScheduleData = computed(() => {
    // Check if scheduleData is populated and if any day has at least one non-null entry
    return scheduleData.value &&
           Object.keys(scheduleData.value).length > 0 &&
           daysOfWeek.some(day => scheduleData.value[day]?.some(slot => slot !== null));
});

// --- Methods ---

// Function to open the editing modal
const openWeeklyEditor = () => {
    console.log("Opening Weekly Schedule Editor Modal");
    // Pass the current schedule data (fetched from store) to the modal
    store.dispatch('ui/openModal', {
        modalName: 'weeklySchedule',
        // Pass a deep copy to prevent accidental modification before saving
        data: JSON.parse(JSON.stringify(scheduleData.value))
    });
};

// Helper to capitalize day names for table headers
const capitalize = (s) => {
  if (typeof s !== 'string') return ''
  return s.charAt(0).toUpperCase() + s.slice(1)
}

// Helper function to find the full class details for a given day and period
const getClassForSlot = (day, period) => {
    // Adjust period to be 0-indexed for the array
    const periodIndex = period - 1;
    // Get the schedule item for the specific day and period index
    // Ensure day exists in scheduleData before trying to access its index
    const scheduleItem = scheduleData.value?.[day]?.[periodIndex];

    // If there's no item or it's null, return null
    if (!scheduleItem || !scheduleItem.classId) {
        return null;
    }

    // Find the corresponding class details from the classes array
    // Ensure we compare IDs correctly (e.g., handle string vs number if necessary)
    const classIdToFind = scheduleItem.classId;
    const foundClass = classes.value.find(cls => String(cls.id) === String(classIdToFind)); // Safer comparison

    // Return the found class object, or a placeholder if not found
    return foundClass || { yearLevel: '?', classNumber: '?' }; // Placeholder for missing class
};

// --- Lifecycle Hook ---
onMounted(() => {
  // Ensure schedule data is fetched if not already present
  // Check if scheduleData is empty or not yet loaded
  if ((!scheduleData.value || Object.keys(scheduleData.value).length === 0) && !isLoadingSchedule.value) {
    console.log("[WeeklySchedulePanel] Fetching regular schedule on mount.");
    store.dispatch('schedule/fetchRegularSchedule');
  }
   // Ensure classes are fetched for displaying names/details
   if (classes.value.length === 0 && !isLoadingClasses.value) {
       console.log("[WeeklySchedulePanel] Fetching classes on mount.");
       store.dispatch('classes/fetchClasses');
   }
});

</script>

<style scoped>
/* Styles for the panel display */
.schedule-table-container {
  margin-top: 1rem;
  overflow-x: auto; /* Allow horizontal scrolling if needed */
}

.schedule-table {
  width: 100%;
  border-collapse: collapse;
  border: 1px solid var(--border-color);
  table-layout: fixed; /* Even column widths */
}

.schedule-table th,
.schedule-table td {
  border: 1px solid var(--border-color);
  padding: 0.6rem; /* Adjust padding */
  text-align: center;
  font-size: 0.85rem;
  vertical-align: middle; /* Center content vertically */
  height: 50px; /* Ensure consistent row height */
  min-width: 90px; /* Minimum width for columns */
}

.schedule-table th {
  background-color: var(--light);
  font-weight: 600;
}

.schedule-item {
    font-weight: 500;
    /* Add background or other styling if desired */
    white-space: nowrap; /* Prevent wrapping */
    overflow: hidden;
    text-overflow: ellipsis;
}

.no-class {
    color: var(--secondary); /* Lighter color for empty slots */
    font-style: italic;
    font-size: 0.8rem;
}

.btn-sm {
  padding: 0.2rem 0.5rem;
  font-size: 0.75rem;
}
.loading, .error-message, .placeholder-content {
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

