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
  const offset = today.getTimezoneOffset() * 60000;
  const localDate = new Date(today.getTime() - offset);
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
        return '';
    }
    try {
        const date = new Date(dateString + 'T00:00:00');
        if (isNaN(date.getTime())) {
             console.warn(`[getDayOfWeek] Could not parse dateString: ${dateString}`);
             return '';
        }
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
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
         return 'Invalid Date';
    }
    try {
        const date = new Date(dateString + 'T00:00:00');
        if (isNaN(date.getTime())) {
             console.warn(`[formatDate] Could not parse dateString: ${dateString}`);
             return 'Invalid Date';
        }
        return date.toLocaleDateString(undefined, {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
    } catch (e) {
        console.error(`[formatDate] Error processing dateString ${dateString}:`, e);
        return 'Invalid Date';
    }
}

// --- Define Period Times ---
const periodTimes = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00'];

// --- State ---
const selectedDate = ref(getTodayDateString());
const dailySchedule = ref([]);
const isLoading = ref(false);
const error = ref(null);

// --- Computed Properties ---
const regularSchedule = computed(() => store.getters['schedule/regularSchedule']);
const exceptions = computed(() => store.getters['schedule/dailyExceptions']);
const daysOff = computed(() => store.getters['daysOff/allDaysOff']);
const classes = computed(() => store.getters['classes/allClasses']);
const formattedDate = computed(() => formatDate(selectedDate.value));

const isDayOff = computed(() => { /* ... */ });
const dayOffReason = computed(() => { /* ... */ });


// --- Methods ---
const loadDailySchedule = () => {
  isLoading.value = true;
  error.value = null;
  let finalSchedule = [];

  if (!selectedDate.value) { /* ... handle no date ... */ return; }
  console.log(`[DailySchedulePanel] Loading schedule for date: ${selectedDate.value}`);
  if (isDayOff.value) { /* ... handle day off ... */ return; }

  try {
    const dayOfWeek = getDayOfWeek(selectedDate.value);
    const baseSchedule = regularSchedule.value?.[dayOfWeek] || [];
    const exceptionData = exceptions.value.find(e => e.date === selectedDate.value);

    console.log(`[DailySchedulePanel] Base schedule for ${dayOfWeek}:`, JSON.parse(JSON.stringify(baseSchedule)));
    console.log(`[DailySchedulePanel] Exception data for ${selectedDate.value}:`, exceptionData);

    // Create initial schedule from base, adding time based on period index
    finalSchedule = baseSchedule
        .map((item, index) => {
            if (item && item.classId) {
                return {
                    classId: item.classId,
                    time: periodTimes[index] || `P${index + 1}`,
                    isException: false
                };
            }
            return null;
        })
        .filter(item => item !== null);

    console.log("[DailySchedulePanel] Schedule after processing base:", JSON.parse(JSON.stringify(finalSchedule)));

    // Apply exceptions
    if (exceptionData && exceptionData.changes && Array.isArray(exceptionData.changes)) {
      exceptionData.changes.forEach(change => { /* ... exception logic ... */ });
       console.log("[DailySchedulePanel] Schedule after applying exceptions:", JSON.parse(JSON.stringify(finalSchedule)));
    }

    // Check for items missing 'time' before sorting
    const itemsMissingTime = finalSchedule.filter(item => typeof item.time === 'undefined' || item.time === null);
    if (itemsMissingTime.length > 0) {
        console.error("[DailySchedulePanel] ERROR: Items missing 'time' property before sort:", itemsMissingTime);
         error.value = "Error processing schedule: Found items missing 'time'.";
         dailySchedule.value = [];
         isLoading.value = false;
         return;
    }

    // Sort schedule by time
    finalSchedule.sort((a, b) => a.time.localeCompare(b.time));

     // Map class IDs to names for display
     finalSchedule = finalSchedule.map(item => {
         const cls = item.classId ? classes.value.find(c => String(c.id) === String(item.classId)) : null;
         return {
             ...item,
             className: cls ? `Yr ${cls.yearLevel} - Cls ${cls.classNumber}` : (item.classId ? 'Unknown Class' : null)
         };
     });

    // Update the component's reactive ref used for display
    dailySchedule.value = finalSchedule;
    console.log("[DailySchedulePanel] Final sorted schedule for display:", JSON.parse(JSON.stringify(dailySchedule.value)));

  } catch (err) {
    console.error("[DailySchedulePanel] Error processing daily schedule:", err);
    error.value = "Failed to calculate daily schedule.";
    dailySchedule.value = [];
  } finally {
    isLoading.value = false;
  }
};

// Opens the modal for editing daily exceptions
const openExceptionModal = () => { /* ... keep existing ... */ };

// --- Watchers & Lifecycle ---
onMounted(() => {
  // Fetch necessary data on component mount if not already loaded
  if (!regularSchedule.value || Object.keys(regularSchedule.value).length === 0) { store.dispatch('schedule/fetchRegularSchedule'); }
  if (exceptions.value.length === 0) { store.dispatch('schedule/fetchDailyExceptions'); }
  if (daysOff.value.length === 0) { store.dispatch('daysOff/fetchDaysOff'); }
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
/* Styles remain the same */
/* ... */
</style>

