<template>
  <div class="modal-overlay" @click.self="closeModal">
    <div class="modal-content">
      <button @click="closeModal" class="modal-close-btn">&times;</button>
      <h3>Edit Exceptions for {{ formattedDate }}</h3>
      <hr>

      <div class="modal-body">
        <p v-if="saveError" class="error-message">{{ saveError }}</p>

        <div class="form-group">
            <label>Exception Type:</label>
            <div class="radio-group">
                <label>
                    <input type="radio" v-model="exceptionType" value="dayOff" name="exType"> Mark as Day Off
                </label>
                <label>
                    <input type="radio" v-model="exceptionType" value="pattern" name="exType"> Apply Schedule Pattern
                </label>
                 <label>
                    <input type="radio" v-model="exceptionType" value="clear" name="exType"> Clear Exception (Use Regular)
                </label>
            </div>
        </div>

        <div v-if="exceptionType === 'dayOff'" class="day-off-fields">
             <div class="form-group">
                <label for="ex-dayoff-reason">Reason (Optional)</label>
                <input
                    type="text"
                    id="ex-dayoff-reason"
                    v-model="dayOffDetails.reason"
                    class="form-control form-control-sm"
                    placeholder="e.g., Holiday, Conference"
                    :disabled="isLoading"
                />
            </div>
             <div class="form-group">
               <label for="ex-dayoff-color">Color</label>
               <input
                 type="color"
                 id="ex-dayoff-color"
                 v-model="dayOffDetails.color"
                 class="form-control form-control-sm form-control-color"
                 :disabled="isLoading"
                >
           </div>
        </div>

        <div v-if="exceptionType === 'pattern'" class="pattern-fields">
             <div class="form-group">
                <label for="ex-pattern-select">Select Pattern:</label>
                <select
                  id="ex-pattern-select"
                  v-model="selectedPatternId"
                  class="form-control form-control-sm"
                  required
                  :disabled="isLoadingPatterns || isLoading"
                >
                  <option value="" disabled>-- Select a Pattern --</option>
                  <option v-if="isLoadingPatterns" disabled>(Loading patterns...)</option>
                  <option v-else-if="availablePatterns.length === 0" disabled>
                    (No patterns created yet)
                  </option>
                  <option v-for="pattern in availablePatterns" :key="pattern.id" :value="pattern.id">
                    {{ pattern.name }}
                  </option>
                </select>
                <p v-if="patternsError" class="error-message small-error">{{ patternsError }}</p>
             </div>
              <div class="form-group">
                <label for="ex-pattern-notes">Notes for this day (Optional)</label>
                <input
                    type="text"
                    id="ex-pattern-notes"
                    v-model="patternDetails.notes"
                    class="form-control form-control-sm"
                    placeholder="e.g., Assembly Schedule"
                    :disabled="isLoading"
                />
            </div>
        </div>

        <div v-if="exceptionType === 'clear'" class="clear-explanation">
             <p>This will remove any specific day off or pattern applied to this date, reverting it to the regular weekly schedule.</p>
         </div>

      </div>
      <div class="modal-footer">
          <button @click="closeModal" type="button" class="btn btn-secondary btn-sm" :disabled="isLoading">Cancel</button>
          <button @click="handleSaveException" class="btn btn-primary btn-sm" :disabled="isLoading || (exceptionType === 'pattern' && !selectedPatternId)">
             {{ isLoading ? 'Saving...' : 'Apply Exception' }}
          </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue';
import { useStore } from 'vuex';

const store = useStore();
const modalName = 'dailyException'; // Unique name for this modal

// --- State ---
const isLoading = ref(false); // Loading state for saving the applied exception
const saveError = ref(null);
const exceptionType = ref('clear'); // 'dayOff', 'pattern', 'clear'
const selectedPatternId = ref(''); // ID of the selected pattern
const dayOffDetails = reactive({ reason: '', color: '#F0F0F0' }); // Details for 'dayOff' type
const patternDetails = reactive({ notes: '' }); // Notes specific to the day the pattern is applied

// --- Computed Properties ---
// Get the data passed when the modal was opened (should include date and optional existing exception)
const modalData = computed(() => store.getters['ui/getModalData'](modalName));
const date = computed(() => modalData.value?.date); // The date being edited
const existingException = computed(() => modalData.value?.exception); // Existing AppliedException record from store

// Fetch available patterns for the dropdown
const availablePatterns = computed(() => store.getters['exceptionPatterns/allPatterns']);
const isLoadingPatterns = computed(() => store.getters['exceptionPatterns/isLoading']);
const patternsError = computed(() => store.getters['exceptionPatterns/error']);

// Format date for display in the title
const formattedDate = computed(() => {
    if (!date.value) return '';
    try {
        const d = new Date(date.value + 'T00:00:00');
        if (isNaN(d.getTime())) return 'Invalid Date';
        return d.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    } catch (e) { return 'Invalid Date'; }
});

// Helper to reset conditional form fields
const resetFields = () => {
    selectedPatternId.value = '';
    dayOffDetails.reason = '';
    dayOffDetails.color = '#F0F0F0';
    patternDetails.notes = '';
};

// --- Watchers ---
// Populate form based on existing exception when modal opens or data changes
watch(existingException, (currentEx) => {
    saveError.value = null; // Clear previous save errors
    if (currentEx) {
        console.log("DailyExceptionModal received existing data:", currentEx);
        if (currentEx.isDayOff) {
            exceptionType.value = 'dayOff';
            dayOffDetails.reason = currentEx.reason || '';
            dayOffDetails.color = currentEx.color || '#F0F0F0'; // Use existing color or default
            selectedPatternId.value = ''; // Clear pattern selection
            patternDetails.notes = ''; // Clear pattern notes
        } else if (currentEx.exceptionPatternId) {
            exceptionType.value = 'pattern';
            selectedPatternId.value = currentEx.exceptionPatternId;
            patternDetails.notes = currentEx.reason || ''; // Use reason field for pattern notes
            dayOffDetails.reason = ''; // Clear day off fields
            dayOffDetails.color = '#F0F0F0';
        } else {
            // If it exists but is neither day off nor pattern, default to clear
            exceptionType.value = 'clear';
             resetFields();
        }
    } else {
        // No existing exception, default to 'clear' type
        exceptionType.value = 'clear';
         resetFields();
    }
}, { immediate: true, deep: true }); // Deep watch might be needed if exception object structure changes

// Fetch patterns if needed when modal opens
watch(() => store.state.ui.modals.dailyException, (isOpen) => {
    if (isOpen && availablePatterns.value.length === 0 && !isLoadingPatterns.value) {
        store.dispatch('exceptionPatterns/fetchPatterns');
    }
});


// --- Methods ---



// Close the modal
const closeModal = () => {
  if (isLoading.value) return;
  store.dispatch('ui/closeModal', modalName);
};

// Save the applied exception (or clear it)
const handleSaveException = async () => {
    if (!date.value) { saveError.value = "Date is missing."; return; }

    isLoading.value = true;
    saveError.value = null;

    try {
        if (exceptionType.value === 'clear') {
            // Dispatch action to DELETE the applied exception for this date
            console.log(`Attempting to clear exception for ${date.value}`);
            // This action needs to exist in the schedule (or a new appliedExceptions) module
            await store.dispatch('schedule/clearAppliedException', date.value);
        } else {
            // Prepare data payload for POST/PUT to apply exception
            let payload = {
                date: date.value,
                isDayOff: exceptionType.value === 'dayOff',
                // Send pattern ID only if type is 'pattern', otherwise null
                exceptionPatternId: exceptionType.value === 'pattern' ? selectedPatternId.value : null,
                // Use reason from dayOffDetails or patternDetails based on type
                reason: exceptionType.value === 'dayOff' ? dayOffDetails.reason : (exceptionType.value === 'pattern' ? patternDetails.notes : null),
                // Only include color if it's a 'dayOff' type
                color: exceptionType.value === 'dayOff' ? dayOffDetails.color : null
            };

             // Validation specific to pattern type
             if (exceptionType.value === 'pattern' && !payload.exceptionPatternId) {
                 saveError.value = "Please select an exception pattern.";
                 isLoading.value = false;
                 return;
             }

            console.log(`Attempting to apply exception for ${date.value}:`, payload);
            // Dispatch action to POST/PUT the applied exception
            // This action (e.g., in schedule module) will call the backend service
            await store.dispatch('schedule/applyException', payload);
        }
        closeModal(); // Close modal on success
    } catch (error) {
        saveError.value = error.message || "Failed to save exception.";
        console.error("Error saving exception:", error);
    } finally {
        isLoading.value = false; // Reset loading state
    }
};

// --- Lifecycle Hooks ---
const handleEscapeKey = (event) => { if (event.key === 'Escape') { closeModal(); } };
onMounted(() => { document.addEventListener('keydown', handleEscapeKey); });
onUnmounted(() => { document.removeEventListener('keydown', handleEscapeKey); });

</script>

<style scoped>
/* Uses global modal styles */
.modal-content { min-width: 450px; max-width: 600px; }
.modal-body { margin-top: 1rem; margin-bottom: 1.5rem; }
h3 { margin: 0; padding-bottom: 1rem; border-bottom: 1px solid var(--border-color); font-weight: 600; font-size: 1.2rem; }
p strong { font-weight: 600; color: var(--primary); }
hr { border: none; border-top: 1px solid var(--border-color); margin: 1rem 0; }
.modal-footer { display: flex; justify-content: flex-end; align-items: center; gap: 0.75rem; padding-top: 1.5rem; border-top: 1px solid var(--border-color); margin-top: 1.5rem; }
.form-control-sm { font-size: 0.9rem; }
.error-message { color: var(--danger); background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: var(--border-radius); padding: 0.5rem 0.8rem; margin-bottom: 1rem; font-size: 0.875rem; }
.error-message.small-error { padding: 0.3rem 0.6rem; margin-top: 0.25rem; margin-bottom: 0.5rem; }
.btn-primary:disabled, .btn-secondary:disabled { cursor: not-allowed; opacity: 0.65; }
.modal-footer .btn-sm { padding: 0.35rem 0.8rem; font-size: 0.875rem; }
.form-control-color { width: 100px; height: 30px; padding: 0.1rem 0.2rem; cursor: pointer; border: 1px solid var(--border-color); border-radius: var(--border-radius); }
.loading { text-align: center; padding: 1rem; color: var(--secondary); }

/* Styles for exception type selection */
.radio-group { display: flex; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
.radio-group label { display: flex; align-items: center; gap: 0.3rem; font-weight: normal; cursor: pointer; margin-bottom: 0; }
.radio-group input[type="radio"] { margin-top: 0; margin-right: 0.2rem; }

/* Styles for conditional fields */
.day-off-fields, .pattern-fields, .clear-explanation {
    padding: 1rem;
    border: 1px dashed var(--border-color);
    border-radius: var(--border-radius);
    margin-top: 1rem;
    background-color: #fdfdfd;
}
.clear-explanation p {
    margin: 0;
    font-size: 0.9rem;
    color: var(--secondary);
}
</style>

