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
        <input v-if="showDatePicker" type="date" v-model="selectedDate" @change="loadDailySchedule" class="form-control date-picker-overlay" @blur="showDatePicker = false" ref="datePickerInput"/>
        <button @click="goToNextDay" class="nav-button day-nav" title="Next Day">&gt;</button>
        <button @click="goToNextMonth" class="nav-button month-nav" title="Next Month">&gt;&gt;</button>
    </div>
    <hr class="header-divider">

    <div v-if="isLoading" class="loading">Loading schedule...</div>
    <div v-else-if="error" class="error-message">{{ error }}</div>
    <div v-else class="schedule-content">
        <div v-if="isDayOff" class="day-off-notice" :style="{ borderLeftColor: dayOffColor }">
            <h3>Day Off</h3>
            <p>{{ dayOffReason }}</p>
        </div>
         <div v-else-if="dailySchedule.length > 0">
            <ul class="daily-schedule-list">
                <li
                   v-for="(item, index) in dailySchedule"
                   :key="index"
                   :style="{ backgroundColor: item.color || 'transparent' }"
                   class="schedule-list-item"
                   :class="{ 'has-dark-background': isDarkColor(item.color) }"
                 >
                    <span class="item-text">
                        {{ item.time }} - {{ item.className || item.notes || 'Scheduled Item' }}
                        <span v-if="item.duration"> ({{ item.duration }} min)</span>
                        <span v-if="item.isException" class="exception-tag"> (Modified)</span>
                    </span>
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
 * Converts a Date object to a 'YYYY-MM-DD' string, handling timezone offset.
 * @param {Date} date - The date object.
 * @returns {string | null} Date string in 'YYYY-MM-DD' format or null if input is invalid.
 */
const toYYYYMMDD = (date) => {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
        console.warn("[toYYYYMMDD] Invalid date object received:", date);
        return null; // Return null for invalid dates
    }
    // Create a new date adjusted for the local timezone offset
    const offset = date.getTimezoneOffset() * 60000;
    const localDate = new Date(date.getTime() - offset);
    const dateString = localDate.toISOString().split('T')[0];
    // console.log(`[toYYYYMMDD] Converted ${date} to ${dateString}`); // Log conversion
    return dateString;
};

/**
 * Gets today's date formatted as 'YYYY-MM-DD'.
 * @returns {string} Today's date string.
 */
const getTodayDateString = () => {
  const todayStr = toYYYYMMDD(new Date());
  console.log(`[getTodayDateString] Today is: ${todayStr}`);
  return todayStr;
};

/**
 * Gets the lowercase day name (e.g., 'monday') from a 'YYYY-MM-DD' date string.
 * @param {string} dateString - The date string in 'YYYY-MM-DD' format.
 * @returns {string} The lowercase day name ('sunday', 'monday', ..., 'saturday'). Returns empty string if input is invalid.
 */
const getDayOfWeek = (dateString) => {
    console.log(`[getDayOfWeek] Input dateString: ${dateString}`); // Log Input
    if (!dateString || typeof dateString !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        console.warn(`[getDayOfWeek] Invalid dateString received: ${dateString}`);
        return ''; // Explicitly return empty string
    }
    try {
        // Create date object ensuring it uses local time interpretation by adding T00:00:00
        const date = new Date(dateString + 'T00:00:00');
        if (isNaN(date.getTime())) {
             console.warn(`[getDayOfWeek] Could not parse dateString: ${dateString}`);
             return ''; // Explicitly return empty string
        }
        const dayIndex = date.getDay(); // 0 for Sunday, 1 for Monday, etc.
        console.log(`[getDayOfWeek] Parsed date: ${date}, Day index: ${dayIndex}`); // Log Parsed Date and Index
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const dayName = days[dayIndex];
        console.log(`[getDayOfWeek] Returning day name: ${dayName}`); // Log Return Value
        return dayName;
    } catch (e) {
        console.error(`[getDayOfWeek] Error processing dateString ${dateString}:`, e);
        return ''; // Explicitly return empty string on error
    }
}

/**
 * Formats a 'YYYY-MM-DD' date string into a locale-aware, readable format (e.g., "Monday, April 28, 2025").
 * @param {string} dateString - The date string in 'YYYY-MM-DD' format.
 * @returns {string} The formatted date string, or 'Invalid Date' if input is invalid.
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
const showDatePicker = ref(false); // State to toggle date picker visibility
const datePickerInput = ref(null); // Ref for the date input element

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
    const isGlobalDayOff = store.getters['daysOff/isDayOff'](selectedDate.value); // Use the getter
    const exceptionInfo = exceptions.value.find(e => e.date === selectedDate.value);
    return isGlobalDayOff || (exceptionInfo && exceptionInfo.isDayOff);
});

// Get color for the day off notice border
const dayOffColor = computed(() => {
    if (!isDayOff.value) return 'transparent'; // Default if not a day off
    const exceptionInfo = exceptions.value.find(e => e.date === selectedDate.value);
    if (exceptionInfo && exceptionInfo.isDayOff) return exceptionInfo.color || '#F0F0F0'; // Use exception color or default
    const dayOffInfo = daysOff.value.find(d => d.date === selectedDate.value);
    return dayOffInfo?.color || '#F0F0F0'; // Use day off color or default
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
    // Default fallback
    return 'Day Off';
});

// --- Computed Property for Relative Date ---
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
    console.log(`[getCurrentDateObject] Current selectedDate.value: ${selectedDate.value}`);
    if (!selectedDate.value) { console.warn("getCurrentDateObject: selectedDate is null/empty"); return null; }
    try {
        const date = new Date(selectedDate.value + 'T12:00:00'); // Add time component
        if (isNaN(date.getTime())) { console.warn("getCurrentDateObject: Parsed date is invalid"); return null; }
        console.log(`[getCurrentDateObject] Parsed date object:`, date);
        return date;
    } catch (e) { console.error("getCurrentDateObject: Error parsing date", e); return null; }
};

/**
 * Navigates the selectedDate by a specified number of days.
 * @param {number} daysToAdd - The number of days to add (can be negative).
 */
const changeDay = (daysToAdd) => {
    console.log(`[changeDay] Called with daysToAdd: ${daysToAdd}`);
    const currentDate = getCurrentDateObject();
    if (!currentDate) { console.error("changeDay: Could not get current date object."); return; }
    currentDate.setDate(currentDate.getDate() + daysToAdd);
    const newDateString = toYYYYMMDD(currentDate);
    console.log(`[changeDay] New calculated date string: ${newDateString}`);
    selectedDate.value = newDateString; // Update the ref, triggering watcher
};

/**
 * Navigates the selectedDate by a specified number of months.
 * @param {number} monthsToAdd - The number of months to add (can be negative).
 */
const changeMonth = (monthsToAdd) => {
    console.log(`[changeMonth] Called with monthsToAdd: ${monthsToAdd}`);
    const currentDate = getCurrentDateObject();
    if (!currentDate) { console.error("changeMonth: Could not get current date object."); return; }
    currentDate.setDate(1); // Go to 1st to avoid day overflow issues
    currentDate.setMonth(currentDate.getMonth() + monthsToAdd);
    const newDateString = toYYYYMMDD(currentDate);
    console.log(`[changeMonth] New calculated date string: ${newDateString}`);
    selectedDate.value = newDateString; // Update the ref
};

// Navigation button handlers
const goToPreviousDay = () => { console.log("goToPreviousDay clicked"); changeDay(-1); };
const goToNextDay = () => { console.log("goToNextDay clicked"); changeDay(1); };
const goToPreviousMonth = () => { console.log("goToPreviousMonth clicked"); changeMonth(-1); };
const goToNextMonth = () => { console.log("goToNextMonth clicked"); changeMonth(1); };

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

  // Ensure selectedDate is valid before proceeding
  if (!selectedDate.value) {
      console.warn("[DailySchedulePanel] No date selected in loadDailySchedule.");
      error.value = "Please select a date.";
      dailySchedule.value = [];
      isLoading.value = false;
      return;
  }
  console.log(`[DailySchedulePanel] loadDailySchedule STARTING for date: ${selectedDate.value}`);

  if (isDayOff.value) {
      console.log(`[DailySchedulePanel] Date ${selectedDate.value} is a day off.`);
      dailySchedule.value = []; // Clear display schedule
      isLoading.value = false;
      return;
  }

  try {
    const dayOfWeek = getDayOfWeek(selectedDate.value);
    // Check for valid dayOfWeek returned from helper
    if (!dayOfWeek || dayOfWeek === 'sunday' || dayOfWeek === 'saturday') {
        console.log(`[DailySchedulePanel] Skipping schedule load for invalid/weekend day: '${dayOfWeek}' (Date: ${selectedDate.value})`);
        dailySchedule.value = []; // Clear schedule for weekends/invalid days
        isLoading.value = false;
        return;
    }

    const baseSchedule = regularSchedule.value?.[dayOfWeek] || [];
    const exceptionData = exceptions.value.find(e => e.date === selectedDate.value);

    console.log(`[DailySchedulePanel] Base schedule for ${dayOfWeek}:`, JSON.parse(JSON.stringify(baseSchedule)));
    console.log(`[DailySchedulePanel] Exception data for ${selectedDate.value}:`, exceptionData);

    // Create initial schedule from base, adding time
    finalSchedule = baseSchedule
        .map((item, index) => {
            if (item && item.classId) { return { classId: item.classId, time: periodTimes[index] || `P${index + 1}`, isException: false }; }
            return null;
        })
        .filter(item => item !== null);
    console.log("[DailySchedulePanel] Schedule after processing base:", JSON.parse(JSON.stringify(finalSchedule)));

    // Apply exceptions
    if (exceptionData && exceptionData.changes && Array.isArray(exceptionData.changes)) {
      exceptionData.changes.forEach(change => {
         if (!change.time) { console.warn("[DailySchedulePanel] Skipping exception change missing 'time':", change); return; }
         const existingIndex = finalSchedule.findIndex(item => item.time === change.time);
         if (change.action === 'cancel' || change.action === 'delete') { if (existingIndex !== -1) { finalSchedule.splice(existingIndex, 1); } }
         else if (change.action === 'add' || change.action === 'create') { if (existingIndex === -1) { finalSchedule.push({ ...change, isException: true }); } else { console.warn(`Exception add at existing time ${change.time}.`); finalSchedule[existingIndex] = { ...change, isException: true }; } }
         else if (change.action === 'update') { if (change.time) { if (existingIndex !== -1) { finalSchedule[existingIndex] = { ...finalSchedule[existingIndex], ...change, isException: true }; } else { console.warn(`Update non-existent item at ${change.time}, adding.`); finalSchedule.push({ ...change, isException: true }); } } else { console.warn("Update change missing 'time'"); } }
      });
       console.log("[DailySchedulePanel] Schedule after applying exceptions:", JSON.parse(JSON.stringify(finalSchedule)));
    }

    // Check for items missing 'time' before sorting
    const itemsMissingTime = finalSchedule.filter(item => typeof item.time === 'undefined' || item.time === null);
    if (itemsMissingTime.length > 0) { console.error("[DailySchedulePanel] ERROR: Items missing 'time' property before sort:", itemsMissingTime); error.value = "Error processing schedule: Found items missing 'time'."; dailySchedule.value = []; isLoading.value = false; return; }

    // Sort schedule by time
    finalSchedule.sort((a, b) => a.time.localeCompare(b.time));

     // --- Map class IDs to formatted names AND COLOR, and filter out deleted ---
     finalSchedule = finalSchedule.map(item => {
         const cls = item.classId ? classes.value.find(c => String(c.id) === String(item.classId)) : null;
         if (item.classId && !cls) { console.log(`[DailySchedulePanel] Class ID ${item.classId} not found (deleted). Filtering out.`); return null; } // Mark deleted for filtering

         let displayClassName = null;
         let itemColor = null; // Variable to hold color

         if (cls) { // If class details were found
             itemColor = cls.color || '#FFFFFF'; // Get class color or default white
             if (cls.classType === 'numbered') {
                 const yearNum = parseInt(cls.yearLevel, 10);
                 const displayYear = yearNum <= 3 ? yearNum : yearNum - 3;
                 const schoolSuffix = yearNum <= 3 ? 'J' : 'H';
                 displayClassName = `${displayYear}${schoolSuffix}-${cls.classNumber}`;
             } else if (cls.classType === 'special') {
                 displayClassName = cls.className;
                 if (cls.yearLevel) { displayClassName += ` (Yr ${cls.yearLevel})`; }
             } else { displayClassName = 'Unknown Class Type'; }
         } else if (item.isException && item.notes) {
             displayClassName = item.notes;
             itemColor = item.color || '#EEEEEE'; // Optional: Color for note-only exceptions
         }

         // Return the item with className and color, or null if it was marked for removal
         return item ? { ...item, className: displayClassName, color: itemColor } : null;

     }).filter(item => item !== null); // Filter out null items (deleted classes)
     // --- End Mapping and Filtering ---

    // Update the component's reactive ref used for display
    dailySchedule.value = finalSchedule;
    console.log("[DailySchedulePanel] Final sorted schedule for display (with color):", JSON.parse(JSON.stringify(dailySchedule.value)));

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
    store.dispatch('ui/openModal', {
        modalName: 'dailyException',
        data: { date: selectedDate.value, exception: existingException }
    });
};

// Helper to determine if a color is dark (needs light text)
// Basic luminance calculation - adjust threshold as needed
const isDarkColor = (hexColor) => {
    if (!hexColor || hexColor.length < 7) return false; // Default to light text if no color
    try {
        const r = parseInt(hexColor.substring(1, 3), 16);
        const g = parseInt(hexColor.substring(3, 5), 16);
        const b = parseInt(hexColor.substring(5, 7), 16);
        // Calculate luminance (standard formula)
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        return luminance < 0.5; // Threshold for considering it dark
    } catch (e) {
        return false; // Error parsing color, default to light text
    }
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

// Reload schedule when the selected date changes (via picker or buttons)
watch(selectedDate, (newDate, oldDate) => {
    console.log(`[Watcher selectedDate] Date changed from ${oldDate} to ${newDate}`);
    loadDailySchedule(); // Ensure load is called on date change
});
// Reload schedule if the underlying data sources change
watch([regularSchedule, exceptions, daysOff, classes], (newData, oldData) => {
    console.log("[Watcher schedule/exceptions/daysOff/classes] Data changed, reloading daily schedule.");
    loadDailySchedule(); // Reload if underlying data changes
}, { deep: true });

</script>

<style scoped>
/* Styles for the panel */
.panel-body { max-height: 400px; overflow-y: auto; padding-top: 0; }
/* Styles for the list display */
.daily-schedule-list { list-style: none; padding: 0; margin: 0; }
.schedule-list-item {
    padding: 0.6rem 0.8rem; /* Add padding */
    border-bottom: 1px solid var(--border-color);
    font-size: 0.9rem;
    display: flex; /* Use flex for alignment */
    align-items: center;
    gap: 0.5em; /* Gap between potential elements */
    transition: background-color 0.3s ease;
    color: #333; /* Default text color (for light backgrounds) */
    border-radius: 4px; /* Optional: slightly rounded corners */
    margin-bottom: 2px; /* Optional: space between items */
}
.schedule-list-item:last-child { border-bottom: none; }
/* Style for text when background is dark */
.schedule-list-item.has-dark-background {
    color: #f8f9fa; /* Light text color */
}
.schedule-list-item.has-dark-background .exception-tag {
    color: #333; /* Ensure tag text is readable */
    background-color: rgba(255, 255, 255, 0.8); /* Lighter tag background */
}

.exception-tag { font-size: 0.8em; color: var(--warning); font-weight: bold; margin-left: 0.5em; background-color: #fff3cd; padding: 0.1em 0.4em; border-radius: 3px; }
/* Styles for the Day Off notice */
.day-off-notice {
    border-left: 5px solid var(--border-color); /* Default border */
    transition: border-left-color 0.3s ease;
    padding: 1.5rem;
    background-color: var(--light);
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius);
    text-align: center;
    margin-top: 1rem;
}
.day-off-notice h3 { margin-top: 0; margin-bottom: 0.5rem; color: var(--secondary); }
/* Styles for the exception edit button area */
.exception-controls { text-align: center; margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid var(--border-color); }
/* Styles for loading/error/placeholder messages */
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

/* Styles for color square and list item alignment */
.color-square {
    display: inline-block;
    width: 1em;
    height: 1em;
    border: 1px solid #ccc;
    margin-right: 0.5em;
    vertical-align: middle; /* Align with text */
    flex-shrink: 0; /* Prevent shrinking */
}
.item-color-indicator {
    margin-right: 0.6em; /* Adjust spacing */
}
.item-text {
    flex-grow: 1; /* Allow text to take remaining space */
    white-space: nowrap; /* Prevent wrapping */
    overflow: hidden;
    text-overflow: ellipsis;
}
</style>

