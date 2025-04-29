<template>
  <div class="panel daily-schedule-panel">
    <div class="panel-header">
        <h2 class="panel-title">Daily Schedule View</h2>
        <input type="date" v-model="selectedDate" @change="loadDailySchedule" class="form-control date-picker"/>
    </div>
    <div v-if="isLoading" class="loading">Loading schedule...</div>
    <div v-else-if="error" class="error-message">{{ error }}</div>
    <div v-else class="schedule-content">
        <div v-if="isDayOff" class="day-off-notice">
            <h3>Day Off</h3>
            <p>{{ dayOffReason }}</p>
        </div>
         <div v-else-if="dailySchedule.length > 0">
            <ul>
                <li v-for="(item, index) in dailySchedule" :key="index">
                    {{ item.time }} - {{ item.className || item.notes || 'Scheduled Item' }}
                    <span v-if="item.duration"> ({{ item.duration }} min)</span>
                    <span v-if="item.isException" class="exception-tag"> (Modified)</span>
                </li>
            </ul>
         </div>
         <p v-else class="placeholder-content">No schedule for {{ formattedDate }}.</p>

         <div v-if="!isDayOff" class="exception-controls mt-3">
            <button class="btn btn-secondary btn-sm" @click="openExceptionModal">
                Edit Exceptions for {{ formattedDate }}
            </button>
         </div>
    </div>
  </div>
</template>

<script setup>
// Import nextTick along with other Vue functions
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { useStore } from 'vuex';

const store = useStore();

// --- Helper Functions ---

/**
 * Gets today's date formatted as 'YYYY-MM-DD'.
 * Handles timezone offset to ensure the local date is used.
 * @returns {string} Today's date string in 'YYYY-MM-DD' format.
 */
const getTodayDateString = () => {
  const today = new Date();
  // Get timezone offset in minutes, convert to milliseconds
  const offset = today.getTimezoneOffset() * 60000;
  // Create a new Date object adjusted for the local timezone
  const localDate = new Date(today.getTime() - offset);
  // Convert to ISO string and take the date part
  return localDate.toISOString().split('T')[0];
};

/**
 * Gets the lowercase day name (e.g., 'monday') from a 'YYYY-MM-DD' date string.
 * @param {string} dateString - The date string in 'YYYY-MM-DD' format.
 * @returns {string} The lowercase day name ('sunday', 'monday', ..., 'saturday'). Returns empty string if input is invalid.
 */
const getDayOfWeek = (dateString) => {
    if (!dateString || typeof dateString !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        console.warn(`[getDayOfWeek] Invalid dateString received: ${dateString}`);
        return ''; // Return empty for invalid input
    }
    try {
        // Create date object ensuring it uses local time interpretation by adding T00:00:00
        // This avoids potential issues with UTC conversion crossing midnight boundaries.
        const date = new Date(dateString + 'T00:00:00');
        // Check if the date object is valid after parsing
        if (isNaN(date.getTime())) {
             console.warn(`[getDayOfWeek] Could not parse dateString: ${dateString}`);
             return '';
        }
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        // getDay() returns 0 for Sunday, 1 for Monday, etc.
        return days[date.getDay()];
    } catch (e) {
        console.error(`[getDayOfWeek] Error processing dateString ${dateString}:`, e);
        return '';
    }
}

/**
 * Formats a 'YYYY-MM-DD' date string into a more readable format (e.g., "Monday, April 28, 2025").
 * @param {string} dateString - The date string in 'YYYY-MM-DD' format.
 * @returns {string} The formatted date string, or an empty string if input is invalid.
 */
const formatDate = (dateString) => {
    if (!dateString || typeof dateString !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
         console.warn(`[formatDate] Invalid dateString received: ${dateString}`);
         return 'Invalid Date'; // Return placeholder for invalid input
    }
    try {
        const date = new Date(dateString + 'T00:00:00'); // Ensure local time
        if (isNaN(date.getTime())) {
             console.warn(`[formatDate] Could not parse dateString: ${dateString}`);
             return 'Invalid Date';
        }
        // Use browser's default locale settings for formatting
        return date.toLocaleDateString(undefined, {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
    } catch (e) {
        console.error(`[formatDate] Error processing dateString ${dateString}:`, e);
        return 'Invalid Date';
    }
}

// --- Define Period Times ---
// Assign representative start times for each period
const periodTimes = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00']; // Adjust as needed

// --- State ---
const selectedDate = ref(getTodayDateString()); // Initialize with today's date
const dailySchedule = ref([]); // Holds the final, sorted schedule for display
const isLoading = ref(false); // Local loading state for this panel
const error = ref(null); // Local error state for this panel

// --- Computed Properties ---
const regularSchedule = computed(() => store.getters['schedule/regularSchedule']);
const exceptions = computed(() => store.getters['schedule/dailyExceptions']);
const daysOff = computed(() => store.getters['daysOff/allDaysOff']); // Get the list of day off objects
const classes = computed(() => store.getters['classes/allClasses']);
// Format the selected date for display
const formattedDate = computed(() => formatDate(selectedDate.value));

// Determine if the selected date is marked as a day off
const isDayOff = computed(() => {
    if (!selectedDate.value) return false;
    // Check both the global daysOff list (using the getter) and any daily exceptions marked as day off
    const isGlobalDayOff = store.getters['daysOff/isDayOff'](selectedDate.value); // <-- Use the getter
    const exceptionInfo = exceptions.value.find(e => e.date === selectedDate.value);
    return isGlobalDayOff || (exceptionInfo && exceptionInfo.isDayOff);
});

// Get the reason for the day off, if applicable
const dayOffReason = computed(() => {
    if (!isDayOff.value) return '';
    // Prioritize exception reason if it exists and marks the day off
    const exceptionInfo = exceptions.value.find(e => e.date === selectedDate.value);
    if (exceptionInfo && exceptionInfo.isDayOff) return exceptionInfo.reason || 'Day Off (Exception)';
    // Otherwise, check the global days off list
    const dayOffInfo = daysOff.value.find(d => d.date === selectedDate.value); // Find the object to get the reason
    if (dayOffInfo) return dayOffInfo.reason;
    // Default fallback (should ideally be covered by the checks above)
    return 'Day Off';
});


// --- Methods ---

// Loads and calculates the schedule for the currently selected date
const loadDailySchedule = () => {
  isLoading.value = true;
  error.value = null;
  let finalSchedule = []; // Use a temporary array for processing

  // Ensure selectedDate is valid before proceeding
  if (!selectedDate.value) {
      console.warn("[DailySchedulePanel] No date selected.");
      error.value = "Please select a date.";
      dailySchedule.value = [];
      isLoading.value = false;
      return;
  }

  console.log(`[DailySchedulePanel] Loading schedule for date: ${selectedDate.value}`);

  if (isDayOff.value) {
      console.log(`[DailySchedulePanel] Date ${selectedDate.value} is a day off.`);
      dailySchedule.value = []; // Clear display schedule
      isLoading.value = false;
      return;
  }

  try {
    const dayOfWeek = getDayOfWeek(selectedDate.value);
    // Ensure baseSchedule is an array, default to empty if day not found in regular schedule
    const baseSchedule = regularSchedule.value?.[dayOfWeek] || [];
    const exceptionData = exceptions.value.find(e => e.date === selectedDate.value);

    console.log(`[DailySchedulePanel] Base schedule for ${dayOfWeek}:`, JSON.parse(JSON.stringify(baseSchedule)));
    console.log(`[DailySchedulePanel] Exception data for ${selectedDate.value}:`, exceptionData);

    // Create initial schedule from base, adding time based on period index
    finalSchedule = baseSchedule
        .map((item, index) => {
            // If item exists (has classId), create an object with classId and time
            if (item && item.classId) {
                return {
                    classId: item.classId,
                    // Assign time based on the period index (0-5)
                    time: periodTimes[index] || `P${index + 1}`, // Fallback if periodTimes is too short
                    isException: false
                    // Add duration later if needed/available
                };
            }
            // Return null if the base schedule slot was empty
            return null;
        })
        .filter(item => item !== null); // Filter out the empty slots

    console.log("[DailySchedulePanel] Schedule after processing base:", JSON.parse(JSON.stringify(finalSchedule)));


    // Apply exceptions from exceptionData
    if (exceptionData && exceptionData.changes && Array.isArray(exceptionData.changes)) {
      exceptionData.changes.forEach(change => {
        // Exceptions *must* have a 'time' property to be processed correctly here
        if (!change.time) {
             console.warn("[DailySchedulePanel] Skipping exception change missing 'time':", change);
             return; // Skip this change if it doesn't have a time
        }

        const existingIndex = finalSchedule.findIndex(item => item.time === change.time);

        if (change.action === 'cancel' || change.action === 'delete') {
          if (existingIndex !== -1) {
            finalSchedule.splice(existingIndex, 1); // Remove item
          }
        } else if (change.action === 'add' || change.action === 'create') {
           // Ensure the change object has necessary properties (time is crucial)
           if (change.time) { // Only add if time is present
               // Check if an item already exists at this time before adding
               if (existingIndex === -1) {
                   finalSchedule.push({ ...change, isException: true });
               } else {
                   console.warn(`[DailySchedulePanel] Exception tried to add item at existing time ${change.time}. Consider using 'update'.`);
                   // Optionally replace existing if that's desired behavior for 'add'
                   // finalSchedule[existingIndex] = { ...change, isException: true };
               }
           } else {
               console.warn("[DailySchedulePanel] Exception 'add' change is missing 'time' property:", change);
           }
        } else if (change.action === 'update') {
          // Ensure the change object has necessary properties
          if (change.time) {
              if (existingIndex !== -1) {
                finalSchedule[existingIndex] = { ...finalSchedule[existingIndex], ...change, isException: true }; // Update existing
              } else {
                 // If update target doesn't exist, treat as add
                 console.warn(`[DailySchedulePanel] Exception tried to update non-existent item at time ${change.time}, adding instead.`);
                 finalSchedule.push({ ...change, isException: true });
              }
          } else {
               console.warn("[DailySchedulePanel] Exception 'update' change is missing 'time' property:", change);
          }
        }
      });
       console.log("[DailySchedulePanel] Schedule after applying exceptions:", JSON.parse(JSON.stringify(finalSchedule)));
    }

    // --- Check for items missing 'time' before sorting (shouldn't happen now) ---
    const itemsMissingTime = finalSchedule.filter(item => typeof item.time === 'undefined' || item.time === null);
    if (itemsMissingTime.length > 0) {
        console.error("[DailySchedulePanel] ERROR: Items missing 'time' property before sort:", itemsMissingTime);
         error.value = "Error processing schedule: Found items missing 'time'.";
         dailySchedule.value = []; // Clear display schedule on error
         isLoading.value = false;
         return; // Stop processing
    }
    // --- End Check ---

    // Sort schedule by time (only if no items were missing time)
    finalSchedule.sort((a, b) => {
        // Basic time string comparison works for HH:MM format
        return a.time.localeCompare(b.time);
    });

     // Map class IDs to full class names/details for display
     finalSchedule = finalSchedule.map(item => {
         const cls = item.classId ? classes.value.find(c => String(c.id) === String(item.classId)) : null;
         return {
             ...item,
             // Use formatted class name or fallback to notes/default text
             className: cls ? `Yr ${cls.yearLevel} - Cls ${cls.classNumber}` : (item.classId ? 'Unknown Class' : null)
         };
     });

    // Update the component's reactive ref used for display
    dailySchedule.value = finalSchedule;
    console.log("[DailySchedulePanel] Final sorted schedule for display:", JSON.parse(JSON.stringify(dailySchedule.value)));


  } catch (err) {
    console.error("[DailySchedulePanel] Error processing daily schedule:", err);
    error.value = "Failed to calculate daily schedule.";
    dailySchedule.value = []; // Clear display on error
  } finally {
    isLoading.value = false;
  }
};

// Opens the modal for editing daily exceptions
const openExceptionModal = () => {
    if (!selectedDate.value) return; // Don't open if no date selected
    console.log("Trigger Edit Exception Modal for:", selectedDate.value);
    const existingException = exceptions.value.find(e => e.date === selectedDate.value);
    store.dispatch('ui/openModal', {
        modalName: 'dailyException',
        data: { date: selectedDate.value, exception: existingException } // Pass date and existing data
    });
};

// --- Watchers & Lifecycle ---
onMounted(() => {
  // Fetch necessary data on component mount if not already loaded
  if (!regularSchedule.value || Object.keys(regularSchedule.value).length === 0) { store.dispatch('schedule/fetchRegularSchedule'); }
  if (exceptions.value.length === 0) { store.dispatch('schedule/fetchDailyExceptions'); }
  if (daysOff.value.length === 0) { store.dispatch('daysOff/fetchDaysOff'); } // Fetch days off
  if (classes.value.length === 0) { store.dispatch('classes/fetchClasses'); }
  // Load schedule for the initial date (today)
  // Use nextTick to ensure selectedDate is initialized before first load
  nextTick(() => {
      loadDailySchedule();
  });
});

// Reload schedule when the selected date changes
watch(selectedDate, loadDailySchedule);
// Reload schedule if the underlying data sources change
watch([regularSchedule, exceptions, daysOff, classes], loadDailySchedule, { deep: true });

</script>

<style scoped>
/* Styles for the panel */
.panel-body {
  max-height: 400px; /* Limit panel height and enable scrolling */
  overflow-y: auto;
  padding-top: 0; /* Remove top padding if header is present */
}
/* Styles for the list display */
.schedule-content ul {
    list-style: none;
    padding: 0;
    margin: 0;
}
.schedule-content li {
    padding: 0.6rem 0.2rem; /* Adjust padding */
    border-bottom: 1px solid var(--border-color);
    font-size: 0.9rem; /* Adjust font size */
    display: flex; /* Use flex for better alignment if needed */
    justify-content: space-between;
    align-items: center;
}
.schedule-content li:last-child {
    border-bottom: none;
}
/* Style for the (Modified) tag */
.exception-tag {
    font-size: 0.8em;
    color: var(--warning); /* Use warning color */
    font-weight: bold;
    margin-left: 0.5em;
    background-color: #fff3cd; /* Light yellow background */
    padding: 0.1em 0.4em;
    border-radius: 3px;
}
/* Styles for the Day Off notice */
.day-off-notice {
    padding: 1.5rem;
    background-color: var(--light);
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius);
    text-align: center;
    margin-top: 1rem;
}
.day-off-notice h3 {
    margin-top: 0;
    margin-bottom: 0.5rem;
    color: var(--secondary);
}
/* Styles for the exception edit button area */
.exception-controls {
    text-align: center;
    margin-top: 1.5rem; /* More space above button */
    padding-top: 1rem;
    border-top: 1px solid var(--border-color);
}
/* Styles for loading/error/placeholder messages */
.loading, .error-message, .placeholder-content {
    padding: 1rem;
    text-align: center;
    color: var(--secondary);
    font-size: 0.9rem;
}
.error-message {
    color: var(--danger);
    background-color: #f8d7da;
    border: 1px solid #f5c6cb;
    border-radius: var(--border-radius);
}
/* Styles for the panel header */
.panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap; /* Allow wrapping on smaller screens */
    gap: 1rem;
    margin-bottom: 1rem; /* Add space below header */
}
.panel-title {
    margin: 0; /* Remove default margin */
}
/* Style for the date picker input */
.date-picker {
    padding: 0.3rem 0.5rem;
    max-width: 180px; /* Limit width */
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius);
    font-size: 0.9rem;
}
</style>

