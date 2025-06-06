<template>
  <CollapsiblePanel>
    <template #header>
      <h3 class="panel-title">Global Settings</h3>
    </template>

    <template #body>
      <div class="panel-body">
        <div v-if="isLoadingAll" class="loading">Loading settings...</div>
        <div v-else-if="errorAll" class="error-message">{{ errorAll }}</div>
        <div v-else class="settings-controls">
          <div class="settings-toggles">
            <div class="form-check form-switch">
              <input class="form-check-input" type="checkbox" role="switch" id="applyGlobalDaysOffToggle"
                :checked="applyGlobalDaysOff"
                @change="updateGeneralSetting('applyGlobalDaysOff', $event.target.checked)"
                :disabled="isUpdatingGeneral" />
              <label class="form-check-label" for="applyGlobalDaysOffToggle">
                Apply Global Days Off
              </label>
            </div>

            <div class="form-check form-switch">
              <input class="form-check-input" type="checkbox" role="switch" id="applyGlobalExceptionsToggle"
                :checked="applyGlobalExceptions"
                @change="updateGeneralSetting('applyGlobalExceptions', $event.target.checked)"
                :disabled="isUpdatingGeneral" />
              <label class="form-check-label" for="applyGlobalExceptionsToggle">
                Apply Global Schedule Exceptions
              </label>
            </div>

            <div class="form-check form-switch">
              <input class="form-check-input" type="checkbox" role="switch" id="allowRegistrationToggle"
                :checked="isRegistrationAllowed" @change="toggleRegistrationSetting"
                :disabled="isUpdatingRegistration" />
              <label class="form-check-label" for="allowRegistrationToggle">
                Allow New User Registrations
              </label>
            </div>
            <div v-if="isUpdatingGeneral || isUpdatingRegistration" class="small-loading">(Saving...)</div>

            <p v-if="updateErrorGeneral" class="error-message small-error mt-2">
              {{ updateErrorGeneral }}
            </p>
            <p v-if="updateErrorRegistration" class="error-message small-error mt-2">
              {{ updateErrorRegistration }}
            </p>
            <p v-if="successMessage" class="success-message small-success mt-2">
              {{ successMessage }}
            </p>
          </div>
        </div>
        <small class="text-muted mt-2 d-block px-3 pb-2">
          Note: Global settings apply to all users. User‐specific settings override regular schedule, but global
          settings override user‐specific ones.
        </small>
      </div>
    </template>
  </CollapsiblePanel>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import CollapsiblePanel from './CollapsiblePanel.vue';

const store = useStore();

// --- Component State ---
// For disabling controls during updates, assuming your Vuex store has an 'isUpdating' getter
const isUpdatingGeneral = computed(() => store.getters['globalSettings/isUpdating']);
const isUpdatingRegistration = computed(() => store.getters['globalSettings/isUpdating']);

const updateErrorGeneral = ref(null);
const updateErrorRegistration = ref(null);

const successMessage = ref('');

// --- Store State (Computed Properties) ---

const applyGlobalDaysOff = computed(() => store.getters['globalSettings/shouldApplyGlobalDaysOff']);
const applyGlobalExceptions = computed(() => store.getters['globalSettings/shouldApplyGlobalExceptions']);
const isRegistrationAllowed = computed(() => store.getters['globalSettings/isRegistrationAllowed']);


// Unified loading/error for fetching all settings initially
const isLoadingAll = computed(() => store.getters['globalSettings/isLoading']);
const errorAll = computed(() => store.getters['globalSettings/error']);


// --- Methods ---
const clearMessages = () => {
  updateErrorGeneral.value = null;
  updateErrorRegistration.value = null;
  successMessage.value = '';
};

const showSuccessTemporary = (message) => {
  successMessage.value = message;
  setTimeout(() => {
    successMessage.value = '';
  }, 3000);
};

/**
 * Updates general global settings like applyGlobalDaysOff and applyGlobalExceptions.
 */
const updateGeneralSetting = async (settingKey, value) => {
  // isUpdatingGeneral.value = true;
  clearMessages();

  const payload = {
    applyGlobalDaysOff: applyGlobalDaysOff.value,
    applyGlobalExceptions: applyGlobalExceptions.value,
    [settingKey]: value,
  };

  try {
    await store.dispatch('globalSettings/updateGlobalSettings', payload); // Action for these specific settings
    showSuccessTemporary('Settings updated successfully.');
  } catch (err) {
    updateErrorGeneral.value = err.message || 'Failed to update setting.';
    // Re-fetch to revert UI if the store doesn't do it automatically on error
    store.dispatch('globalSettings/fetchGlobalSettings');
  } finally {
    //isUpdatingGeneral.value = false;
  }
};

/**
 * Toggles the allowRegistration global setting.
 */
const toggleRegistrationSetting = async (event) => {
  // isUpdatingRegistration.value = true;
  clearMessages();
  const newValue = event.target.checked;

  try {
    await store.dispatch('globalSettings/updateAllowRegistration', newValue);
    showSuccessTemporary('Registration status updated successfully.');
  } catch (error) {
    updateErrorRegistration.value = error.message || 'Failed to update registration status.';
    // Revert UI toggle on error by re-fetching state
    event.target.checked = !newValue; // Optimistic revert, or re-fetch all settings
    store.dispatch('globalSettings/fetchGlobalSettings');
  } finally {
    // isUpdatingRegistration.value = false;
  }
};

// --- Lifecycle Hook ---
onMounted(() => {
  // Fetch all global settings if not already loaded or to ensure freshness
  store.dispatch('globalSettings/fetchGlobalSettings');
});
</script>

<style scoped>
/* Basic styling for the admin panel */
.admin-panel {
  border-left: 4px solid var(--warning);
  margin-top: 1rem;
}

.panel-body {
  padding: 0.5rem 1rem 1rem 1rem;
}

.settings-controls {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.settings-toggles {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  margin-bottom: 1rem;
}

.loading,
.error-message,
.success-message,
.placeholder-content,
.small-loading {
  padding: 0.3rem 0.6rem;
  font-size: 0.8rem;
  margin-top: 0.5rem;
  margin-bottom: 0;
  text-align: left;
  /* Align with toggles */
}

.small-loading {
  color: var(--secondary);
}

.error-message {
  color: var(--danger);
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: var(--border-radius);
}

.success-message {
  color: green;
  background-color: #d4edda;
  border: 1px solid #c3e6cb;
  border-radius: var(--border-radius);
}

.form-check.form-switch {
  padding-left: 3em;
  display: flex;
  align-items: center;
}

.form-check-input {
  width: 2.5em;
  height: 1.25em;
  cursor: pointer;
  margin-left: -3em;
  margin-top: 0;
}

.form-check-input:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.form-check-label {
  padding-left: 0.5em;
  cursor: pointer;
  margin-bottom: 0;
}

.form-check-label:has(+ .form-check-input:disabled) {
  cursor: not-allowed;
  opacity: 0.7;
}

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
</style>
