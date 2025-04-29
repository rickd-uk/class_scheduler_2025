<template>
  <div class="panel daily-schedule-panel">
    <div class="panel-header date-navigation">
        <button @click="goToPreviousMonth" class="nav-button month-nav" title="Previous Month">&lt;&lt;</button>
        <button @click="goToPreviousDay" class="nav-button day-nav" title="Previous Day">&lt;</button>

        <div class="date-display-container">
            <h2 class="panel-title date-title" @click="showDatePicker = !showDatePicker" title="Click to select date">
                {{ formattedDate }}
            </h2>
            <span v-if="relativeDateString" class="relative-date-indicator">
                ({{ relativeDateString }})
            </span>
        </div>
        <input
            v-if="showDatePicker"
            type="date"
            v-model="selectedDate"
            @change="loadDailySchedule"
            class="form-control date-picker-overlay"
            @blur="showDatePicker = false"
            ref="datePickerInput"
        />

        <button @click="goToNextDay" class="nav-button day-nav" title="Next Day">&gt;</button>
        <button @click="goToNextMonth" class="nav-button month-nav" title="Next Month">&gt;&gt;</button>
    </div>
    <hr class="header-divider">

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
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { useStore } from 'vuex';

const store = useStore();

// --- Helper Functions ---
/**
 * Converts a Date object to a 'YYYY-MM-DD' string, handling timezone offset.
 * @param {Date} date - The date object.
 * @returns {string} Date string in 'YYYY-MM-DD' format.
 */
const toYYYYMMDD = (date) => {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
        console.warn("[toYYYYMMDD] Invalid date object received:", date);
        return null; // Return null for invalid dates
    }
    // Create a new date adjusted for the local timezone offset
    const offset = date.getTimezoneOffset() * 60000;
    const localDate = new Date(date.getTime() - offset);
    return localDate.toISOString().split('T')[0];
};

/**
 * Gets today's date formatted as 'YYYY-MM-DD'.
 * @returns {string} Today's date string.
 */
const getTodayDateString = () => {
  return toYYYYMMDD(new Date()); // Use the helper
};

/**
 * Gets the lowercase day name (e.g., 'monday') from a 'YYYY-MM-DD' date string.
 * @param {string} dateString - The date string.
 * @returns {string} The lowercase day name or empty string.
 */
const getDayOfWeek = (dateString) => {
    if (!dateString || typeof dateString !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return '';
    try {
        const date = new Date(dateString + 'T00:00:00'); // Ensure local time interpretation
        if (isNaN(date.getTime())) return '';
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        return days[date.getDay()];
    } catch (e) { return ''; }
}

/**
 * Formats a 'YYYY-MM-DD' date string into a locale-aware, readable format.
 * @param {string} dateString - The date string.
 * @returns {string} Formatted date (e.g., "Tuesday, April 29, 2025") or 'Invalid Date'.
 */
const formatDate = (dateString) => {
    if (!dateString || typeof dateString !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return 'Invalid Date';
    try {
        const date = new Date(dateString + 'T00:00:00'); // Ensure local time
        if (isNaN(date.getTime())) return 'Invalid Date';
        // Use options for specific format
        return date.toLocaleDateString(undefined, { // Use browser's locale
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
    } catch (e) { return 'Invalid Date'; }
}

// --- Define Period Times ---
const periodTimes = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00'];

// --- State ---
const selectedDate = ref(getTodayDateString()); // Initialize with today
const dailySchedule = ref([]);
const isLoading = ref(false);
const error = ref(null);
const showDatePicker = ref(false);
const datePickerInput = ref(null);

// --- Computed Properties ---
const regularSchedule = computed(() => store.getters['schedule/regularSchedule']);
const exceptions = computed(() => store.getters['schedule/dailyExceptions']);
const daysOff = computed(() => store.getters['daysOff/allDaysOff']);
const classes = computed(() => store.getters['classes/allClasses']);
const formattedDate = computed(() => formatDate(selectedDate.value));
const isDayOff = computed(() => {
    if (!selectedDate.value) return false;
    const isGlobalDayOff = store.getters['daysOff/isDayOff'](selectedDate.value);
    const exceptionInfo = exceptions.value.find(e => e.date === selectedDate.value);
    return isGlobalDayOff || (exceptionInfo && exceptionInfo.isDayOff);
});
const dayOffReason = computed(() => {
    if (!isDayOff.value) return '';
    const exceptionInfo = exceptions.value.find(e => e.date === selectedDate.value);
    if (exceptionInfo && exceptionInfo.isDayOff) return exceptionInfo.reason || 'Day Off (Exception)';
    const dayOffInfo = daysOff.value.find(d => d.date === selectedDate.value);
    if (dayOffInfo) return dayOffInfo.reason;
    return 'Day Off';
});

// --- Computed Property for Relative Date (Restored) ---
const relativeDateString = computed(() => {
    if (!selectedDate.value) return '';
    const todayStr = getTodayDateString();
    if (!todayStr) return ''; // Handle error from helper

    if (selectedDate.value === todayStr) {
        return 'Today';
    }

    // Calculate yesterday
    const yesterdayDate = new Date(); // Today's date object
    yesterdayDate.setDate(yesterdayDate.getDate() - 1); // Set to yesterday
    const yesterdayStr = toYYYYMMDD(yesterdayDate); // Format as string
    if (yesterdayStr && selectedDate.value === yesterdayStr) {
        return 'Yesterday';
    }

    // Calculate tomorrow
    const tomorrowDate = new Date(); // Today's date object
    tomorrowDate.setDate(tomorrowDate.getDate() + 1); // Set to tomorrow
    const tomorrowStr = toYYYYMMDD(tomorrowDate); // Format as string
     if (tomorrowStr && selectedDate.value === tomorrowStr) {
        return 'Tomorrow';
    }

    // Calculate 2 days ago
    const twoDaysAgoDate = new Date();
    twoDaysAgoDate.setDate(twoDaysAgoDate.getDate() - 2);
    const twoDaysAgoStr = toYYYYMMDD(twoDaysAgoDate);
    if (twoDaysAgoStr && selectedDate.value === twoDaysAgoStr) {
        return '2 Days Ago';
    }
    // Add more conditions here for "X Days Ago/From Now" if desired

    // Otherwise, return empty string (no indicator needed)
    return '';
});


// --- Methods ---
/**
 * Parses the current selectedDate string into a Date object.
 * Handles potential invalid date strings.
 * @returns {Date | null} A Date object or null if parsing fails.
 */
const getCurrentDateObject = () => {
    if (!selectedDate.value) return null;
    try {
        const date = new Date(selectedDate.value + 'T12:00:00'); // Add time component
        if (isNaN(date.getTime())) return null;
        return date;
    } catch (e) { return null; }
};

/**
 * Navigates the selectedDate by a specified number of days.
 * @param {number} daysToAdd - The number of days to add (can be negative).
 */
const changeDay = (daysToAdd) => {
    const currentDate = getCurrentDateObject();
    if (!currentDate) return;
    currentDate.setDate(currentDate.getDate() + daysToAdd);
    selectedDate.value = toYYYYMMDD(currentDate);
};

/**
 * Navigates the selectedDate by a specified number of months.
 * @param {number} monthsToAdd - The number of months to add (can be negative).
 */
const changeMonth = (monthsToAdd) => {
    const currentDate = getCurrentDateObject();
    if (!currentDate) return;
    currentDate.setDate(1); // Go to 1st to avoid day overflow issues
    currentDate.setMonth(currentDate.getMonth() + monthsToAdd);
    selectedDate.value = toYYYYMMDD(currentDate);
};

// Navigation button handlers
const goToPreviousDay = () => changeDay(-1);
const goToNextDay = () => changeDay(1);
const goToPreviousMonth = () => changeMonth(-1);
const goToNextMonth = () => changeMonth(1);

// Watcher to focus the date picker when it becomes visible
watch(showDatePicker, async (newValue) => {
    if (newValue) {
        await nextTick();
        datePickerInput.value?.focus();
        datePickerInput.value?.showPicker();
    }
});

// Loads and calculates the schedule for the currently selected date
const loadDailySchedule = () => {
  showDatePicker.value = false; // Hide picker on change
  isLoading.value = true;
  error.value = null;
  let finalSchedule = [];

  if (!selectedDate.value) { /* ... handle no date ... */ return; }
  console.log(`[DailySchedulePanel] Loading schedule for date: ${selectedDate.value}`);
  if (isDayOff.value) { /* ... handle day off ... */ isLoading.value = false; dailySchedule.value = []; return; }

  try {
    const dayOfWeek = getDayOfWeek(selectedDate.value);
    const baseSchedule = regularSchedule.value?.[dayOfWeek] || [];
    const exceptionData = exceptions.value.find(e => e.date === selectedDate.value);

    console.log(`[DailySchedulePanel] Base schedule for ${dayOfWeek}:`, JSON.parse(JSON.stringify(baseSchedule)));
    console.log(`[DailySchedulePanel] Exception data for ${selectedDate.value}:`, exceptionData);

    // Create initial schedule from base, adding time based on period index
    finalSchedule = baseSchedule
        .map((item, index) => {
            if (item && item.classId) { return { classId: item.classId, time: periodTimes[index] || `P${index + 1}`, isException: false }; }
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
    if (itemsMissingTime.length > 0) { console.error("[DailySchedulePanel] ERROR: Items missing 'time' property before sort:", itemsMissingTime); error.value = "Error processing schedule: Found items missing 'time'."; dailySchedule.value = []; isLoading.value = false; return; }

    // Sort schedule by time
    finalSchedule.sort((a, b) => a.time.localeCompare(b.time));

     // Map class IDs to names for display
     finalSchedule = finalSchedule.map(item => {
         const cls = item.classId ? classes.value.find(c => String(c.id) === String(item.classId)) : null;
         return { ...item, className: cls ? `Yr ${cls.yearLevel} - Cls ${cls.classNumber}` : (item.classId ? 'Unknown Class' : null) };
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
const openExceptionModal = () => {
    if (!selectedDate.value) return;
    console.log("Trigger Edit Exception Modal for:", selectedDate.value);
    const existingException = exceptions.value.find(e => e.date === selectedDate.value);
    store.dispatch('ui/openModal', { modalName: 'dailyException', data: { date: selectedDate.value, exception: existingException } });
};

// --- Watchers & Lifecycle ---
onMounted(() => {
  if (!regularSchedule.value || Object.keys(regularSchedule.value).length === 0) { store.dispatch('schedule/fetchRegularSchedule'); }
  if (exceptions.value.length === 0) { store.dispatch('schedule/fetchDailyExceptions'); }
  if (daysOff.value.length === 0) { store.dispatch('daysOff/fetchDaysOff'); }
  if (classes.value.length === 0) { store.dispatch('classes/fetchClasses'); }
  nextTick(() => { loadDailySchedule(); });
});

watch(selectedDate, loadDailySchedule);
watch([regularSchedule, exceptions, daysOff, classes], loadDailySchedule, { deep: true });

</script>

<style scoped>
/* Styles for the panel */
.panel-body { max-height: 400px; overflow-y: auto; padding-top: 0; }
.schedule-content ul { list-style: none; padding: 0; margin: 0; }
.schedule-content li { padding: 0.6rem 0.2rem; border-bottom: 1px solid var(--border-color); font-size: 0.9rem; display: flex; justify-content: space-between; align-items: center; }
.schedule-content li:last-child { border-bottom: none; }
.exception-tag { font-size: 0.8em; color: var(--warning); font-weight: bold; margin-left: 0.5em; background-color: #fff3cd; padding: 0.1em 0.4em; border-radius: 3px; }
.day-off-notice { padding: 1.5rem; background-color: var(--light); border: 1px solid var(--border-color); border-radius: var(--border-radius); text-align: center; margin-top: 1rem; }
.day-off-notice h3 { margin-top: 0; margin-bottom: 0.5rem; color: var(--secondary); }
.exception-controls { text-align: center; margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid var(--border-color); }
.loading, .error-message, .placeholder-content { padding: 1rem; text-align: center; color: var(--secondary); font-size: 0.9rem; }
.error-message { color: var(--danger); background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: var(--border-radius); }

/* Updated Header Styles */
.panel-header.date-navigation { display: flex; justify-content: space-between; align-items: center; flex-wrap: nowrap; gap: 0.5rem; margin-bottom: 0.5rem; position: relative; }
/* Container for Title and Relative Indicator */
.date-display-container { display: flex; flex-direction: column; align-items: center; flex-grow: 1; }
.date-title { margin: 0; font-weight: 600; font-size: 1.1rem; text-align: center; cursor: pointer; padding: 0.2rem 0.5rem; border-radius: var(--border-radius); transition: background-color 0.2s; }
.date-title:hover { background-color: #eee; }
/* Style for the relative date indicator */
.relative-date-indicator { font-size: 0.8rem; color: var(--secondary); font-weight: normal; margin-top: -2px; /* Adjust spacing */ }
.nav-button { background: none; border: 1px solid transparent; padding: 0.1rem 0.5rem; font-size: 1.2rem; font-weight: bold; line-height: 1; cursor: pointer; color: var(--primary); border-radius: 4px; transition: background-color 0.2s; }
.nav-button:hover { background-color: #e0e0e0; }
.nav-button.month-nav { font-size: 1rem; }
.date-picker-overlay { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 10; padding: 0.3rem 0.5rem; border: 1px solid var(--border-color); border-radius: var(--border-radius); font-size: 0.9rem; max-width: 180px; box-shadow: 0 2px 5px rgba(0,0,0,0.2); }
.date-picker { display: none; }
.header-divider { border: none; border-top: 1px solid var(--border-color); margin-top: 0.5rem; margin-bottom: 1rem; }
</style>

