<template>
  <div class="modal-overlay" @click.self="closeModal">
    <div class="modal-content large"> <button @click="closeModal" class="modal-close-btn">&times;</button>
      <h3>{{ isEditing ? 'Edit Exception Pattern' : 'Create Exception Pattern' }}</h3>
      <p class="instructions">Define the sequence of periods for this exception day. Select which original period's class should occur in each new period slot, or select "No Class / Omit".</p>
      <hr>

      <form @submit.prevent="handleSubmit" class="modal-form">
        <p v-if="formError" class="error-message">{{ formError }}</p>

        <div class="form-group">
          <label for="pattern-name">Pattern Name</label>
          <input
            type="text"
            id="pattern-name"
            v-model="editablePattern.name"
            required
            class="form-control form-control-sm"
            :disabled="isLoading"
            placeholder="e.g., Short Day, Assembly Schedule"
          />
        </div>

        <div class="pattern-grid">
          <div v-for="newPeriod in 6" :key="newPeriod" class="form-group period-slot">
            <label :for="`period-map-${newPeriod}`">Period {{ newPeriod }} contains class from:</label>
            <select
              :id="`period-map-${newPeriod}`"
              v-model="editablePattern.patternData[newPeriod - 1]"
              class="form-control form-control-sm"
              :disabled="isLoading"
            >
              <option :value="null">-- No Class / Omit --</option>
              <option v-for="originalPeriod in 6" :key="originalPeriod" :value="originalPeriod">
                Original Period {{ originalPeriod }}
              </option>
            </select>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="closeModal" type="button" class="btn btn-secondary btn-sm" :disabled="isLoading">
            Cancel
          </button>
          <button type="submit" class="btn btn-primary btn-sm" :disabled="isLoading">
            {{ isLoading ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Save Changes' : 'Create Pattern') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue';
import { useStore } from 'vuex';

const store = useStore();
const modalName = 'exceptionPatternEditor';

// --- State ---
const isLoading = ref(false);
const formError = ref(null);

// Reactive object for pattern name and the pattern data array
const editablePattern = reactive({
  id: null,
  name: '',
  patternData: Array(6).fill(null) // Initialize as array of 6 nulls
});

// --- Computed Properties ---
const modalData = computed(() => store.getters['ui/getModalData'](modalName));
const isEditing = computed(() => !!editablePattern.id);

// --- Watchers ---
// Populate form when modal opens
watch(modalData, (newData) => {
  formError.value = null;
  if (newData && typeof newData === 'object' && newData.id) {
    // Edit Mode
    editablePattern.id = newData.id;
    editablePattern.name = newData.name || '';
    // Ensure patternData is an array of 6, padding with null if needed
    const loadedPattern = Array.isArray(newData.patternData) ? newData.patternData : [];
    while(loadedPattern.length < 6) { loadedPattern.push(null); }
    editablePattern.patternData = loadedPattern.slice(0, 6);
    console.log("ExceptionPatternEditorModal received EDIT data:", newData);
  } else {
    // Add Mode
    editablePattern.id = null;
    editablePattern.name = '';
    editablePattern.patternData = Array(6).fill(null); // Reset to empty pattern
    console.log("ExceptionPatternEditorModal opened in ADD mode.");
  }
}, { immediate: true, deep: true }); // Deep watch needed for array changes


// --- Methods ---
const closeModal = () => {
  if (isLoading.value) return;
  store.dispatch('ui/closeModal', modalName);
};

const handleSubmit = async () => {
  // Validate name
  if (!editablePattern.name || editablePattern.name.trim() === '') {
      formError.value = "Pattern name is required.";
      return;
  }
  // Validate that at least one period is mapped (optional)
  // if (editablePattern.patternData.every(p => p === null)) {
  //     formError.value = "Pattern must define at least one period.";
  //     return;
  // }

  isLoading.value = true;
  formError.value = null;

  // Data is already in the correct format: [originalPeriod | null, ...]
  const payload = {
      name: editablePattern.name.trim(),
      patternData: editablePattern.patternData
  };

  try {
    if (isEditing.value) {
      // Update Existing Pattern
      await store.dispatch('exceptionPatterns/updatePattern', { id: editablePattern.id, data: payload });
    } else {
      // Add New Pattern
      await store.dispatch('exceptionPatterns/addPattern', payload);
    }
    closeModal();
  } catch (error) {
    formError.value = error.message || `Failed to ${isEditing.value ? 'update' : 'create'} pattern.`;
    console.error(`Error ${isEditing.value ? 'updating' : 'creating'} pattern:`, error);
  } finally {
    isLoading.value = false;
  }
};

// --- Lifecycle Hooks ---
const handleEscapeKey = (event) => { if (event.key === 'Escape') { closeModal(); } };
onMounted(() => { document.addEventListener('keydown', handleEscapeKey); });
onUnmounted(() => { document.removeEventListener('keydown', handleEscapeKey); });

</script>

<style scoped>
/* Uses global modal styles */
.modal-content.large { min-width: 500px; max-width: 750px; } /* Adjusted size */
.modal-form { margin-top: 1rem; }
h3 { margin: 0; padding-bottom: 1rem; border-bottom: 1px solid var(--border-color); font-weight: 600; font-size: 1.2rem; }
p.instructions { font-size: 0.9rem; color: var(--secondary); margin-top: 0.5rem; margin-bottom: 1rem; }
hr { border: none; border-top: 1px solid var(--border-color); margin: 1rem 0; }
.modal-footer { display: flex; justify-content: flex-end; gap: 0.75rem; padding-top: 1.5rem; border-top: 1px solid var(--border-color); margin-top: 1.5rem; }
.form-control-sm { font-size: 0.9rem; }
.error-message { color: var(--danger); background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: var(--border-radius); padding: 0.5rem 0.8rem; margin-bottom: 1rem; font-size: 0.875rem; }
.btn-primary:disabled, .btn-secondary:disabled { cursor: not-allowed; opacity: 0.65; }
.modal-footer .btn-sm { padding: 0.35rem 0.8rem; font-size: 0.875rem; }

/* Grid layout for period mapping */
.pattern-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); /* Responsive columns */
    gap: 1rem;
    margin-top: 1.5rem;
    padding-top: 1rem;
    border-top: 1px dashed var(--border-color);
}
.period-slot label {
    display: block;
    margin-bottom: 0.3rem;
    font-weight: 500;
    font-size: 0.85rem;
}
select.form-control-sm {
    width: 100%; /* Make select fill container */
}
</style>

