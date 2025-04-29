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
const toYYYYMMDD = (date) => {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
        console.warn("[toYYYYMMDD] Invalid date object received:", date);
        return null;
    }
    const offset = date.getTimezoneOffset() * 60000;
    const localDate = new Date(date.getTime() - offset);
    return localDate.toISOString().split('T')[0];
};
const getTodayDateString = () => { return toYYYYMMDD(new Date()); };
const getDayOfWeek = (dateString) => {
    if (!dateString || typeof dateString !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return '';
    try {
        const date = new Date(dateString + 'T00:00:00');
        if (isNaN(date.getTime())) return '';
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        return days[date.getDay()];
    } catch (e) { return ''; }
}
const formatDate = (dateString) => {
    if (!dateString || typeof dateString !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return 'Invalid Date';
    try {
        const date = new Date(dateString + 'T00:00:00');
        if (isNaN(date.getTime())) return 'Invalid Date';
        return date.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    } catch (e) { return 'Invalid Date'; }
}
const periodTimes = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00'];

// --- State ---
const selectedDate = ref(getTodayDateString());
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
const relativeDateString = computed(() => {
    if (!selectedDate.value) return '';
    const todayStr = getTodayDateString();
    if (!todayStr) return '';
    if (selectedDate.value === todayStr) return 'Today';
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = toYYYYMMDD(yesterdayDate);
    if (yesterdayStr && selectedDate.value === yesterdayStr) return 'Yesterday';
    const tomorrowDate = new Date();
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrowStr = toYYYYMMDD(tomorrowDate);
     if (tomorrowStr && selectedDate.value === tomorrowStr) return 'Tomorrow';
    const twoDaysAgoDate = new Date();
    twoDaysAgoDate.setDate(twoDaysAgoDate.getDate() - 2);
    const twoDaysAgoStr = toYYYYMMDD(twoDaysAgoDate);
    if (twoDaysAgoStr && selectedDate.value === twoDaysAgoStr) return '2 Days Ago';
    return '';
});


// --- Methods ---
const getCurrentDateObject = () => {
    if (!selectedDate.value) return null;
    try {
        const date = new Date(selectedDate.value + 'T12:00:00');
        if (isNaN(date.getTime())) return null;
        return date;
    } catch (e) { return null; }
};
const changeDay = (daysToAdd) => {
    const currentDate = getCurrentDateObject();
    if (!currentDate) return;
    currentDate.setDate(currentDate.getDate() + daysToAdd);
    selectedDate.value = toYYYYMMDD(currentDate);
};
const changeMonth = (monthsToAdd) => {
    const currentDate = getCurrentDateObject();
    if (!currentDate) return;
    currentDate.setDate(1);
    currentDate.setMonth(currentDate.getMonth() + monthsToAdd);
    selectedDate.value = toYYYYMMDD(currentDate);
};
const goToPreviousDay = () => changeDay(-1);
const goToNextDay = () => changeDay(1);
const goToPreviousMonth = () => changeMonth(-1);
const goToNextMonth = () => changeMonth(1);

watch(showDatePicker, async (newValue) => {
    if (newValue) {
        await nextTick();
        datePickerInput.value?.focus();
        datePickerInput.value?.showPicker();
    }
});

const loadDailySchedule = () => {
  showDatePicker.value = false;
  isLoading.value = true;
  error.value = null;
  let finalSchedule = [];

  if (!selectedDate.value) { console.warn("[DailySchedulePanel] No date selected."); error.value = "Please select a date."; dailySchedule.value = []; isLoading.value = false; return; }
  console.log(`[DailySchedulePanel] Loading schedule for date: ${selectedDate.value}`);
  if (isDayOff.value) { console.log(`[DailySchedulePanel] Date ${selectedDate.value} is a day off.`); dailySchedule.value = []; isLoading.value = false; return; }

  try {
    const dayOfWeek = getDayOfWeek(selectedDate.value);
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

     // --- Map class IDs to formatted names for display ---
     finalSchedule = finalSchedule.map(item => {
         const cls = item.classId ? classes.value.find(c => String(c.id) === String(item.classId)) : null;
         let displayClassName = null;
         if (cls) {
             // Check classType to determine display format
             if (cls.classType === 'numbered') {
                 displayClassName = `Yr ${cls.yearLevel} - Cls ${cls.classNumber}`;
             } else if (cls.classType === 'special') {
                 displayClassName = cls.className; // Just use the special name
                 // Optionally append year level if it exists for special class
                 if (cls.yearLevel) {
                     displayClassName += ` (Yr ${cls.yearLevel})`;
                 }
             } else {
                 displayClassName = 'Unknown Class Type';
             }
         } else if (item.classId) {
             displayClassName = 'Unknown Class'; // Class ID exists but no match found
         }
         return {
             ...item,
             className: displayClassName // This property is used in the template
         };
     });
     // --- End Mapping ---

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
