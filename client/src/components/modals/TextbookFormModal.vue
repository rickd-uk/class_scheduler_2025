<template>
  <div class="modal-overlay" @click.self="closeModal">
    <div class="modal-content">
      <button @click="closeModal" class="modal-close-btn">&times;</button>
      <h3>{{ isEditing ? 'Edit Textbook' : 'Add New Textbook' }}</h3>

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
            Cancel
          </button>
          <button type="submit" class="btn btn-primary btn-sm" :disabled="isLoading">
            {{ isLoading ? (isEditing ? 'Updating...' : 'Adding...') : (isEditing ? 'Save Changes' : 'Add Textbook') }}
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
// Define a consistent modal name to be used in the UI store and parent component
const modalName = 'textbookFormModal';

// --- State ---
const isLoading = ref(false); // Loading state for add/update operation
const formError = ref(null); // Error specific to the form submission

// Reactive object to hold the form data (title, description)
// We'll also store the ID if we are editing
const formData = reactive({
  id: null,
  title: '',
  description: ''
});

// --- Computed Properties ---
// Get the data passed when the modal was opened from the UI store
const modalData = computed(() => store.getters['ui/getModalData'](modalName));
// Determine if the modal is in 'Edit' mode based on whether data (with an ID) was passed
const isEditing = computed(() => !!formData.id);

// --- Watchers ---
// Watch for changes in modalData (when the modal is opened with new data)
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
    formData.id = null;
    formData.title = '';
    formData.description = '';
    console.log("TextbookFormModal opened in ADD mode.");
  }
}, { immediate: true, deep: true }); // Run immediately and watch nested properties

// --- Methods ---

// Close the modal by dispatching action to the UI store
const closeModal = () => {
  if (isLoading.value) return; // Prevent closing while loading
  store.dispatch('ui/closeModal', modalName);
};

// Handle form submission (either Add or Update)
const handleSubmit = async () => {
  // Basic validation
  if (!formData.title) {
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
          title: formData.title,
          description: formData.description
        }
      });
    } else {
      // --- Add New Textbook ---
      await store.dispatch('textbooks/addTextbook', {
        title: formData.title,
        description: formData.description
      });
    }
    closeModal(); // Close modal on successful add/update
  } catch (error) {
    formError.value = error.message || `Failed to ${isEditing.value ? 'update' : 'add'} textbook.`;
    console.error(`Error ${isEditing.value ? 'updating' : 'adding'} textbook in modal:`, error);
  } finally {
    isLoading.value = false; // Reset loading state
  }
};

// --- Lifecycle Hooks (Optional: for keyboard shortcuts like Esc) ---
const handleEscapeKey = (event) => {
    if (event.key === 'Escape') {
        closeModal();
    }
};

onMounted(() => {
    document.addEventListener('keydown', handleEscapeKey);
});

onUnmounted(() => {
    document.removeEventListener('keydown', handleEscapeKey);
});

</script>

<style scoped>
/* Uses global modal styles from main.css */
/* Add specific styles if needed */
.modal-content {
    min-width: 400px; /* Adjust width as needed */
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
.modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--border-color);
    margin-top: 1.5rem;
}
/* Ensure form controls inside modal have reasonable size */
.form-control-sm {
    font-size: 0.9rem;
}
textarea.form-control-sm {
    line-height: 1.5;
}
/* Error message styling */
.error-message {
    color: var(--danger);
    background-color: #f8d7da;
    border: 1px solid #f5c6cb;
    border-radius: var(--border-radius);
    padding: 0.5rem 0.8rem;
    margin-bottom: 1rem;
    font-size: 0.875rem;
}
/* Style for disabled submit button */
.btn-primary:disabled {
    cursor: not-allowed;
    opacity: 0.65;
}
</style>

