<template>
  <div class="modal-overlay" @click.self="closeModal">
    <div class="modal-content">
      <button @click="closeModal" class="modal-close-btn">&times;</button>
      <h3>{{ isEditing ? 'Edit Class' : 'Add New Class' }}</h3>
      <hr>

      <form @submit.prevent="handleSubmit" class="modal-form">
        <p v-if="formError" class="error-message">{{ formError }}</p>

        <div class="form-group">
          <label>Class Type:</label>
          <div class="radio-group">
            <label>
              <input type="radio" v-model="formData.classType" value="numbered" name="classTypeModal"
                @change="resetConditionalFields" :disabled="isEditing || isLoading"> Numbered
            </label>
            <label>
              <input type="radio" v-model="formData.classType" value="special" name="classTypeModal"
                @change="resetConditionalFields" :disabled="isEditing || isLoading"> Special
            </label>
          </div>
        </div>

        <div v-if="formData.classType === 'numbered'">
          <div class="form-row-flex">
            <div class="form-group flex-item">
              <label for="modal-class-number">Number</label>
              <select id="modal-class-number" v-model="formData.classNumber" required
                class="form-control form-control-sm" :disabled="isLoading">
                <option disabled value="">Select</option>
                <option v-for="n in 15" :key="n" :value="n">{{ n }}</option>
              </select>
            </div>
            <div class="form-group flex-item">
              <label for="modal-year-level-numbered">Year</label>
              <select id="modal-year-level-numbered" v-model="formData.yearLevel" required
                class="form-control form-control-sm" :disabled="isLoading">
                <option disabled value="">Select</option>
                <option v-for="n in 6" :key="`m-year-${n}`" :value="n">{{ n }}</option>
              </select>
            </div>
            <div class="form-group flex-item">
              <label for="modal-class-color">Color</label>
              <input type="color" id="modal-class-color" v-model="formData.color"
                class="form-control form-control-sm form-control-color" :disabled="isLoading">
            </div>
          </div>
        </div>

        <div v-if="formData.classType === 'special'">
          <div class="form-group">
            <label for="modal-class-name">Special Class Name</label>
            <input type="text" id="modal-class-name" v-model="formData.className" required
              class="form-control form-control-sm" placeholder="e.g., Global, Assembly" :disabled="isLoading" />
            <button type="button" @click="setClassName('Global')" class="btn btn-link btn-sm">Use "Global"</button>
          </div>
          <div class="form-row-flex">
            <div class="form-group flex-item">
              <label for="modal-year-level-special">Year Level (Optional)</label>
              <select id="modal-year-level-special" v-model="formData.yearLevel" class="form-control form-control-sm"
                :disabled="isLoading">
                <option value="">-- All Years --</option>
                <option v-for="n in 6" :key="`m-s-year-${n}`" :value="n">{{ n }}</option>
              </select>
            </div>
            <div class="form-group flex-item">
              <label for="modal-class-color-special">Color</label>
              <input type="color" id="modal-class-color-special" v-model="formData.color"
                class="form-control form-control-sm form-control-color" :disabled="isLoading">
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="closeModal" type="button" class="btn btn-secondary btn-sm" :disabled="isLoading">
            Close
          </button>
          <button type="submit" class="btn btn-primary btn-sm" :disabled="isLoading">
            {{ isLoading ? (isEditing ? 'Updating...' : 'Adding...') : (isEditing ? 'Save Changes' : 'Add Class') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { useStore } from 'vuex';

const store = useStore();
const modalName = 'classFormModal'; // Unique name for this modal

// --- State ---
const isLoading = ref(false); // Loading state for Add/Update operations
const formError = ref(null); // Stores form-specific error messages

// Reactive object to hold the form data
const formData = reactive({
  id: null, // Will be populated if editing
  classType: 'numbered', // Default type
  classNumber: '',
  yearLevel: '',
  className: '',
  color: '#FFFFFF' // Default color
});

// --- Computed Properties ---
// Get data passed to the modal (null for Add, class object for Edit)
const modalData = computed(() => store.getters['ui/getModalData'](modalName));
// Determine if the modal is in 'Edit' mode
const isEditing = computed(() => !!formData.id); // True if formData has an ID

// --- Watchers ---
// Watch for changes in modalData (when the modal is opened or data changes)
watch(modalData, (newData) => {
  formError.value = null; // Clear previous errors
  if (newData && typeof newData === 'object' && newData.id) {
    // EDIT MODE: Populate form with existing data
    formData.id = newData.id;
    formData.classType = newData.classType || 'numbered'; // Use existing type (shouldn't change)
    formData.classNumber = newData.classNumber || '';
    formData.yearLevel = newData.yearLevel || '';
    formData.className = newData.className || '';
    formData.color = newData.color || '#FFFFFF'; // Use existing color or default
    console.log("ClassFormModal received EDIT data:", { ...formData }); // Log a copy
  } else {
    // ADD MODE: Reset form fields to defaults
    resetForm();
    console.log("ClassFormModal opened in ADD mode.");
  }
}, { immediate: true, deep: true }); // Run immediately and watch nested changes

// --- Methods ---

// Reset fields specific to class type when radio button changes
const resetConditionalFields = () => {
  formData.classNumber = '';
  formData.className = '';
  // Keep yearLevel as it might be used by special type now
  formError.value = null; // Clear errors on type change
};

// Reset the entire form to its initial state (for Add mode)
const resetForm = () => {
  formData.id = null;
  formData.classType = 'numbered';
  formData.classNumber = '';
  formData.yearLevel = '';
  formData.className = '';
  formData.color = '#FFFFFF'; // Reset color to default
  formError.value = null;
  console.log("Class form reset.");
};

// Close the modal by dispatching action to UI store
const closeModal = () => {
  if (isLoading.value) return; // Prevent closing while loading
  store.dispatch('ui/closeModal', modalName);
};

// Helper to quickly set className for special types
const setClassName = (name) => {
  formData.className = name;
};

// Handle form submission (dispatches either Add or Update action)
const handleSubmit = async () => {
  isLoading.value = true; // Set loading state
  formError.value = null; // Clear previous errors

  // Prepare the data payload based on current form values
  let dataToSend = {
    // Send classType for backend validation (though it shouldn't change on edit)
    classType: formData.classType,
    yearLevel: formData.yearLevel || null, // Send null if year level is empty string
    color: formData.color
  };

  // --- Validation and adding type-specific fields ---
  if (formData.classType === 'numbered') {
    if (!formData.classNumber || !formData.yearLevel) { // Both are required for numbered
      formError.value = "Please select Class Number and Year Level for numbered classes.";
      isLoading.value = false; return; // Stop submission
    }
    dataToSend.classNumber = formData.classNumber;
    dataToSend.className = null; // Ensure className is null
  } else if (formData.classType === 'special') {
    if (!formData.className || formData.className.trim() === '') { // Name is required for special
      formError.value = "Please enter a name for the special class.";
      isLoading.value = false; return; // Stop submission
    }
    dataToSend.className = formData.className.trim();
    dataToSend.classNumber = null; // Ensure number is null
    // yearLevel is already included if set
  } else {
    formError.value = "Invalid class type selected."; // Should not happen with radio buttons
    isLoading.value = false; return; // Stop submission
  }
  // Validate color format
  if (formData.color && !/^#[0-9A-F]{6}$/i.test(formData.color)) {
    formError.value = 'Invalid color format. Use hex #RRGGBB.';
    isLoading.value = false; return; // Stop submission
  }
  // --- End Validation ---

  try {
    if (isEditing.value) {
      // --- Dispatch Update Action ---
      console.log(`Dispatching updateClass for ID ${formData.id} with data:`, dataToSend);
      // Call the updateClass action in the classes store module
      await store.dispatch('classes/updateClass', { id: formData.id, data: dataToSend });
      // Close modal after successful update, using nextTick for reactivity
      nextTick(closeModal);
    } else {
      // --- Dispatch Add Action ---
      console.log(`Dispatching addClass with data:`, dataToSend);
      await store.dispatch('classes/addClass', dataToSend);
      resetForm(); // Reset form after adding, ready for another entry
      // Keep modal open after adding
    }
  } catch (error) {
    // Handle errors from the dispatched action
    formError.value = error.message || `Failed to ${isEditing.value ? 'update' : 'add'} class.`;
    console.error(`Error ${isEditing.value ? 'updating' : 'adding'} class:`, error);
  } finally {
    isLoading.value = false; // Reset loading state
  }
};

// --- Lifecycle Hooks ---
// Handle Escape key press to close modal
const handleEscapeKey = (event) => { if (event.key === 'Escape') { closeModal(); } };
onMounted(() => { document.addEventListener('keydown', handleEscapeKey); });
onUnmounted(() => { document.removeEventListener('keydown', handleEscapeKey); });

</script>

<style scoped>
/* Uses global modal styles */
.modal-content {
  min-width: 450px;
  max-width: 600px;
}

.modal-form {
  margin-top: 1rem;
}

h3 {
  margin: 0;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-color);
  font-weight: 600;
  font-size: 1.2rem;
}

hr {
  border: none;
  border-top: 1px solid var(--border-color);
  margin: 1rem 0;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border-color);
  margin-top: 1.5rem;
}

.form-control-sm {
  font-size: 0.9rem;
}

select.form-control-sm {
  height: calc(1.5em + 0.6rem + 2px);
  line-height: 1.5;
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
  width: 50px;
  height: 31px;
  padding: 0.1rem 0.2rem;
  cursor: pointer;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  vertical-align: middle;
}

/* Radio button group styling */
.radio-group {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  align-items: center;
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

.btn-link {
  background: none;
  border: none;
  color: var(--primary);
  text-decoration: underline;
  padding: 0.2rem;
  font-size: 0.8rem;
  cursor: pointer;
  margin-left: 0.5rem;
}

.btn-link:hover {
  color: var(--primary-dark);
}

/* Styles for horizontal layout */
.form-row-flex {
  display: flex;
  flex-wrap: wrap;
  /* Allow wrapping on smaller screens if needed */
  gap: 1rem;
  /* Space between items */
  align-items: flex-end;
  /* Align items to the bottom (useful for label/input pairs) */
  margin-bottom: 0.75rem;
  /* Add margin below the row */
}

.form-row-flex .form-group {
  margin-bottom: 0;
  /* Remove default bottom margin */
  flex: 1 1 auto;
  /* Allow items to grow and shrink */
}

/* Adjust width of specific items if needed */
.form-row-flex .form-group label {
  display: block;
  /* Ensure label is above input */
  margin-bottom: 0.25rem;
  font-size: 0.8rem;
  /* Smaller label */
}

/* Adjust color picker width */
.form-row-flex .form-group input[type="color"] {
  width: 40px;
  /* Smaller width */
  height: 31px;
  /* Match select height */
}

/* Adjust select widths */
.form-row-flex .form-group select {
  min-width: 80px;
  /* Minimum width for selects */
}
</style>
