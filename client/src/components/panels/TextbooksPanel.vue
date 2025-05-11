<template>
  <CollapsiblePanel>
    <template #header>
      <h3 class="panel-title">Textbooks</h3>
    </template>
    <template #actions>
      <button class="btn btn-sm btn-primary" @click="openAddModal">+</button>
    </template>
    <template #body>
      <div class="panel-body">
        <div v-if="isLoading" class="loading">Loading textbooks…</div>
        <div v-else-if="fetchError" class="error-message">{{ fetchError }}</div>
        <ul v-else-if="textbooks.length" class="item-list">
          <li v-for="book in textbooks" :key="book.id" class="item">
            <div class="item-details">
              <span class="item-name">{{ book.title }}</span>
              <span v-if="book.description" class="item-meta">{{ truncate(book.description, 100) }}</span>
            </div>
            <div class="item-actions">
              <button class="btn btn-sm btn-secondary" @click="openEditModal(book)">Edit</button>
              <button class="btn btn-sm btn-danger" @click="handleDeleteTextbook(book.id)"
                :disabled="deletingTextbookId === book.id">Del</button>
            </div>
          </li>
        </ul>
        <p v-else class="placeholder-content">No textbooks defined yet. Click 'Add Textbook' to start.</p>
      </div>
    </template>
  </CollapsiblePanel>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'; // Removed reactive as newTextbook is gone
import { useStore } from 'vuex';
import CollapsiblePanel from './CollapsiblePanel.vue';

const store = useStore();

// --- Component State ---
// Removed state related to inline add form: showAddForm, isAdding, addError, newTextbook
const deletingTextbookId = ref(null); // Track deleting state for specific button
const deleteError = ref(null); // Track delete errors

// --- Store State ---
// Computed properties to get data from the Vuex store reactively
const textbooks = computed(() => store.getters['textbooks/allTextbooks']); // Get the list of textbooks
const isLoading = computed(() => store.getters['textbooks/isLoading']); // Get loading state
const fetchError = computed(() => store.getters['textbooks/error']); // Get error state

// --- Methods ---

// Removed resetForm and handleAddTextbook methods as they are handled by the modal

// Method to open the modal for adding a new textbook
const openAddModal = () => {
  console.log("Opening textbook modal in ADD mode");
  store.dispatch('ui/openModal', {
    modalName: 'textbookFormModal', // Use the reusable modal name
    data: null // Pass null data to indicate 'Add' mode
  });
};

// Method to open the modal for editing an existing textbook (renamed from handleEditClick)
const openEditModal = (book) => {
  console.log("Opening textbook modal in EDIT mode for:", book);
  store.dispatch('ui/openModal', {
    modalName: 'textbookFormModal', // Use the reusable modal name
    data: book // Pass the existing textbook data (action will deep copy)
  });
};

// Handles clicking the delete button for a textbook
const handleDeleteTextbook = async (id) => {
  // Confirmation dialog (consider replacing with custom later)
  //if (!confirm('Are you sure you want to delete this textbook?')) {
  //   return; // Stop if user cancels
  //}
  // Set loading state for the specific delete button being clicked
  deletingTextbookId.value = id;
  deleteError.value = null; // Clear previous delete errors
  try {
    // Dispatch action to delete the textbook via API and update store
    await store.dispatch('textbooks/deleteTextbook', id);
    // Textbook is removed reactively by the store mutation
  } catch (error) {
    // Set error message and show an alert
    deleteError.value = error.message || "Failed to delete textbook.";
    alert(`Error: ${deleteError.value}`); // Simple alert for now
  } finally {
    // Reset loading state for the button
    deletingTextbookId.value = null;
  }
};

// Helper function to truncate long descriptions for display
const truncate = (text, length) => {
  if (!text) return ''; // Return empty string if no text
  // If text is longer than specified length, shorten and add ellipsis
  return text.length > length ? text.substring(0, length) + '...' : text;
}

// --- Lifecycle Hook ---
// Fetch textbooks when the component is first mounted if they aren't already loaded
onMounted(() => {
  if (textbooks.value.length === 0 && !isLoading.value) {
    store.dispatch('textbooks/fetchTextbooks');
  }
});

</script>

<style scoped>
/* Styles remain largely the same, remove styles specific to .add-form if desired */
.panel-body {
  max-height: 400px;
  overflow-y: auto;
  padding-top: 0;
}

/* .add-form styles can be removed */
.item-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.6rem 0.2rem;
  border-bottom: 1px solid var(--border-color);
}

.item:last-child {
  border-bottom: none;
}

.item-details {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  flex-grow: 1;
  min-width: 0;
  margin-right: 0.5rem;
}

.item-name {
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-meta {
  font-size: 0.8rem;
  color: var(--secondary);
  white-space: normal;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.item-actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}

.btn-sm {
  padding: 0.2rem 0.5rem;
  font-size: 0.75rem;
}

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
  margin-bottom: 1rem;
}

.btn-danger:disabled,
.btn-secondary:disabled {
  cursor: not-allowed;
  opacity: 0.65;
}

/* Added styles */
.color-square {
  display: inline-block;
  width: 1em;
  height: 1em;
  border: 1px solid #ccc;
  margin-right: 0.5em;
  vertical-align: middle;
  flex-shrink: 0;
}

.item {
  align-items: center;
}

/* Ensure vertical alignment with color square */
</style>
