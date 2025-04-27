<template>
  <div class="modal-overlay" @click.self="closeModal">
    <div class="modal-content">
      <button @click="closeModal" class="modal-close-btn">&times;</button>
      <h3>Edit Textbook</h3>

      <form @submit.prevent="handleUpdateTextbook" class="modal-form">
        <p v-if="editError" class="error-message">{{ editError }}</p>

        <div class="form-group">
          <label for="edit-textbook-title">Title</label>
          <input
            type="text"
            id="edit-textbook-title"
            v-model="editableTextbook.title"
            required
            class="form-control form-control-sm"
            :disabled="isUpdating"
          />
        </div>

        <div class="form-group">
          <label for="edit-textbook-desc">Description</label>
          <textarea
            id="edit-textbook-desc"
            v-model="editableTextbook.description"
            class="form-control form-control-sm"
            rows="4"
            :disabled="isUpdating"
          ></textarea>
        </div>

        <div class="modal-footer">
          <button @click="closeModal" type="button" class="btn btn-secondary btn-sm" :disabled="isUpdating">
            Cancel
          </button>
          <button type="submit" class="btn btn-primary btn-sm" :disabled="isUpdating">
            {{ isUpdating ? 'Updating...' : 'Save Changes' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
// Import nextTick from vue
import { ref, reactive, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { useStore } from 'vuex';

const store = useStore();
const modalName = 'textbookEditor'; // Unique name for this modal

// --- State ---
const isUpdating = ref(false); // Loading state for the update operation
const editError = ref(null); // Error specific to editing in the modal

// Reactive object to hold the editable textbook data
const editableTextbook = reactive({
  id: null,
  title: '',
  description: ''
});

// --- Computed Properties ---
const modalData = computed(() => store.getters['ui/getModalData'](modalName));

// --- Watchers ---
watch(modalData, (newData) => {
  editError.value = null;
  if (newData && typeof newData === 'object') {
    editableTextbook.id = newData.id;
    editableTextbook.title = newData.title || '';
    editableTextbook.description = newData.description || '';
    console.log("TextbookEditorModal received data:", editableTextbook);
  } else {
    editableTextbook.id = null;
    editableTextbook.title = '';
    editableTextbook.description = '';
  }
}, { immediate: true });

// --- Methods ---

// Close the modal by dispatching action to the UI store
const closeModal = () => {
  // Use the correct variable name 'isUpdating' here
  if (isUpdating.value) return; // Prevent closing while updating
  console.log(`[${modalName}] closeModal method called.`); // Keep log for debugging if needed
  store.dispatch('ui/closeModal', modalName);
};

// Handle form submission
const handleUpdateTextbook = async () => {
  if (!editableTextbook.title) {
    editError.value = "Textbook title cannot be empty.";
    return;
  }
  isUpdating.value = true;
  editError.value = null;
  try {
    // Dispatch the update action from the textbooks store module
    await store.dispatch('textbooks/updateTextbook', {
      id: editableTextbook.id,
      data: {
        title: editableTextbook.title,
        description: editableTextbook.description
      }
    });
    console.log("[TextbookEditorModal] Update dispatch successful. Calling closeModal via nextTick..."); // Updated Log
    // Wrap closeModal in nextTick
    nextTick(() => {
        closeModal(); // Close modal after the next DOM update cycle
    });
  } catch (error) {
    editError.value = error.message || "Failed to update textbook.";
    console.error("Error updating textbook in modal:", error);
  } finally {
    // It might be better to set isUpdating to false *after* the modal is closed
    // but for now, let's keep it here. If issues persist, we can move it inside nextTick after closeModal.
    isUpdating.value = false; // Reset loading state
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
.modal-content { min-width: 400px; max-width: 600px; }
.modal-form { margin-top: 1rem; }
h3 { margin: 0; padding-bottom: 1rem; border-bottom: 1px solid var(--border-color); font-weight: 600; font-size: 1.2rem; }
.modal-footer { display: flex; justify-content: flex-end; gap: 0.75rem; padding-top: 1.5rem; border-top: 1px solid var(--border-color); margin-top: 1.5rem; }
.form-control-sm { font-size: 0.9rem; }
textarea.form-control-sm { line-height: 1.5; }
.error-message { color: var(--danger); background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: var(--border-radius); padding: 0.5rem 0.8rem; margin-bottom: 1rem; font-size: 0.875rem; }
.btn-primary:disabled { cursor: not-allowed; opacity: 0.65; }
</style>

