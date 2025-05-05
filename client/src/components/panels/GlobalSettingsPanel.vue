<template>
  <div class="panel global-settings-panel admin-panel">
    <div class="panel-header">
      <h3 class="panel-title">Global Settings</h3>
    </div>
    <div class="panel-body">
      <div v-if="isLoading" class="loading">Loading settings...</div>
      <div v-else-if="error" class="error-message">{{ error }}</div>
      <div v-else class="settings-controls">
        <div class="settings-toggles">
          <div class="form-check form-switch">
            <input class="form-check-input" type="checkbox" role="switch" id="applyGlobalDaysOffToggle"
              :checked="applyGlobalDaysOff" @change="updateSetting('applyGlobalDaysOff', $event.target.checked)"
              :disabled="isUpdating">
            <label class="form-check-label" for="applyGlobalDaysOffToggle">
              Apply Global Days Off
            </label>
          </div>
          <div class="form-check form-switch">
            <input class="form-check-input" type="checkbox" role="switch" id="applyGlobalExceptionsToggle"
              :checked="applyGlobalExceptions" @change="updateSetting('applyGlobalExceptions', $event.target.checked)"
              :disabled="isUpdating">
            <label class="form-check-label" for="applyGlobalExceptionsToggle">
              Apply Global Schedule Exceptions
            </label>
          </div>
          <p v-if="updateError" class="error-message small-error mt-2">{{ updateError }}</p>
        </div>



      </div>
      <small class="text-muted mt-2 d-block px-3 pb-2">
        Note: Global settings apply to all users. User-specific settings override regular schedule, but global settings
        override user-specific ones.
      </small>
    </div>
  </div>
</template>

<script setup>
// Import necessary functions from Vue and Vuex
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';

// Initialize Vuex store
const store = useStore();

// --- Component State ---
// Local state to track if an update operation (saving toggle state) is in progress
const isUpdating = ref(false);
// Local state to store any errors that occur during the update operation
const updateError = ref(null);

// --- Store State (Computed Properties) ---
// Get the global settings toggle values reactively from the store getters
const applyGlobalDaysOff = computed(() => store.getters['globalSettings/shouldApplyGlobalDaysOff']);
const applyGlobalExceptions = computed(() => store.getters['globalSettings/shouldApplyGlobalExceptions']);
// Get loading and error states related to fetching the initial settings
const isLoading = computed(() => store.getters['globalSettings/isLoading']);
const error = computed(() => store.getters['globalSettings/error']);

// --- Methods ---

/**
 * Dispatches the action to update the global settings when a toggle switch changes.
 * @param {string} settingKey - The key of the setting to update ('applyGlobalDaysOff' or 'applyGlobalExceptions').
 * @param {boolean} value - The new boolean value for the setting from the checkbox event.
 */
const updateSetting = async (settingKey, value) => {
  isUpdating.value = true; // Set local loading state for the update
  updateError.value = null; // Clear previous update errors
  console.log(`Updating global setting: ${settingKey} to ${value}`);

  // Prepare the payload with the current state of *both* toggles,
  // overwriting the one that just changed. This ensures the backend
  // always receives the complete settings object.
  const payload = {
    applyGlobalDaysOff: applyGlobalDaysOff.value,
    applyGlobalExceptions: applyGlobalExceptions.value,
    [settingKey]: value // Dynamically set the changed key based on the event
  };

  try {
    // Dispatch the action to update settings in the backend and store
    await store.dispatch('globalSettings/updateSettings', payload);
    // State updates reactively via the store mutation after API success,
    // which will update the :checked binding on the input.
    console.log("Global settings update successful.");
  } catch (err) {
    // Handle errors during the update
    updateError.value = err.message || 'Failed to update setting.';
    console.error("Error updating setting, refetching to revert UI potentially...");
    // Refetch settings on error to ensure UI toggle reverts to actual DB state
    // This prevents the UI toggle from staying in the wrong state if the save failed.
    store.dispatch('globalSettings/fetchSettings');
  } finally {
    // Reset local loading state regardless of success/failure
    isUpdating.value = false;
  }
};

/**
 * Opens the modal for managing the list of global days off.
 * Passes a flag to indicate the global context.
 */
const manageGlobalDaysOff = () => {
  console.log("Opening modal to manage GLOBAL days off");
  // Reuses DayOffEditorModal for adding/editing individual global days off.
  // A dedicated list management modal might be better for viewing/bulk actions in the future.
  store.dispatch('ui/openModal', {
    modalName: 'dayOffEditor', // Reuse the existing modal
    data: { isGlobal: true } // Pass flag to tell the modal it's for global management
  });
  // Provide feedback that full management UI isn't ready yet
  alert("Management UI for listing/editing multiple Global Days Off not fully implemented yet. Use 'Add Day Off' modal triggered from here to add/edit globally.");
};

/**
 * Opens the modal for managing globally applied exception patterns.
 * Passes a flag to indicate the global context.
 */
const manageGlobalExceptions = () => {
  console.log("Opening modal to manage GLOBAL applied exceptions");
  // Reuses DailyExceptionModal for applying patterns globally to a specific date.
  // A dedicated list management modal might be better in the future.
  store.dispatch('ui/openModal', {
    modalName: 'dailyException', // Reuse the existing modal
    data: { isGlobal: true, date: null, exception: null } // Indicate global context, start with no date selected
  });
  alert("Management UI for listing/editing multiple Global Exceptions not fully implemented yet. Use 'Edit Exceptions' modal triggered from here to apply globally.");
};


/**
 * Helper function to format date (example, adjust as needed).
 * Used for potential future display within this panel, currently unused here.
 * @param {string} dateString - Date in 'YYYY-MM-DD' format.
 * @returns {string} Formatted date string.
 */
const formatDate = (dateString) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', weekday: 'short' });
  } catch (e) { return 'Invalid Date'; }
}

// --- Lifecycle Hook ---
onMounted(() => {
  // Fetch settings on mount if they haven't been loaded yet (e.g., by App.vue)
  // Check if settings have default values which might indicate they weren't fetched
  if (applyGlobalDaysOff.value === true && applyGlobalExceptions.value === true && !isLoading.value && !error.value) {
    // Check if the store indicates loading or error already to avoid redundant fetch
    // This fetch might be redundant if App.vue reliably fetches on load.
    // console.log("[GlobalSettingsPanel] Settings seem to be default, potentially fetching again.");
    // store.dispatch('globalSettings/fetchSettings');
  }
});
</script>

<style scoped>
/* Basic styling for the admin panel */
.admin-panel {
  border-left: 4px solid var(--warning);
  /* Distinctive border for admin panels */
  margin-top: 1rem;
  /* Add some space above */
}

.panel-body {
  padding: 0.5rem 1rem 1rem 1rem;
  /* Adjust padding */
}

/* Container for the controls */
.settings-controls {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  /* Space between sections */
}

/* Container for the toggle switches */
.settings-toggles {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  /* Space between toggles */
  margin-bottom: 1rem;
  /* Space below toggles */
}

/* Container for the management buttons */
.management-buttons {
  display: flex;
  flex-direction: column;
  /* Stack buttons vertically */
  gap: 0.5rem;
  /* Space between buttons */
  margin-top: 1rem;
  /* Space above buttons */
  padding-top: 1rem;
  /* Space above buttons */
  border-top: 1px solid var(--border-color);
  /* Separator line */
}

/* Loading and error message styling */
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

.error-message.small-error {
  /* Smaller error for toggle feedback */
  padding: 0.3rem 0.6rem;
  font-size: 0.8rem;
  margin-top: 0.5rem;
  margin-bottom: 0;
  /* Remove extra margin */
}

/* Bootstrap switch styling (ensure Bootstrap CSS is loaded or add custom styles) */
.form-check.form-switch {
  padding-left: 3em;
  /* Adjust padding for switch */
  display: flex;
  /* Align label and switch nicely */
  align-items: center;
}

.form-check-input {
  width: 2.5em;
  /* Standard switch width */
  height: 1.25em;
  /* Standard switch height */
  cursor: pointer;
  margin-left: -3em;
  /* Position switch correctly */
  margin-top: 0;
  /* Reset margin */
}

.form-check-input:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.form-check-label {
  padding-left: 0.5em;
  /* Space between switch and label */
  cursor: pointer;
  margin-bottom: 0;
  /* Remove default margin */
}

/* Style label when switch is disabled */
.form-check-label:has(+ .form-check-input:disabled) {
  cursor: not-allowed;
  opacity: 0.7;
}

/* Helper text styling */
.text-muted {
  font-size: 0.8rem;
  color: var(--secondary);
}

.d-block {
  display: block !important;
}

.mt-2 {
  margin-top: 0.5rem !important;
}

.px-3 {
  padding-left: 1rem !important;
  padding-right: 1rem !important;
}

.pb-2 {
  padding-bottom: 0.5rem !important;
}

/* Basic outline button style */
.btn-outline-secondary {
  color: var(--secondary);
  border-color: var(--secondary);
}

.btn-outline-secondary:hover {
  color: #fff;
  background-color: var(--secondary);
  border-color: var(--secondary);
}
</style>
