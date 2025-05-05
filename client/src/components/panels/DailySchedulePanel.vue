<template>
  <div class="panel daily-schedule-panel">
    <div class="panel-header date-navigation">
      <button @click="goToPreviousMonth" class="nav-button month-nav" title="Previous Month">&lt;&lt;</button>
      <button @click="goToPreviousDay" class="nav-button day-nav" title="Previous Day">&lt;</button>
      <div class="date-display-container">
        <h2 class="panel-title date-title" @click="showDatePicker = !showDatePicker" title="Click to select date">
          {{ formattedDate || 'Select Date' }}
        </h2>
        <span v-if="relativeDateString" class="relative-date-indicator">
          ({{ relativeDateString }})
        </span>
      </div>
      <input v-if="showDatePicker" type="date" v-model="selectedDate" @change="loadDailySchedule"
        class="form-control date-picker-overlay" @blur="showDatePicker = false" ref="datePickerInput" />
      <button @click="goToNextDay" class="nav-button day-nav" title="Next Day">&gt;</button>
      <button @click="goToNextMonth" class="nav-button month-nav" title="Next Month">&gt;&gt;</button>
    </div>
    <hr class="header-divider">

    <div v-if="isLoading" class="loading">Loading schedule...</div>
    <div v-else-if="error" class="error-message">{{ error }}</div>
    <div v-else class="schedule-content">
      <div v-if="isDayOff" class="day-off-notice" :style="{ borderLeftColor: dayOffColor || '#F0F0F0' }"
        :class="{ 'has-dark-background': isDarkColor(dayOffColor) }">
        <h3>Day Off</h3>
        <p>{{ dayOffReason }}</p>
      </div>
      <div v-else-if="dailySchedule.length > 0">
        <ul class="daily-schedule-list">
          <li v-for="(item, index) in dailySchedule" :key="index"
            :style="{ backgroundColor: item.color || 'transparent' }" class="schedule-list-item"
            :class="{ 'has-dark-background': isDarkColor(item.color) }">
            <span class="item-text">
              {{ item.time }} - {{ item.className || item.notes || 'Scheduled Item' }}
              <span v-if="item.duration"> ({{ item.duration }} min)</span>
              <span v-if="item.isException" class="exception-tag"> (Modified)</span>
            </span>
          </li>
        </ul>
      </div>
      <p v-else class="placeholder-content">No schedule for {{ formattedDate || 'selected date' }}.</p>
      <div v-if="!isDayOff" class="exception-controls mt-3">
        <button class="btn btn-secondary btn-sm" @click="openExceptionModal">
          Edit Exceptions for {{ formattedDate || 'selected date' }}
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
 * @returns {string | null} Date string in 'YYYY-MM-DD' format or null if input is invalid.
 */
const toYYYYMMDD = (date) => {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    console.warn("[toYYYYMMDD] Invalid date object received:", date);
    return null; // Return null for invalid dates
  }
  try {
    // Create a new date adjusted for the local timezone offset
    const offset = date.getTimezoneOffset() * 60000;
    const localDate = new Date(date.getTime() - offset);
    return localDate.toISOString().split('T')[0];
  } catch (e) {
    console.error("[toYYYYMMDD] Error converting date:", e);
    return null;
  }
};

/**
 * Gets today's date formatted as 'YYYY-MM-DD'.
 * @returns {string} Today's date string.
 */
const getTodayDateString = () => {
  const todayStr = toYYYYMMDD(new Date());
  console.log(`[getTodayDateString] Today is: ${todayStr}`);
  return todayStr || ''; // Return empty string if conversion fails
};

/**
 * Gets the lowercase day name (e.g., 'monday') from a 'YYYY-MM-DD' date string.
 * @param {string} dateString - The date string in 'YYYY-MM-DD' format.
 * @returns {string} The lowercase day name ('sunday', 'monday', ..., 'saturday'). Returns empty string if input is invalid.
 */
const getDayOfWeek = (dateString) => {
  // console.log(`[getDayOfWeek] Input dateString: ${dateString}`); // Log Input
  if (!dateString || typeof dateString !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    // console.warn(`[getDayOfWeek] Invalid dateString received: ${dateString}`);
    return '';
  }
  try {
    const date = new Date(dateString + 'T00:00:00'); // Ensure local time interpretation
    if (isNaN(date.getTime())) {
      // console.warn(`[getDayOfWeek] Could not parse dateString: ${dateString}`);
      return '';
    }
    const dayIndex = date.getDay();
    // console.log(`[getDayOfWeek] Parsed date: ${date}, Day index: ${dayIndex}`);
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = days[dayIndex];
    // console.log(`[getDayOfWeek] Returning day name: ${dayName}`);
    return dayName;
  } catch (e) {
    console.error(`[getDayOfWeek] Error processing dateString ${dateString}:`, e);
    return '';
  }
}

/**
 * Formats a 'YYYY-MM-DD' date string into a locale-aware, readable format (e.g., "Monday, April 28, 2025").
 * @param {string} dateString - The date string in 'YYYY-MM-DD' format.
 * @returns {string} The formatted date string, or 'Invalid Date' if input is invalid.
 */
const formatDate = (dateString) => {
  if (!dateString || typeof dateString !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    // console.warn(`[formatDate] Invalid dateString received: ${dateString}`);
    return 'Invalid Date';
  }
  try {
    const date = new Date(dateString + 'T00:00:00'); // Ensure local time
    if (isNaN(date.getTime())) {
      // console.warn(`[formatDate] Could not parse dateString: ${dateString}`);
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
const periodTimes = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00']; // Example times

// --- State ---
const selectedDate = ref(getTodayDateString()); // Initialize with today's date
const dailySchedule = ref([]); // Holds the final processed schedule for the selected date
const isLoading = ref(false); // Local loading state for this panel's operations
const error = ref(null); // Local error state for this panel
const showDatePicker = ref(false); // State to toggle date picker visibility
const datePickerInput = ref(null); // Ref for the date input element

// --- Computed Properties ---
// Get data from Vuex store
const regularSchedule = computed(() => store.getters['schedule/regularSchedule']);
const appliedExceptions = computed(() => store.getters['schedule/appliedExceptions']);
const daysOff = computed(() => store.getters['daysOff/allDaysOff']);
const classes = computed(() => store.getters['classes/allClasses']);
// Format date for display
const formattedDate = computed(() => formatDate(selectedDate.value));

// Determine if the selected date is a day off (checking both global and applied exceptions)
const isDayOff = computed(() => {
  if (!selectedDate.value) return false;
  const isGlobalDayOff = store.getters['daysOff/isDayOff'](selectedDate.value);
  let exceptionIsDayOff = false;
  // Add safety check here too
  if (Array.isArray(appliedExceptions.value)) {
    const exceptionInfo = appliedExceptions.value.find(e => e.date === selectedDate.value);
    exceptionIsDayOff = exceptionInfo && exceptionInfo.isDayOff;
  } else {
    // Don't warn here constantly, data might just not be loaded yet
    // console.warn("[isDayOff computed] appliedExceptions.value is not an array yet:", appliedExceptions.value);
  }
  return isGlobalDayOff || exceptionIsDayOff;
});

// Get color for the day off notice border
const dayOffColor = computed(() => {
  if (!isDayOff.value) return null;
  let exceptionColor = null;
  // Check appliedExceptions array safely
  if (Array.isArray(appliedExceptions.value)) {
    const exceptionInfo = appliedExceptions.value.find(e => e.date === selectedDate.value);
    if (exceptionInfo && exceptionInfo.isDayOff) {
      exceptionColor = exceptionInfo.color || '#F0F0F0'; // Use exception color or default
    }
  }
  if (exceptionColor) return exceptionColor; // Prioritize exception color

  const dayOffInfo = daysOff.value.find(d => d.date === selectedDate.value);
  return dayOffInfo?.color || '#F0F0F0'; // Use day off color or default
});

// Get the reason associated with the day off
const dayOffReason = computed(() => {
  if (!isDayOff.value) return '';
  let exceptionReason = null;
  // Check appliedExceptions array safely
  if (Array.isArray(appliedExceptions.value)) {
    const exceptionInfo = appliedExceptions.value.find(e => e.date === selectedDate.value);
    if (exceptionInfo && exceptionInfo.isDayOff) {
      exceptionReason = exceptionInfo.reason || 'Day Off (Exception)';
    }
  }
  if (exceptionReason) return exceptionReason; // Prioritize exception reason

  const dayOffInfo = daysOff.value.find(d => d.date === selectedDate.value); // Find the object to get the reason
  if (dayOffInfo) return dayOffInfo.reason;
  // Default fallback
  return 'Day Off';
});

// Determine relative date string (Today, Yesterday, etc.)
const relativeDateString = computed(() => {
  if (!selectedDate.value) return '';
  const todayStr = getTodayDateString();
  if (!todayStr || selectedDate.value === 'Invalid Date') return '';
  if (selectedDate.value === todayStr) return 'Today';
  const yesterdayDate = new Date(); yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = toYYYYMMDD(yesterdayDate);
  if (yesterdayStr && selectedDate.value === yesterdayStr) return 'Yesterday';
  const tomorrowDate = new Date(); tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowStr = toYYYYMMDD(tomorrowDate);
  if (tomorrowStr && selectedDate.value === tomorrowStr) return 'Tomorrow';
  const twoDaysAgoDate = new Date(); twoDaysAgoDate.setDate(twoDaysAgoDate.getDate() - 2);
  const twoDaysAgoStr = toYYYYMMDD(twoDaysAgoDate);
  if (twoDaysAgoStr && selectedDate.value === twoDaysAgoStr) return '2 Days Ago';
  return '';
});


// --- Methods ---

/**
 * Parses the current selectedDate string into a Date object.
 * @returns {Date | null} A Date object or null if parsing fails.
 */
const getCurrentDateObject = () => {
  // console.log(`[getCurrentDateObject] Current selectedDate.value: ${selectedDate.value}`);
  if (!selectedDate.value) { console.warn("getCurrentDateObject: selectedDate is null/empty"); return null; }
  try {
    const date = new Date(selectedDate.value + 'T12:00:00'); // Add time component
    if (isNaN(date.getTime())) { console.warn("getCurrentDateObject: Parsed date is invalid"); return null; }
    // console.log(`[getCurrentDateObject] Parsed date object:`, date);
    return date;
  } catch (e) { console.error("getCurrentDateObject: Error parsing date", e); return null; }
};

/**
 * Navigates the selectedDate by a number of days.
 * @param {number} daysToAdd - The number of days to add (can be negative).
 */
const changeDay = (daysToAdd) => {
  console.log(`[changeDay] Called with daysToAdd: ${daysToAdd}`);
  const currentDate = getCurrentDateObject();
  if (!currentDate) { console.error("changeDay: Could not get current date object."); return; }
  currentDate.setDate(currentDate.getDate() + daysToAdd);
  const newDateString = toYYYYMMDD(currentDate);
  console.log(`[changeDay] New calculated date string: ${newDateString}`);
  if (newDateString) { // Only update if the new date is valid
    selectedDate.value = newDateString;
  } else {
    console.error("changeDay: Failed to calculate new date string.");
  }
};

/**
 * Navigates the selectedDate by a number of months.
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
  if (newDateString) { // Only update if the new date is valid
    selectedDate.value = newDateString;
  } else {
    console.error("changeMonth: Failed to calculate new date string.");
  }
};

// Navigation button handlers
const goToPreviousDay = () => { console.log("goToPreviousDay clicked"); changeDay(-1); };
const goToNextDay = () => { console.log("goToNextDay clicked"); changeDay(1); };
const goToPreviousMonth = () => { console.log("goToPreviousMonth clicked"); changeMonth(-1); };
const goToNextMonth = () => { console.log("goToNextMonth clicked"); changeMonth(1); };

// Watcher for showing/focusing the date picker overlay
watch(showDatePicker, async (newValue) => {
  if (newValue) {
    await nextTick();
    datePickerInput.value?.focus();
    try { datePickerInput.value?.showPicker(); } catch (e) { console.warn("showPicker() not supported or failed."); }
  }
});

// Main function to load and process the schedule for the selected date
const loadDailySchedule = () => {
  showDatePicker.value = false; // Hide picker if open
  isLoading.value = true;     // Set local loading state
  error.value = null;         // Clear previous local errors
  let processedScheduleItems = []; // Intermediate array before final mapping

  // Validate selected date
  if (!selectedDate.value || selectedDate.value === 'Invalid Date') {
    console.warn("[DailySchedulePanel] No valid date selected in loadDailySchedule.");
    error.value = "Please select a valid date.";
    dailySchedule.value = [];
    isLoading.value = false;
    return;
  }
  console.log(`[DailySchedulePanel] loadDailySchedule STARTING for date: ${selectedDate.value}`);

  // Check if it's a day off (using computed property)
  if (isDayOff.value) {
    console.log(`[DailySchedulePanel] Date ${selectedDate.value} is a day off.`);
    dailySchedule.value = []; // Ensure schedule array is empty
    isLoading.value = false;
    return;
  }

  try {
    const dayOfWeek = getDayOfWeek(selectedDate.value);
    // Handle weekends or invalid days
    if (!dayOfWeek || dayOfWeek === 'sunday' || dayOfWeek === 'saturday') {
      console.log(`[DailySchedulePanel] Skipping schedule load for invalid/weekend day: '${dayOfWeek}' (Date: ${selectedDate.value})`);
      dailySchedule.value = [];
      isLoading.value = false;
      return;
    }

    // Find if an exception is applied to this date
    let appliedExceptionData = null;
    if (Array.isArray(appliedExceptions.value)) {
      // Find applied exception that is NOT a day off and HAS a pattern
      appliedExceptionData = appliedExceptions.value.find(e =>
        e.date === selectedDate.value &&
        !e.isDayOff &&
        e.exceptionPatternId &&
        e.ExceptionPattern?.patternData // Ensure pattern data is loaded
      );
    }
    console.log(`[DailySchedulePanel] Applied Exception data for ${selectedDate.value}:`, appliedExceptionData);

    // --- Determine schedule source: Base or Exception Pattern ---
    if (appliedExceptionData) {
      // --- Use Exception Pattern ---
      console.log("[DailySchedulePanel] Applying exception pattern:", appliedExceptionData.ExceptionPattern.name);
      const patternSequence = appliedExceptionData.ExceptionPattern.patternData; // Array of original period numbers [4, 5, 1, null, ...]
      const baseScheduleForDay = regularSchedule.value?.[dayOfWeek] || [];

      // Iterate through the pattern sequence to build the schedule items for the day
      patternSequence.forEach((originalPeriodNumber) => {
        if (originalPeriodNumber !== null) {
          // Find the classId from the original schedule slot
          const baseItem = baseScheduleForDay[originalPeriodNumber - 1]; // Adjust index
          if (baseItem && baseItem.classId) {
            // Find the class details (including color)
            const cls = classes.value.find(c => String(c.id) === String(baseItem.classId));
            if (cls) {
              // Add item to our list, assign time based on NEW index later
              processedScheduleItems.push({
                classId: cls.id,
                originalPeriod: originalPeriodNumber, // Keep track if needed
                isException: true, // Mark that this day follows a pattern
                color: cls.color || '#FFFFFF', // Get color from class
                notes: appliedExceptionData.reason // Add notes from the applied exception record
              });
            } else {
              console.warn(`Class ID ${baseItem.classId} from pattern/base schedule not found.`);
            }
          } else {
            console.log(`[DailySchedulePanel] Original period ${originalPeriodNumber} was empty in base schedule.`);
          }
        }
        // If originalPeriodNumber is null, this new period slot is intentionally empty
      });

      // Now assign sequential times based on the new order defined by the pattern
      processedScheduleItems.forEach((item, index) => {
        item.time = periodTimes[index] || `P${index + 1}`; // Assign time based on new sequence
      });

      console.log("[DailySchedulePanel] Schedule items generated from pattern (before class lookup):", JSON.parse(JSON.stringify(processedScheduleItems)));

    } else {
      // --- Use Regular Schedule (Base) ---
      console.log("[DailySchedulePanel] Using regular schedule.");
      const baseSchedule = regularSchedule.value?.[dayOfWeek] || [];
      console.log(`[DailySchedulePanel] Base schedule for ${dayOfWeek}:`, JSON.parse(JSON.stringify(baseSchedule)));
      // Map base schedule items, adding time based on period index
      processedScheduleItems = baseSchedule
        .map((item, index) => {
          if (item && item.classId) {
            return {
              classId: item.classId,
              time: periodTimes[index] || `P${index + 1}`, // Assign time
              isException: false
            };
          }
          return null;
        })
        .filter(item => item !== null); // Remove empty slots
      console.log("[DailySchedulePanel] Schedule items generated from base:", JSON.parse(JSON.stringify(processedScheduleItems)));
    }
    // --- End Schedule Source Determination ---


    // Check for items missing 'time' before sorting
    const itemsMissingTime = processedScheduleItems.filter(item => typeof item.time !== 'string' || !item.time);
    if (itemsMissingTime.length > 0) {
      console.error("[DailySchedulePanel] ERROR: Items missing 'time' property before sort:", itemsMissingTime);
      throw new Error("Error processing schedule: Found items missing 'time'.");
    }

    // Sort the final schedule by time
    processedScheduleItems.sort((a, b) => a.time.localeCompare(b.time));

    // --- Map class IDs to formatted names AND COLOR, and filter out deleted classes ---
    const finalMappedSchedule = processedScheduleItems.map(item => {
      if (!item) return null; // Safety check

      const cls = item.classId ? classes.value.find(c => String(c.id) === String(item.classId)) : null;
      // If classId exists but class not found, filter it out
      if (item.classId && !cls) {
        console.log(`[DailySchedulePanel] Class ID ${item.classId} not found (deleted). Filtering out.`);
        return null;
      }

      let displayClassName = null;
      // Use color from the item if it was set (e.g., from exception pattern processing), otherwise from class, then default
      let itemColor = item.color || (cls ? cls.color : null) || '#FFFFFF';

      if (cls) { // If class details were found
        if (cls.classType === 'numbered') {
          const yearNum = parseInt(cls.yearLevel, 10);
          const displayYear = yearNum <= 3 ? yearNum : yearNum - 3;
          const schoolSuffix = yearNum <= 3 ? 'J' : 'H';
          displayClassName = `${displayYear}${schoolSuffix}-${cls.classNumber}`;
        } else if (cls.classType === 'special') {
          displayClassName = cls.className;
          if (cls.yearLevel) { displayClassName += ` (Yr ${cls.yearLevel})`; }
        } else { displayClassName = 'Unknown Class Type'; }
      } else if (item.notes) { // Handle items defined purely by pattern notes
        displayClassName = item.notes;
        itemColor = itemColor || '#EEEEEE'; // Default light grey for note-only items
      }

      // Return the final item object for display
      return { ...item, className: displayClassName, color: itemColor };

    }).filter(item => item !== null); // Filter out nulls (deleted classes or mapping issues)
    // --- End Mapping and Filtering ---

    // Update the component's reactive ref used for display
    dailySchedule.value = finalMappedSchedule;
    console.log("[DailySchedulePanel] Final sorted schedule for display (with color):", JSON.parse(JSON.stringify(dailySchedule.value)));

  } catch (err) {
    console.error("[DailySchedulePanel] Error processing daily schedule:", err);
    error.value = err.message || "Failed to calculate daily schedule.";
    dailySchedule.value = []; // Clear display on error
  } finally {
    isLoading.value = false; // Ensure loading state is always reset
  }
};

// Opens the modal for editing daily exceptions
const openExceptionModal = () => {
  if (!selectedDate.value) {
    console.error("[openExceptionModal] Cannot open modal, no date selected.");
    return;
  }
  console.log(`[openExceptionModal] Triggered for date: ${selectedDate.value}`);

  let existingException = null;
  // Access state directly for safety during potential initial load race conditions
  const currentExceptions = store.state.schedule.dailyExceptions;
  console.log(`[openExceptionModal] Current store.state.schedule.dailyExceptions:`, JSON.parse(JSON.stringify(currentExceptions)));

  if (Array.isArray(currentExceptions)) {
    console.log(`[openExceptionModal] Searching for exception in array...`);
    existingException = currentExceptions.find(e => e.date === selectedDate.value);
    console.log(`[openExceptionModal] Found existing exception:`, existingException);
  } else {
    console.warn("[openExceptionModal] store.state.schedule.dailyExceptions is not an array:", currentExceptions);
  }

  console.log(`[openExceptionModal] Dispatching ui/openModal with data:`, { date: selectedDate.value, exception: existingException });
  store.dispatch('ui/openModal', {
    modalName: 'dailyException',
    data: { date: selectedDate.value, exception: existingException } // Pass date and potentially null exception
  });
};

// Helper to determine if a color is dark (needs light text)
const isDarkColor = (hexColor) => {
  if (!hexColor || hexColor.length < 7) return false;
  try {
    const r = parseInt(hexColor.substring(1, 3), 16);
    const g = parseInt(hexColor.substring(3, 5), 16);
    const b = parseInt(hexColor.substring(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance < 0.5;
  } catch (e) { return false; }
};


// --- Watchers & Lifecycle ---
watch(showDatePicker, async (newValue) => {
  if (newValue) {
    await nextTick();
    datePickerInput.value?.focus();
    try { datePickerInput.value?.showPicker(); } catch (e) { console.warn("showPicker() not supported or failed."); }
  }
});
onMounted(() => {
  // Fetch necessary data on component mount if not already loaded
  if (!regularSchedule.value || Object.keys(regularSchedule.value).length === 0) { store.dispatch('schedule/fetchRegularSchedule'); }
  // Use the correct action name if renamed
  if (!appliedExceptions.value || appliedExceptions.value.length === 0) { store.dispatch('schedule/fetchAppliedExceptions'); }
  if (daysOff.value.length === 0) { store.dispatch('daysOff/fetchDaysOff'); }
  if (classes.value.length === 0) { store.dispatch('classes/fetchClasses'); }
  if (store.getters['exceptionPatterns/allPatterns'].length === 0) { store.dispatch('exceptionPatterns/fetchPatterns'); }
  // Load schedule for the initial date (today) after ensuring date is set
  nextTick(() => {
    loadDailySchedule();
  });
});
// Reload schedule when the selected date changes
watch(selectedDate, loadDailySchedule);
// Reload schedule if the underlying data sources change
watch([regularSchedule, appliedExceptions, daysOff, classes], (newData, oldData) => {
  console.log("[Watcher schedule/exceptions/daysOff/classes] Data changed, reloading daily schedule.");
  loadDailySchedule();
}, { deep: true });

</script>

<style scoped>
/* Styles for the panel */
.panel-body {
  max-height: 400px;
  overflow-y: auto;
  padding-top: 0;
}

/* Styles for the list display */
.daily-schedule-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.schedule-list-item {
  padding: 0.6rem 0.8rem;
  /* Add padding */
  border-bottom: 1px solid var(--border-color);
  font-size: 0.9rem;
  display: flex;
  /* Use flex for alignment */
  align-items: center;
  gap: 0.5em;
  /* Gap between potential elements */
  transition: background-color 0.3s ease;
  color: #333;
  /* Default text color (for light backgrounds) */
  border-radius: 4px;
  /* Optional: slightly rounded corners */
  margin-bottom: 2px;
  /* Optional: space between items */
}

.schedule-list-item:last-child {
  border-bottom: none;
}

/* Style for text when background is dark */
.schedule-list-item.has-dark-background {
  color: #f8f9fa;
  /* Light text color */
}

.schedule-list-item.has-dark-background .exception-tag {
  color: #333;
  /* Ensure tag text is readable */
  background-color: rgba(255, 255, 255, 0.8);
  /* Lighter tag background */
}

.exception-tag {
  font-size: 0.8em;
  color: var(--warning);
  font-weight: bold;
  margin-left: 0.5em;
  background-color: #fff3cd;
  padding: 0.1em 0.4em;
  border-radius: 3px;
}

/* Styles for the Day Off notice */
.day-off-notice {
  /* Use border-left-color for day off indication */
  border-left: 5px solid var(--border-color);
  /* Default border */
  transition: background-color 0.3s ease, border-left-color 0.3s ease;
  /* Transition background and border */
  color: #333;
  /* Default text color */
  padding: 1.5rem;
  background-color: var(--light);
  /* Default background */
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  text-align: center;
  margin-top: 1rem;
}

.day-off-notice.has-dark-background {
  color: #f8f9fa;
  /* Light text for dark background */
}

.day-off-notice.has-dark-background h3 {
  color: #f8f9fa;
  /* Light text for dark background */
}

.day-off-notice h3 {
  margin-top: 0;
  margin-bottom: 0.5rem;
  color: var(--secondary);
}

/* Styles for the exception edit button area */
.exception-controls {
  text-align: center;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
}

/* Styles for loading/error/placeholder messages */
.loading,
.error-message,
.placeholder-content {
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

/* Updated Header Styles */
.panel-header.date-navigation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: nowrap;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  position: relative;
}

/* Container for Title and Relative Indicator */
.date-display-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-grow: 1;
}

.date-title {
  margin: 0;
  font-weight: 600;
  font-size: 1.1rem;
  text-align: center;
  cursor: pointer;
  padding: 0.2rem 0.5rem;
  border-radius: var(--border-radius);
  transition: background-color 0.2s;
}

.date-title:hover {
  background-color: #eee;
}

/* Style for the relative date indicator */
.relative-date-indicator {
  font-size: 0.8rem;
  color: var(--secondary);
  font-weight: normal;
  margin-top: -2px;
  /* Adjust spacing */
}

.nav-button {
  background: none;
  border: 1px solid transparent;
  padding: 0.1rem 0.5rem;
  font-size: 1.2rem;
  font-weight: bold;
  line-height: 1;
  cursor: pointer;
  color: var(--primary);
  border-radius: 4px;
  transition: background-color 0.2s;
}

.nav-button:hover {
  background-color: #e0e0e0;
}

.nav-button.month-nav {
  font-size: 1rem;
}

.date-picker-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 10;
  padding: 0.3rem 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: 0.9rem;
  max-width: 180px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}

.date-picker {
  display: none;
}

.header-divider {
  border: none;
  border-top: 1px solid var(--border-color);
  margin-top: 0.5rem;
  margin-bottom: 1rem;
}

/* Styles for list item alignment with color */
.item-text {
  flex-grow: 1;
  /* Allow text to take remaining space */
  white-space: nowrap;
  /* Prevent wrapping */
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
