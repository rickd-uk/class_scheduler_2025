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
                            <span v-if="getClassForSlot(day, period).classType === 'numbered'">
                                {{ getClassForSlot(day, period).yearLevel }}-{{ getClassForSlot(day, period).classNumber }}
                            </span>
                            <span v-else-if="getClassForSlot(day, period).classType === 'special'">
                                {{ getClassForSlot(day, period).className }}
                                <span v-if="getClassForSlot(day, period).yearLevel" class="special-year-level-display">
                                    (Yr {{ getClassForSlot(day, period).yearLevel }})
                                </span>
                            </span>
                            <span v-else>
                                ? </span>
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
const scheduleData = computed(() => store.getters['schedule/regularSchedule']);
const classes = computed(() => store.getters['classes/allClasses']);
const isLoadingSchedule = computed(() => store.getters['schedule/isLoading']);
const isLoadingClasses = computed(() => store.getters['classes/isLoading']);
const scheduleError = computed(() => store.getters['schedule/error']);
const classesError = computed(() => store.getters['classes/error']);

// Check if there is any actual schedule data to display
const hasScheduleData = computed(() => {
    return scheduleData.value &&
           Object.keys(scheduleData.value).length > 0 &&
           daysOfWeek.some(day => scheduleData.value[day]?.some(slot => slot !== null));
});

// --- Methods ---

// Function to open the editing modal
const openWeeklyEditor = () => {
    console.log("Opening Weekly Schedule Editor Modal");
    store.dispatch('ui/openModal', {
        modalName: 'weeklySchedule',
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
   const periodIndex = period - 1;
    // Ensure day exists in scheduleData before trying to access its index
    const scheduleItem = scheduleData.value?.[day]?.[periodIndex];
    // If there's no item or it's null or has no classId, return null
    if (!scheduleItem || !scheduleItem.classId) {
        return null; // No class assigned in schedule
    }

    // Find the corresponding class details from the classes array
    // Ensure we compare IDs correctly (e.g., handle string vs number if necessary)
    const classIdToFind = scheduleItem.classId;
    const foundClass = classes.value.find(cls => String(cls.id) === String(classIdToFind));

    // *** CHANGE HERE: Return null if class not found (deleted) ***
    // Return the found class object OR null if the classId from schedule doesn't exist anymore
    return foundClass || null; 
};

// --- Lifecycle Hook ---
onMounted(() => {
  // Ensure schedule data is fetched if not already present
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
/* Style for the first column (Period numbers) */
.schedule-table td:first-child {
    font-weight: 600;
    background-color: var(--light);
    color: var(--secondary);
}

.schedule-item {
    font-weight: 500;
    white-space: nowrap; /* Prevent wrapping */
    overflow: hidden;
    text-overflow: ellipsis;
}
.schedule-item span { /* Ensure spans display correctly */
    display: inline-block;
}
.special-year-level-display { /* Style for optional year level on special classes */
    font-size: 0.8em;
    color: var(--secondary);
    margin-left: 0.3em;
    font-style: italic;
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
