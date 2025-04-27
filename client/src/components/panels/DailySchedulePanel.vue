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
                    {{ item.time }} - {{ item.className || item.notes }} ({{ item.duration }} min)
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
import { ref, computed, onMounted, watch } from 'vue';
import { useStore } from 'vuex';

const store = useStore();

// --- Helper Functions ---
const getTodayDateString = () => {
  const today = new Date();
  return today.toISOString().split('T')[0]; // Format as YYYY-MM-DD
};

const getDayOfWeek = (dateString) => {
    const date = new Date(dateString + 'T00:00:00'); // Ensure local timezone interpretation
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[date.getDay()];
}

const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString + 'T00:00:00');
     return date.toLocaleDateString(undefined, { // Use browser's default locale
         weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
     });
}

// --- State ---
const selectedDate = ref(getTodayDateString());
const dailySchedule = ref([]);
const isLoading = ref(false); // Local loading state for this specific view
const error = ref(null); // Local error state

// --- Computed Properties ---
const regularSchedule = computed(() => store.getters['schedule/regularSchedule']);
const exceptions = computed(() => store.getters['schedule/dailyExceptions']);
const daysOff = computed(() => store.getters['daysOff/allDaysOff']);
const classes = computed(() => store.getters['classes/allClasses']); // To get class names

const formattedDate = computed(() => formatDate(selectedDate.value));

const isDayOff = computed(() => {
    const dayOffInfo = daysOff.value.find(d => d.date === selectedDate.value);
    const exceptionInfo = exceptions.value.find(e => e.date === selectedDate.value);
    return !!dayOffInfo || (exceptionInfo && exceptionInfo.isDayOff);
});

const dayOffReason = computed(() => {
    if (!isDayOff.value) return '';
    const dayOffInfo = daysOff.value.find(d => d.date === selectedDate.value);
    if (dayOffInfo) return dayOffInfo.reason;
    const exceptionInfo = exceptions.value.find(e => e.date === selectedDate.value);
    if (exceptionInfo && exceptionInfo.isDayOff) return exceptionInfo.reason || 'Day Off (Exception)';
    return 'Day Off';
});


// --- Methods ---
const loadDailySchedule = () => {
  isLoading.value = true;
  error.value = null;
  dailySchedule.value = []; // Clear previous schedule

  if (isDayOff.value) {
      isLoading.value = false;
      return; // Stop processing if it's a day off
  }

  try {
    const dayOfWeek = getDayOfWeek(selectedDate.value);
    const baseSchedule = regularSchedule.value[dayOfWeek] || [];
    const exceptionData = exceptions.value.find(e => e.date === selectedDate.value);

    console.log(`Loading schedule for ${selectedDate.value} (${dayOfWeek})`);
    // console.log("Base Schedule:", baseSchedule);
    // console.log("Exception Data:", exceptionData);

    let finalSchedule = [...baseSchedule.map(item => ({ ...item, isException: false }))]; // Copy base schedule

    // Apply exceptions
    if (exceptionData && exceptionData.changes) {
      exceptionData.changes.forEach(change => {
        const existingIndex = finalSchedule.findIndex(item => item.time === change.time);

        if (change.action === 'cancel' || change.action === 'delete') {
          if (existingIndex !== -1) {
            finalSchedule.splice(existingIndex, 1); // Remove item
          }
        } else if (change.action === 'add' || change.action === 'create') {
           if (existingIndex === -1) { // Add only if no item exists at that time
                finalSchedule.push({ ...change, isException: true });
           } else {
                console.warn(`Exception tried to add item at existing time ${change.time}, consider 'update' action.`);
                 // Optionally update existing if needed
                 finalSchedule[existingIndex] = { ...finalSchedule[existingIndex], ...change, isException: true };
           }
        } else if (change.action === 'update') {
          if (existingIndex !== -1) {
            finalSchedule[existingIndex] = { ...finalSchedule[existingIndex], ...change, isException: true }; // Update existing
          } else {
             console.warn(`Exception tried to update non-existent item at time ${change.time}, adding instead.`);
             finalSchedule.push({ ...change, isException: true }); // Add if it doesn't exist
          }
        }
      });
    }

    // Sort schedule by time
    finalSchedule.sort((a, b) => a.time.localeCompare(b.time));

     // Map class IDs to names
     finalSchedule = finalSchedule.map(item => {
         const cls = classes.value.find(c => c.id === item.classId);
         return {
             ...item,
             className: cls ? cls.name : (item.classId ? 'Unknown Class' : null) // Handle missing class or no classId
         };
     });

    dailySchedule.value = finalSchedule;

  } catch (err) {
    console.error("Error processing daily schedule:", err);
    error.value = "Failed to calculate daily schedule.";
  } finally {
    isLoading.value = false;
  }
};

const openExceptionModal = () => {
    console.log("Trigger Edit Exception Modal for:", selectedDate.value);
    const existingException = exceptions.value.find(e => e.date === selectedDate.value);
    store.dispatch('ui/openModal', {
        modalName: 'dailyException',
        data: { date: selectedDate.value, exception: existingException } // Pass date and existing data
    });
};


// --- Watchers & Lifecycle ---
onMounted(() => {
  // Ensure necessary base data is potentially loaded (App.vue usually handles this)
  // if (!regularSchedule.value || Object.keys(regularSchedule.value).length === 0) {
  //     store.dispatch('schedule/fetchRegularSchedule');
  // }
  // if (exceptions.value.length === 0) {
  //     store.dispatch('schedule/fetchDailyExceptions');
  // }
  // if (daysOff.value.length === 0) {
  //     store.dispatch('daysOff/fetchDaysOff');
  // }
   // if (classes.value.length === 0) {
  //     store.dispatch('classes/fetchClasses');
  // }

  loadDailySchedule(); // Load schedule for the initial date
});

// Reload schedule when selected date changes
watch(selectedDate, loadDailySchedule);

// Reload if underlying data changes (e.g., after saving exceptions/regular schedule)
watch([regularSchedule, exceptions, daysOff, classes], loadDailySchedule, { deep: true });

</script>

<style scoped>
.panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap; /* Allow wrapping on smaller screens */
    gap: 1rem;
}
.panel-title {
    margin: 0; /* Remove default margin */
}
.date-picker {
    padding: 0.3rem 0.5rem;
    max-width: 180px; /* Limit width */
    border: 1px solid var(--border-color);
}
.schedule-content {
    margin-top: 1rem;
}
.schedule-content ul {
    list-style: none;
    padding: 0;
}
.schedule-content li {
    padding: 0.6rem 0;
    border-bottom: 1px solid var(--border-color);
}
.schedule-content li:last-child {
    border-bottom: none;
}
.exception-tag {
    font-size: 0.8em;
    color: var(--warning);
    font-weight: bold;
    margin-left: 0.5em;
}
.day-off-notice {
    padding: 1.5rem;
    background-color: var(--light);
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius);
    text-align: center;
}
.day-off-notice h3 {
    margin-bottom: 0.5rem;
    color: var(--secondary);
}
.exception-controls {
    text-align: center;
    margin-top: 1rem;
}
.loading, .error-message {
    padding: 1rem;
    text-align: center;
    color: var(--secondary);
}
</style>

