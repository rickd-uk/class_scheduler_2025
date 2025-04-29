<template>
  <div class="modal-overlay" @click.self="closeModal">
    <div class="modal-content">
      <button @click="closeModal" class="modal-close-btn">&times;</button>
      <h3>Link Textbook to Class</h3>
      <p v-if="classData">
        Linking to: <strong>Year {{ classData.yearLevel }} - Class {{ classData.classNumber }}</strong>
      </p>
      <hr>

      <div class="modal-body">
        <div v-if="isLoading" class="loading">Loading available textbooks...</div>
        <div v-else-if="linkError" class="error-message">{{ linkError }}</div>
        <div v-else>
          <div class="form-group">
            <label for="link-textbook-select">Select Textbook to Link:</label>
            <select
              id="link-textbook-select"
              v-model="selectedTextbookId"
              class="form-control form-control-sm"
              required
            >
              <option value="" disabled>-- Select a Textbook --</option>
              <option v-if="availableTextbooks.length === 0" disabled>
                (No available textbooks to link)
              </option>
              <option v-for="book in availableTextbooks" :key="book.id" :value="book.id">
                {{ book.title }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button @click="closeModal" type="button" class="btn btn-secondary btn-sm" :disabled="isLinking">
          Cancel
        </button>
        <button
          @click="handleLinkTextbook"
          class="btn btn-primary btn-sm"
          :disabled="!selectedTextbookId || isLinking"
        >
          {{ isLinking ? 'Linking...' : 'Link Textbook' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { useStore } from 'vuex';

const store = useStore();
const modalName = 'linkTextbookModal'; // Unique name for this modal

// --- State ---
const selectedTextbookId = ref(''); // Holds the ID of the textbook selected in the dropdown
const isLinking = ref(false); // Loading state for the link operation
const linkError = ref(null); // Error specific to linking in the modal

// --- Computed Properties ---
// Get the class data passed when the modal was opened
const classData = computed(() => store.getters['ui/getModalData'](modalName));
// Get the full list of all textbooks from the store
const allTextbooks = computed(() => store.getters['textbooks/allTextbooks']);
// Check if textbooks are still loading
const isLoading = computed(() => store.getters['textbooks/isLoading']);

// Filter the list of all textbooks to show only those *not* already linked to the current class
const availableTextbooks = computed(() => {
  if (!classData.value || !allTextbooks.value) {
    return []; // Return empty if data isn't ready
  }
  // Create a Set of IDs for quick lookup of already linked books
  const linkedIds = new Set(classData.value.textbooks?.map(tb => tb.id) || []);
  // Filter the main textbook list
  return allTextbooks.value.filter(book => !linkedIds.has(book.id));
});

// --- Watchers ---
// Reset selection when the modal is opened with new class data
watch(classData, (newClass) => {
    selectedTextbookId.value = ''; // Reset dropdown
    linkError.value = null; // Clear previous errors
    // Ensure all textbooks are loaded if they aren't already
    // This is important if the user opens the link modal before the main list has loaded
    if (allTextbooks.value.length === 0 && !isLoading.value) {
        console.log("[LinkTextbookModal] Fetching all textbooks for linking.");
        store.dispatch('textbooks/fetchTextbooks');
    }
}, { immediate: true }); // Run immediately when the modal opens/component mounts

// --- Methods ---

// Close the modal
const closeModal = () => {
  if (isLinking.value) return; // Prevent closing during operation
  store.dispatch('ui/closeModal', modalName);
};

// Handle clicking the "Link Textbook" button
const handleLinkTextbook = async () => {
  // Validate selection
  if (!selectedTextbookId.value || !classData.value?.id) {
    linkError.value = "Please select a textbook to link.";
    return;
  }

  // Set loading state and clear errors
  isLinking.value = true;
  linkError.value = null;

  try {
    // Dispatch the action from the 'classes' module to link the textbook
    await store.dispatch('classes/linkTextbook', {
      classId: classData.value.id,
      textbookId: selectedTextbookId.value
    });
    nextTick(() => {
      closeModal(); // Close modal on success
    })
  } catch (error) {
    // Display error if linking fails
    linkError.value = error.message || "Failed to link textbook.";
    console.error("Error linking textbook in modal:", error);
  } finally {
    // Reset loading state
    isLinking.value = false;
  }
};

// --- Lifecycle Hooks (Optional: Esc key to close) ---
const handleEscapeKey = (event) => {
    if (event.key === 'Escape') {
        closeModal();
    }
};
onMounted(() => { document.addEventListener('keydown', handleEscapeKey); });
onUnmounted(() => { document.removeEventListener('keydown', handleEscapeKey); });

</script>

<style scoped>
/* Uses global modal styles from main.css */
.modal-content {
    min-width: 450px; /* Adjust width */
    max-width: 600px;
}
.modal-body {
    margin-top: 1rem;
    margin-bottom: 1.5rem;
    min-height: 100px; /* Ensure space for dropdown/loading message */
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
p strong { /* Style the class name display */
    font-weight: 600;
    color: var(--primary);
}
.modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--border-color);
    margin-top: 1.5rem;
}
.form-control-sm { /* Style for the select dropdown */
    font-size: 0.9rem;
}
.loading { /* Style for loading message */
    text-align: center;
    padding: 1rem;
    color: var(--secondary);
}
.error-message { /* Style for error message */
    color: var(--danger);
    background-color: #f8d7da;
    border: 1px solid #f5c6cb;
    border-radius: var(--border-radius);
    padding: 0.5rem 0.8rem;
    margin-bottom: 1rem;
    font-size: 0.875rem;
}
.btn-primary:disabled { /* Style for disabled button */
    cursor: not-allowed;
    opacity: 0.65;
}
</style>

