<template>
  <div class="modal-overlay" @click.self="closeModal">
    <div class="modal-content large"> <button @click="closeModal" class="modal-close-btn">&times;</button>
      <h3>Edit Regular Weekly Schedule</h3>
      <p class="instructions">Select a class for each period, or leave as "No Class" for empty slots.</p>
      <hr>

      <div class="modal-body">
          <div v-if="isLoadingClasses || isLoadingSchedule" class="loading">Loading data...</div>
          <div v-else-if="scheduleError || classesError" class="error-message">
              {{ scheduleError || classesError || 'Error loading data.' }}
          </div>

          <div v-else class="schedule-grid-container">
              <table class="schedule-grid-table">
                  <thead>
                      <tr>
                          <th>Period</th>
                          <th v-for="day in daysOfWeek" :key="day">{{ capitalize(day) }}</th>
                      </tr>
                  </thead>
                  <tbody>
                      <tr v-for="period in periods" :key="period">
                          <td>Period {{ period }}</td>
                          <td v-for="day in daysOfWeek" :key="`${day}-${period}`">
                              <select
                                v-model="editableSchedule[day][period - 1]"
                                class="form-control form-control-sm period-select"
                                :disabled="isSaving"
                              >
                                  <option :value="null">-- No Class --</option>
                                  <option v-for="cls in availableClasses" :key="cls.id" :value="cls.id">
                                      <template v-if="cls.classType === 'numbered'">
                                          Yr {{ cls.yearLevel }} - Cls {{ cls.classNumber }}
                                      </template>
                                      <template v-else-if="cls.classType === 'special'">
                                          {{ cls.className }} <span v-if="cls.yearLevel" class="special-year-level-option">(Yr {{ cls.yearLevel }})</span>
                                      </template>
                                      <template v-else>
                                          {{ cls.id }} </template>
                                  </option>
                              </select>
                          </td>
                      </tr>
                  </tbody>
              </table>
          </div>
      </div>

       <div class="modal-footer">
          <p v-if="saveError" class="error-message footer-error">{{ saveError }}</p>
          <button @click="closeModal" type="button" class="btn btn-secondary btn-sm" :disabled="isSaving">Cancel</button>
          <button @click="saveSchedule" class="btn btn-primary btn-sm" :disabled="isSaving">
             {{ isSaving ? 'Saving...' : 'Save Schedule' }}
          </button>
      </div>
    </div>
  </div>
</template>

<script setup>
// Import nextTick
import { ref, reactive, computed, watch, onMounted, nextTick } from 'vue';
import { useStore } from 'vuex';

const store = useStore();
const modalName = 'weeklySchedule'; // Unique name for this modal

// --- Component State ---
const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']; // Days to display in the grid
const periods = [1, 2, 3, 4, 5, 6]; // Periods to display in the grid
const isSaving = ref(false); // Loading state for the save operation
const saveError = ref(null); // Error message specific to saving

// Reactive object to hold the schedule being edited in the modal
// Structure: { monday: [classId|null, ...], tuesday: [...], ... }
const editableSchedule = reactive({});

// Function to initialize the structure of editableSchedule with nulls
const initializeSchedule = () => {
    daysOfWeek.forEach(day => {
        // Ensure each day exists as a key and has an array of the correct length
        editableSchedule[day] = Array(periods.length).fill(null);
    });
     console.log("Initialized editableSchedule:", JSON.parse(JSON.stringify(editableSchedule)));
};
initializeSchedule(); // Call immediately on component setup

// --- Store State ---
// Get the schedule data passed to the modal when opened
const modalData = computed(() => store.getters['ui/getModalData'](modalName));
// Get the list of all classes (numbered and special) for the dropdown options
const availableClasses = computed(() => store.getters['classes/allClasses']);
// Get loading/error states from relevant store modules
const isLoadingClasses = computed(() => store.getters['classes/isLoading']);
const classesError = computed(() => store.getters['classes/error']);
const isLoadingSchedule = computed(() => store.getters['schedule/isLoading']);
const scheduleError = computed(() => store.getters['schedule/error']);

// --- Watchers ---
// Watch for changes in modalData (i.e., when the modal is opened with new schedule data)
watch(modalData, (currentSchedule) => {
    console.log("Weekly Schedule Modal received data:", currentSchedule);
    saveError.value = null; // Clear previous save errors
    initializeSchedule(); // Reset/ensure structure before populating

    // If valid schedule data is passed from the store
    if (currentSchedule && typeof currentSchedule === 'object') {
        // Populate the local editableSchedule state based on the passed data
        daysOfWeek.forEach(day => {
            if (currentSchedule[day] && Array.isArray(currentSchedule[day])) {
                 // Map the stored data format [{classId: id}, null, ...] to just [id, null, ...]
                 const dayScheduleIds = currentSchedule[day].map(item => item ? item.classId : null);
                 // Ensure the array has the correct number of periods, padding with null if necessary
                 while (dayScheduleIds.length < periods.length) { dayScheduleIds.push(null); }
                 // Assign the processed array of IDs/nulls to the reactive state
                 editableSchedule[day] = dayScheduleIds.slice(0, periods.length);
            } else {
                 // If the day doesn't exist in the passed data, ensure it's initialized with nulls
                 editableSchedule[day] = Array(periods.length).fill(null);
            }
        });
         console.log("Populated editableSchedule:", JSON.parse(JSON.stringify(editableSchedule)));
    } else {
        // If no data is passed, the initialized empty schedule is used
        console.log("No schedule data passed, using initialized empty schedule.");
    }

    // Ensure the list of classes (for dropdowns) is loaded if it hasn't been already
    if (availableClasses.value.length === 0 && !isLoadingClasses.value) {
        store.dispatch('classes/fetchClasses');
    }
}, { immediate: true, deep: true }); // Run immediately on mount and watch nested changes


// --- Methods ---

// Closes the modal by dispatching the action to the UI store
const closeModal = () => {
  if (isSaving.value) return; // Prevent closing while save is in progress
  store.dispatch('ui/closeModal', modalName);
};

// Handles the "Save Schedule" button click
const saveSchedule = async () => {
    console.log("Attempting to save weekly schedule:", JSON.parse(JSON.stringify(editableSchedule)));
    isSaving.value = true; // Set loading state
    saveError.value = null; // Clear previous errors

    // --- Prepare data for backend ---
    // Convert the local editableSchedule (containing class IDs or null)
    // back into the format expected by the backend (array of {classId: id} or null)
    const scheduleToSave = {};
    daysOfWeek.forEach(day => {
        scheduleToSave[day] = editableSchedule[day].map(classId => {
            // If a classId exists, create the object; otherwise, keep it null
            return classId ? { classId: classId } : null;
        });
    });
    console.log("Formatted schedule for saving:", scheduleToSave);

    try {
        // Dispatch the action to update the schedule in the store/backend
        await store.dispatch('schedule/updateRegularSchedule', scheduleToSave);
        console.log("Schedule save dispatch successful. Calling closeModal via nextTick...");
        // Use nextTick to ensure the state update potentially finishes before closing
        nextTick(() => {
            closeModal(); // Close modal after the next DOM update cycle
        });
    } catch (error) {
        // Handle errors during the save process
        console.error("Error saving weekly schedule:", error);
        saveError.value = error.message || "Failed to save schedule.";
         // Optionally dispatch UI notification
         // store.dispatch('ui/showNotification', { type: 'error', message: saveError.value }, { root: true });
    } finally {
        // Reset loading state regardless of success/failure
        isSaving.value = false;
    }
};

// Helper function to capitalize day names for table headers
const capitalize = (s) => {
    if (typeof s !== 'string' || s.length === 0) return '';
    return s.charAt(0).toUpperCase() + s.slice(1);
}

</script>

<style scoped>
/* Uses global modal styles defined in main.css */
.modal-content.large { /* Class to make the modal wider */
    min-width: 80vw; /* Example: Use 80% of viewport width */
    max-width: 1200px; /* Set a maximum width */
}
.modal-body {
    margin-top: 1rem;
    margin-bottom: 1.5rem;
}
.instructions { /* Style for the helper text */
    font-size: 0.9rem;
    color: var(--secondary);
    margin-top: -0.5rem; /* Adjust spacing relative to title */
    margin-bottom: 1rem;
}
h3 { /* Modal title */
    margin: 0;
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--border-color);
}
hr { /* Separator line */
    border: none;
    border-top: 1px solid var(--border-color);
    margin: 1rem 0;
}
.modal-footer { /* Container for action buttons */
    display: flex;
    justify-content: flex-end; /* Align buttons to the right */
    align-items: center; /* Align items vertically */
    gap: 0.75rem; /* Space between buttons */
    padding-top: 1rem;
    border-top: 1px solid var(--border-color); /* Separator above footer */
}
.footer-error { /* Style for error message in footer */
    margin-right: auto; /* Push error to the left */
    margin-bottom: 0; /* Remove default margin */
    padding: 0.3rem 0.6rem; /* Adjust padding */
    font-size: 0.8rem; /* Smaller font */
    color: var(--danger); /* Use danger color */
    /* Add background/border if needed */
    /* background-color: #f8d7da; */
    /* border: 1px solid #f5c6cb; */
    /* border-radius: var(--border-radius); */
}

/* Styles for the schedule grid */
.schedule-grid-container {
    overflow-x: auto; /* Enable horizontal scrolling on smaller viewports */
}
.schedule-grid-table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed; /* Helps keep column widths consistent */
}
.schedule-grid-table th,
.schedule-grid-table td {
    border: 1px solid var(--border-color);
    padding: 0.3rem; /* Reduced padding for tighter grid */
    text-align: center;
    vertical-align: middle;
    font-size: 0.85rem;
    min-width: 100px; /* Minimum width for each day column */
}
.schedule-grid-table th { /* Header cells (Days) */
    background-color: var(--light);
    font-weight: 600;
    padding: 0.5rem 0.3rem;
}
.schedule-grid-table td { /* Data cells */
     height: 55px; /* Ensure cells have a minimum height */
}
.schedule-grid-table td:first-child { /* Style for the first column (Period numbers) */
    font-weight: 600;
    background-color: var(--light);
    color: var(--secondary);
    min-width: 60px; /* Smaller min-width for period column */
    width: 60px; /* Fixed width for period column */
}

/* Style for the dropdown select elements */
.period-select {
    width: 100%;
    padding: 0.2rem; /* Smaller padding */
    font-size: 0.8rem; /* Smaller font */
    border: 1px solid #ccc;
    border-radius: 4px;
    background-color: #fff;
    -webkit-appearance: menulist-button; /* Try to force dropdown appearance */
    appearance: menulist-button;
}
.period-select:disabled { /* Style when saving */
    background-color: #eee;
    cursor: not-allowed;
}
/* Style for the optional year level display within dropdown options */
.special-year-level-option {
    font-size: 0.9em; /* Slightly smaller */
    color: var(--secondary); /* Greyed out */
    margin-left: 0.3em;
    font-style: italic;
}

/* Styles for loading/error messages */
.loading, .error-message {
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
/* Style for disabled buttons */
.btn-primary:disabled, .btn-secondary:disabled {
    cursor: not-allowed;
    opacity: 0.65;
}
</style>

