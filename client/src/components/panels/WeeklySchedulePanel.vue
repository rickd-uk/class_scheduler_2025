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
                <span v-else>
                  ? </span>
              </div>
              <div v-else class="no-class">--</div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <p v-else class="placeholder-content">No regular weekly schedule defined yet. Click 'Edit Schedule' to create one.
    </p>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useStore } from 'vuex';

const store = useStore();

// Define days and periods for the grid
const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const periods = [1, 2, 3, 4, 5, 6];

// --- Computed Properties from Store ---
const scheduleData = computed(() => store.getters['schedule/mergedSchedule']);
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
const getClassForPeriod = (day, period) => { // Renamed from getClassForSlot if preferred
  const periodIndex = period - 1;
  const scheduleItem = scheduleData.value?.[day]?.[periodIndex];
  if (!scheduleItem || !scheduleItem.classId) {
    return null; // No class assigned in schedule
  }
  const classIdToFind = scheduleItem.classId;
  const foundClass = classes.value.find(cls => String(cls.id) === String(classIdToFind));
  return foundClass || null; // Return null if class definition not found (deleted)
};

// --- Add helper to get color ---
// Helper function to get the color for a specific schedule slot
const getClassColor = (day, period) => {
  const cls = getClassForPeriod(day, period); // Get the class object for the slot
  // Return the class color or null (which defaults to transparent in the style binding)
  // Use white as a fallback if color is missing but class exists
  return cls ? (cls.color || '#FFFFFF') : null;
};

// Helper to format numbered class names like "1J-3" or "3H-8"
const formatNumberedClassName = (cls) => {
  if (!cls || cls.classType !== 'numbered' || !cls.yearLevel || !cls.classNumber) {
    return '?'; // Fallback for invalid data
  }
  const yearNum = parseInt(cls.yearLevel, 10);
  const displayYear = yearNum <= 3 ? yearNum : yearNum - 3;
  const schoolSuffix = yearNum <= 3 ? 'J' : 'H';
  return `${displayYear}${schoolSuffix}-${cls.classNumber}`;
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
  overflow-x: auto;
  /* Allow horizontal scrolling if needed */
}

.schedule-table {
  width: 100%;
  border-collapse: collapse;
  border: 1px solid var(--border-color);
  table-layout: fixed;
  /* Even column widths */
}

.schedule-table th,
.schedule-table td {
  border: 1px solid var(--border-color);
  padding: 0.6rem;
  /* Adjust padding */
  text-align: center;
  font-size: 0.85rem;
  vertical-align: middle;
  /* Center content vertically */
  height: 50px;
  /* Ensure consistent row height */
  min-width: 90px;
  /* Minimum width for columns */
  transition: background-color 0.3s ease;
  /* Smooth background transition */
}

.schedule-table th {
  background-color: var(--light);
  font-weight: 600;
}

/* Style for the first column (Period numbers) */
.schedule-table td:first-child {
  font-weight: 600;
  background-color: var(--light) !important;
  /* Ensure period column stays light grey */
  color: var(--secondary);
  min-width: 60px;
  /* Smaller min-width for period column */
  width: 60px;
  /* Fixed width for period column */
}

.schedule-item {
  font-weight: 500;
  white-space: nowrap;
  /* Prevent wrapping */
  overflow: hidden;
  text-overflow: ellipsis;
  /* Ensure text is readable on colored backgrounds */
  /* Mix-blend-mode can sometimes help, but calculating contrast is better */
  /* mix-blend-mode: difference; */
  /* color: white; */
  /* Example - might need dynamic color based on background */
}

.schedule-item span {
  /* Ensure spans display correctly */
  display: inline-block;
}

.special-year-level-display {
  /* Style for optional year level on special classes */
  font-size: 0.8em;
  color: var(--secondary);
  /* Adjust color if needed for contrast */
  margin-left: 0.3em;
  font-style: italic;
}

.no-class {
  color: var(--secondary);
  /* Lighter color for empty slots */
  font-style: italic;
  font-size: 0.8rem;
}

.btn-sm {
  padding: 0.2rem 0.5rem;
  font-size: 0.75rem;
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

/* Add styling for cell content contrast if background is dark */
.schedule-table td {
  color: #333;
  /* Default text color */
}

/* Consider adding a class for cells with dark backgrounds to set light text */
/* Or use JavaScript to calculate luminance and set text color dynamically */
</style>
