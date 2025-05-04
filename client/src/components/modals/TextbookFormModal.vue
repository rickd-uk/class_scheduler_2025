<template>
  <div class="modal-overlay" @click.self="closeModal">
    <div class="modal-content">
      <button @click="closeModal" class="modal-close-btn">&times;</button>
      <h3>{{ isEditing ? 'Edit Textbook' : 'Add New Textbook' }}</h3>
      <hr>

      <form @submit.prevent="handleSubmit" class="modal-form">
        <p v-if="formError" class="error-message">{{ formError }}</p>

        <div class="form-group">
          <label for="textbook-title">Title</label>
          <input
            type="text"
            id="textbook-title"
            v-model="formData.title"
            required
            class="form-control form-control-sm"
            :disabled="isLoading"
          />
        </div>

        <div class="form-group">
          <label for="textbook-desc">Description</label>
          <textarea
            id="textbook-desc"
            v-model="formData.description"
            class="form-control form-control-sm"
            rows="4"
            :disabled="isLoading"
          ></textarea>
        </div>

        <div class="modal-footer">
          <button @click="closeModal" type="button" class="btn btn-secondary btn-sm" :disabled="isLoading">
            Close </button>
          <button type="submit" class="btn btn-primary btn-sm" :disabled="isLoading">
            {{ isLoading ? (isEditing ? 'Updating...' : 'Adding...') : (isEditing ? 'Save Changes' : 'Add Textbook') }}
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
// Define a consistent modal name
const modalName = 'textbookFormModal';

// --- State ---
const isLoading = ref(false); // Loading state for add/update operation
const formError = ref(null); // Error specific to the form submission

// Reactive object to hold the form data
const formData = reactive({
  id: null,
  title: '',
  description: ''
});

// Function to reset form fields
const resetForm = () => {
    formData.id = null;
    formData.title = '';
    formData.description = '';
    formError.value = null; // Also clear errors
    console.log("Textbook form reset.");
};

// --- Computed Properties ---
// Get the data passed when the modal was opened from the UI store
const modalData = computed(() => store.getters['ui/getModalData'](modalName));
// Determine if the modal is in 'Edit' mode based on whether data (with an ID) was passed
const isEditing = computed(() => !!formData.id);

// --- Watchers ---
// Watch for changes in modalData (when the modal is opened)
watch(modalData, (newData) => {
  formError.value = null; // Clear errors when modal opens or data changes
  if (newData && typeof newData === 'object' && newData.id) {
    // EDIT MODE: Populate form with existing data
    formData.id = newData.id;
    formData.title = newData.title || '';
    formData.description = newData.description || '';
    console.log("TextbookFormModal received EDIT data:", { ...formData });
  } else {
    // ADD MODE: Reset form fields
    resetForm(); // Call reset function for add mode
    console.log("TextbookFormModal opened in ADD mode.");
  }
}, { immediate: true, deep: true });

// --- Methods ---


// Close the modal by dispatching action to the UI store
const closeModal = () => {
  if (isLoading.value) return; // Prevent closing while loading
  store.dispatch('ui/closeModal', modalName);
};

// Handle form submission (either Add or Update)
const handleSubmit = async () => {
  // Basic validation
  if (!formData.title || formData.title.trim() === '') {
    formError.value = "Textbook title cannot be empty.";
    return;
  }

  isLoading.value = true;
  formError.value = null;

  try {
    if (isEditing.value) {
      // --- Update Existing Textbook ---
      await store.dispatch('textbooks/updateTextbook', {
        id: formData.id,
        data: { // Send only the fields that can be updated
          title: formData.title.trim(),
          description: formData.description
        }
      });
       nextTick(closeModal); // Close modal after saving changes
    } else {
      // --- Add New Textbook ---
      await store.dispatch('textbooks/addTextbook', {
        title: formData.title.trim(),
        description: formData.description
      });
      resetForm(); // Reset form after adding, ready for another entry
      // Keep modal open after adding
      // closeModal(); // Don't close automatically after adding
    }
  } catch (error) {
    formError.value = error.message || `Failed to ${isEditing.value ? 'update' : 'add'} textbook.`;
    console.error(`Error ${isEditing.value ? 'updating' : 'adding'} textbook in modal:`, error);
  } finally {
    isLoading.value = false; // Reset loading state
  }
};

// --- Lifecycle Hooks (Optional: for keyboard shortcuts like Esc) ---
const handleEscapeKey = (event) => { if (event.key === 'Escape') { closeModal(); } };
onMounted(() => { document.addEventListener('keydown', handleEscapeKey); });
onUnmounted(() => { document.removeEventListener('keydown', handleEscapeKey); });

</script>

<style scoped>
/* Uses global modal styles from main.css */
.modal-content { min-width: 400px; max-width: 600px; }
.modal-form { margin-top: 1rem; }
h3 { margin: 0; padding-bottom: 1rem; border-bottom: 1px solid var(--border-color); font-weight: 600; font-size: 1.2rem; }
hr { border: none; border-top: 1px solid var(--border-color); margin: 1rem 0; }
.modal-footer { display: flex; justify-content: flex-end; gap: 0.75rem; padding-top: 1.5rem; border-top: 1px solid var(--border-color); margin-top: 1.5rem; }
.form-control-sm { font-size: 0.9rem; }
textarea.form-control-sm { line-height: 1.5; }
.error-message { color: var(--danger); background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: var(--border-radius); padding: 0.5rem 0.8rem; margin-bottom: 1rem; font-size: 0.875rem; }
.btn-primary:disabled, .btn-secondary:disabled { cursor: not-allowed; opacity: 0.65; }
.modal-footer .btn-sm { padding: 0.35rem 0.8rem; font-size: 0.875rem; }
</style>

