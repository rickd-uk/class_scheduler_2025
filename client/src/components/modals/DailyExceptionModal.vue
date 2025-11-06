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
              <input type="radio" v-model="exceptionType" value="dayOff" name="exType">
              Mark as Day Off
            </label>
            <label>
              <input type="radio" v-model="exceptionType" value="pattern" name="exType">
              Apply Schedule Pattern
            </label>
            <label>
              <input type="radio" v-model="exceptionType" value="clear" name="exType">
              Clear Exception (Use Regular)
            </label>
          </div>
        </div>

        <div v-if="exceptionType === 'dayOff'" class="day-off-fields">
          <div class="form-group">
            <label for="ex-dayoff-reason">Reason (Optional)</label>
            <input type="text" id="ex-dayoff-reason" v-model="dayOffDetails.reason" class="form-control form-control-sm"
              placeholder="e.g., Holiday, Conference" :disabled="isLoading" />
          </div>
          <div class="form-group">
            <label for="ex-dayoff-color">Color</label>
            <input type="color" id="ex-dayoff-color" v-model="dayOffDetails.color"
              class="form-control form-control-sm form-control-color" :disabled="isLoading">
          </div>
        </div>

        <div v-if="exceptionType === 'pattern'" class="pattern-fields">
          <div class="form-group">
            <label for="ex-pattern-select">Select Pattern:</label>
            <select id="ex-pattern-select" v-model="selectedPatternId" class="form-control form-control-sm" required
              :disabled="isLoadingPatterns || isLoading">
              <option value="" disabled>-- Select a Pattern --</option>
              <option v-if="isLoadingPatterns" disabled>(Loading patterns...)</option>
              <option v-else-if="availablePatterns.length === 0" disabled>(No patterns created yet)</option>
              <option v-for="pattern in availablePatterns" :key="pattern.id" :value="pattern.id">
                {{ pattern.name }}
              </option>
            </select>
            <p v-if="patternsError" class="error-message small-error">{{ patternsError }}</p>
          </div>
          <div class="form-group">
            <label for="ex-pattern-notes">Notes for this day (Optional)</label>
            <input type="text" id="ex-pattern-notes" v-model="patternDetails.notes" class="form-control form-control-sm"
              placeholder="e.g., Assembly Schedule" :disabled="isLoading" />
          </div>
        </div>

        <div v-if="exceptionType === 'clear'" class="clear-explanation">
          <p>This will remove any schedule pattern or day-off status applied to this date, reverting it to the regular weekly schedule.</p>
          <p class="preserve-note"><strong>Note:</strong> Any notes or individual class toggles will be preserved.</p>
        </div>
      </div>

      <div class="modal-footer">
        <button @click="closeModal" type="button" class="btn btn-secondary btn-sm" :disabled="isLoading">
          Cancel
        </button>
        <button @click="handleSaveException" class="btn btn-primary btn-sm"
          :disabled="isLoading || (exceptionType === 'pattern' && !selectedPatternId)">
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
const modalName = 'dailyException';

// State
const isLoading = ref(false);
const saveError = ref(null);
const exceptionType = ref('clear');
const selectedPatternId = ref('');
const dayOffDetails = reactive({ reason: '', color: '#F0F0F0' });
const patternDetails = reactive({ notes: '' });

// Modal data
const modalData = computed(() => store.getters['ui/getModalData'](modalName));
const date = computed(() => modalData.value?.date);
const existingException = computed(() => modalData.value?.exception);
const isGlobal = computed(() => modalData.value?.isGlobal === true);

// Patterns dropdown
const availablePatterns = computed(() => store.getters['exceptionPatterns/allPatterns']);
const isLoadingPatterns = computed(() => store.getters['exceptionPatterns/isLoading']);
const patternsError = computed(() => store.getters['exceptionPatterns/error']);

// Date title formatting
const formattedDate = computed(() => {
  if (!date.value) return '';
  const d = new Date(date.value + 'T00:00:00');
  return isNaN(d) ? 'Invalid Date'
    : d.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
});

// Reset helper
const resetFields = () => {
  selectedPatternId.value = '';
  dayOffDetails.reason = '';
  dayOffDetails.color = '#F0F0F0';
  patternDetails.notes = '';
};

// Populate form when editing
watch(existingException, (ex) => {
  saveError.value = null;
  resetFields();
  
  if (!ex) {
    exceptionType.value = 'clear';
    return;
  }
  
  if (ex.isDayOff) {
    // Day off exception
    exceptionType.value = 'dayOff';
    dayOffDetails.reason = ex.reason || '';
    dayOffDetails.color = ex.color || '#F0F0F0';
  } else if (ex.exceptionPatternId) {
    // Pattern exception
    exceptionType.value = 'pattern';
    selectedPatternId.value = ex.exceptionPatternId;
    
    // Try to extract pattern notes from JSON reason field
    if (ex.reason) {
      try {
        const data = JSON.parse(ex.reason);
        // Pattern notes might be stored separately or not at all in current implementation
        // For now, just clear the notes field for patterns
        patternDetails.notes = '';
      } catch (e) {
        // If it's not JSON, treat it as plain text notes
        patternDetails.notes = ex.reason || '';
      }
    }
  } else {
    // No pattern and not a day off - could be notes/toggles only
    // Default to 'clear' since there's no UI for managing notes/toggles in this modal
    exceptionType.value = 'clear';
  }
}, { immediate: true });


const handleSaveException = async () => {
  if (!date.value) { saveError.value = 'Date missing.'; return; }
  isLoading.value = true;
  saveError.value = null;
  
  try {
    // CLEAR
    if (exceptionType.value === 'clear') {
      // Check if there are any notes or disabled periods to preserve
      const currentException = existingException.value;
      
      if (currentException && currentException.reason) {
        try {
          const data = JSON.parse(currentException.reason);
          const hasDisabled = data.disabled && Array.isArray(data.disabled) && data.disabled.length > 0;
          const hasNotes = data.notes && Object.keys(data.notes).length > 0;
          
          // If there are notes or disabled periods, preserve them
          if (hasDisabled || hasNotes) {
            const payload = {
              date: date.value,
              isDayOff: false,
              exceptionPatternId: null,  // Clear the pattern
              reason: JSON.stringify({ 
                disabled: data.disabled || [], 
                notes: data.notes || {} 
              }),
              color: null,
            };
            
            if (isGlobal.value) {
              await store.dispatch('globalAppliedExceptions/applyGlobalException', payload);
            } else {
              await store.dispatch('schedule/applyException', payload);
            }
          } else {
            // No notes or disabled periods, safe to fully delete
            if (isGlobal.value) {
              await store.dispatch('globalAppliedExceptions/deleteGlobalException', date.value);
            } else {
              await store.dispatch('schedule/clearAppliedException', date.value);
            }
          }
        } catch (e) {
          // If parsing fails, just clear completely
          if (isGlobal.value) {
            await store.dispatch('globalAppliedExceptions/deleteGlobalException', date.value);
          } else {
            await store.dispatch('schedule/clearAppliedException', date.value);
          }
        }
      } else {
        // No existing exception or no reason field, safe to clear
        if (isGlobal.value) {
          await store.dispatch('globalAppliedExceptions/deleteGlobalException', date.value);
        } else {
          await store.dispatch('schedule/clearAppliedException', date.value);
        }
      }
      
    // APPLY
    } else {
      const payload = {
        date: date.value,
        isDayOff: exceptionType.value === 'dayOff',
        exceptionPatternId: exceptionType.value === 'pattern' ? selectedPatternId.value : null,
        reason: exceptionType.value === 'dayOff' ? dayOffDetails.reason
          : exceptionType.value === 'pattern' ? patternDetails.notes
            : null,
        color: exceptionType.value === 'dayOff' ? dayOffDetails.color : null,
      };
      
      if (exceptionType.value === 'pattern' && !payload.exceptionPatternId) {
        saveError.value = 'Please select a pattern.';
        isLoading.value = false;
        return;
      }
      
      if (isGlobal.value) {
        await store.dispatch('globalAppliedExceptions/applyGlobalException', payload);
      } else {
        await store.dispatch('schedule/applyException', payload);
      }
    }
    
    closeModal();
    
  } catch (err) {
    saveError.value = err.message || 'Failed to save.';
  } finally {
    isLoading.value = false;
  }
};





// Fetch patterns on open
watch(() => store.state.ui.modals.dailyException, (open) => {
  if (open && availablePatterns.value.length === 0 && !isLoadingPatterns.value) {
    store.dispatch('exceptionPatterns/fetchPatterns');
  }
});

// Close
const closeModal = () => {
  if (isLoading.value) return;
  store.dispatch('ui/closeModal', modalName);
};

// Save/clear
// Escape key
const handleEscapeKey = e => { if (e.key === 'Escape') closeModal(); };
onMounted(() => document.addEventListener('keydown', handleEscapeKey));
onUnmounted(() => document.removeEventListener('keydown', handleEscapeKey));
</script>




<style scoped>
/* Uses global modal styles */
.modal-content {
  min-width: 450px;
  max-width: 600px;
}

.modal-body {
  margin-top: 1rem;
  margin-bottom: 1.5rem;
}

h3 {
  margin: 0;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-color);
  font-weight: 600;
  font-size: 1.2rem;
}

p strong {
  font-weight: 600;
  color: var(--primary);
}

hr {
  border: none;
  border-top: 1px solid var(--border-color);
  margin: 1rem 0;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 0.75rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border-color);
  margin-top: 1.5rem;
}

.form-control-sm {
  font-size: 0.9rem;
}

.error-message {
  color: var(--danger);
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: var(--border-radius);
  padding: 0.5rem 0.8rem;
  margin-bottom: 1rem;
  font-size: 0.875rem;
}

.error-message.small-error {
  padding: 0.3rem 0.6rem;
  margin-top: 0.25rem;
  margin-bottom: 0.5rem;
}

.btn-primary:disabled,
.btn-secondary:disabled {
  cursor: not-allowed;
  opacity: 0.65;
}

.modal-footer .btn-sm {
  padding: 0.35rem 0.8rem;
  font-size: 0.875rem;
}

.form-control-color {
  width: 100px;
  height: 30px;
  padding: 0.1rem 0.2rem;
  cursor: pointer;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
}

.loading {
  text-align: center;
  padding: 1rem;
  color: var(--secondary);
}

/* Styles for exception type selection */
.radio-group {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.radio-group label {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-weight: normal;
  cursor: pointer;
  margin-bottom: 0;
}

.radio-group input[type="radio"] {
  margin-top: 0;
  margin-right: 0.2rem;
}

/* Styles for conditional fields */
.day-off-fields,
.pattern-fields,
.clear-explanation {
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

.preserve-note {
  margin-top: 0.5rem;
  font-size: 0.85rem;
  color: var(--info);
}

</style>
