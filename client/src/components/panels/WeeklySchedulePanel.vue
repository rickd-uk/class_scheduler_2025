<template>
  <div class="panel weekly-schedule-panel">
    <div class="panel-header">
      <h2 class="panel-title"></h2>
      <button @click="openWeeklyEditor" class="btn btn-primary btn-sm">
        Edit
      </button>
      <!-- Clear everything -->
      <button @click="clearAll" class="btn btn-danger btn-sm ml-2">
        Clear All
      </button>
    </div>

    <div v-if="isLoadingSchedule || isLoadingClasses" class="loading">Loading schedule data...</div>
    <div v-else-if="scheduleError || classesError" class="error-message">
      {{ scheduleError || classesError || 'Error loading data.' }}
    </div>

    <div v-else-if="hasScheduleData && !isLoadingClasses" class="schedule-table-container">
      <table class="schedule-table">
        <thead>
          <tr>
            <th>Period</th>
            <th v-for="day in daysOfWeek" :key="day" class="day-header">{{ capitalize(day) }}
              <!-- Clear button for each day -->
              <button @click="clearDay(day)" class="btn btn-outline-danger btn-sm clear-btn"
                title="Clear {{ capitalize(day)}}">&times;</button>
            </th>
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
    <p v-else class="placeholder-content">No regular weekly schedule defined yet, or class data is loading. Click 'Edit
      Schedule' to create one.</p>
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
const scheduleData = computed(() => store.getters['schedule/regularSchedule']);
const classes = computed(() => store.getters['classes/allClasses']);
const isLoadingSchedule = computed(() => store.getters['schedule/isLoading']);
const isLoadingClasses = computed(() => store.getters['classes/isLoading']); // Used in template
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
    // Pass a deep copy of the schedule data to the modal
    data: JSON.parse(JSON.stringify(scheduleData.value))
  });
};

// Helper to capitalize day names for table headers
const capitalize = (s) => {
  if (typeof s !== 'string' || s.length === 0) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Helper function to find the full class details for a given day and period
const getClassForPeriod = (day, period) => {
  const periodIndex = period - 1;
  // Ensure day exists in scheduleData before trying to access its index
  const scheduleItem = scheduleData.value?.[day]?.[periodIndex];
  // If there's no item or it's null or has no classId, return null
  if (!scheduleItem || !scheduleItem.classId) {
    return null; // No class assigned in schedule
  }

  // Find the corresponding class details from the classes array
  const classIdToFind = scheduleItem.classId;
  // Ensure classes array is loaded before trying to find
  if (!classes.value || classes.value.length === 0) {
    console.warn(`[WeeklySchedulePanel] getClassForPeriod: Classes not loaded yet for classId ${classIdToFind}`);
    return null; // Or a placeholder indicating classes are loading
  }
  const foundClass = classes.value.find(cls => String(cls.id) === String(classIdToFind));

  // Return the found class object OR null if the classId from schedule doesn't exist anymore (deleted class)
  return foundClass || null;
};

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
  // Calculate display year (1-3 for both JH and HS)
  const displayYear = yearNum <= 3 ? yearNum : yearNum - 3;
  // Determine suffix (J for Junior High, H for High School)
  const schoolSuffix = yearNum <= 3 ? 'J' : 'H';
  // Return formatted string
  return `${displayYear}${schoolSuffix}-${cls.classNumber}`;
};
const periodsCount = periods.length;

const clearDay = async (day) => {
  // clone the current reg. schedule 
  const newSched = JSON.parse(JSON.stringify(scheduleData.value));
  // replace the day's array with all-null 
  newSched[day] = Array(periodsCount).fill(null);

  try {
    await store.dispatch('schedule/updateRegularSchedule', newSched);
  } catch (e) {
    console.error(`Failed to clear ${day}`, e);
  }
}

const clearAll = async () => {
  // build a blank week 
  const blank = {};
  daysOfWeek.forEach(d => {
    blank[d] = Array(periodsCount).fill(null);
  });

  try {
    await store.dispatch('schedule/updateRegularSchedule', blank);
  } catch (e) {
    console.error(`Failed to clear all days`, e);
  }
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
  /* color: #333; */
  /* Default text color, consider dynamic for contrast */
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

.day-header {
  position: relative;
  padding-top: 1.2rem;
}

.clear-btn {
  position: absolute;
  top: 0.2rem;
  right: 0.2rem;
  line-height: 1;
  padding: 0.1rem 0.3rem;
  font-size: 0.75rem;
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

.btn-outline-danger {
  color: var(--danger);
  border-color: var(--danger);
}

.btn-outline-danger:hover,
.btn-outline-danger:focus {
  background-color: var(--danger);
  color: #fff;
}



/* Add styling for cell content contrast if background is dark */
.schedule-table td {
  color: #333;
  /* Default text color */
}

/* You might need a more robust solution for text contrast on colored backgrounds */
</style>
