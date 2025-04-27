<template>
  <div class="panel textbooks-panel">
     <div class="panel-header">
      <h3 class="panel-title">Manage Textbooks</h3>
      <button class="btn btn-sm btn-primary" @click="showAddForm = !showAddForm">
          {{ showAddForm ? 'Cancel' : 'Add Textbook' }}
      </button>
    </div>
    <div class="panel-body">
        <form v-if="showAddForm" @submit.prevent="handleAddTextbook" class="add-form">
            <h4>Add New Textbook</h4>
            <p v-if="addError" class="error-message">{{ addError }}</p>
            <div class="form-group">
                <label for="new-textbook-title">Title</label>
                <input type="text" id="new-textbook-title" v-model="newTextbook.title" required class="form-control form-control-sm">
            </div>
            <div class="form-group">
                <label for="new-textbook-desc">Description</label>
                <textarea id="new-textbook-desc" v-model="newTextbook.description" class="form-control form-control-sm" rows="3"></textarea>
            </div>
            <button type="submit" class="btn btn-success btn-sm" :disabled="isAdding">
                {{ isAdding ? 'Adding...' : 'Save Textbook' }}
            </button>
        </form>

        <div v-if="isLoading" class="loading">Loading textbooks...</div>
       <div v-else-if="fetchError" class="error-message">{{ fetchError }}</div>
      <ul v-else-if="textbooks.length > 0" class="item-list">
         <li v-for="book in textbooks" :key="book.id" class="item">
            <div class="item-details">
                <span class="item-name">{{ book.title }}</span>
                <span v-if="book.description" class="item-meta">{{ truncate(book.description, 100) }}</span>
            </div>
            <div class="item-actions">
               <button class="btn btn-sm btn-secondary" @click="handleEditClick(book)">Edit</button>
               <button
                  class="btn btn-sm btn-danger"
                  @click="handleDeleteTextbook(book.id)"
                  :disabled="deletingTextbookId === book.id"
                >
                   {{ deletingTextbookId === book.id ? 'Deleting...' : 'Del' }}
                </button>
               </div>
         </li>
      </ul>
        <p v-else class="placeholder-content">No textbooks defined yet.</p>
    </div>
    </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useStore } from 'vuex';

const store = useStore();

// --- Component State ---
const showAddForm = ref(false); // Controls visibility of the add form
const isAdding = ref(false); // Tracks if an add operation is in progress
const addError = ref(null); // Stores error messages related to adding a textbook
const deletingTextbookId = ref(null); // Track deleting state for specific button
const deleteError = ref(null); // Track delete errors
const newTextbook = reactive({ // Reactive object for the add form data
    title: '',
    description: ''
});
// Note: editingTextbook and showEditForm refs removed as modal handles its own state

// --- Store State ---
// Computed properties to get data from the Vuex store reactively
const textbooks = computed(() => store.getters['textbooks/allTextbooks']); // Get the list of textbooks
const isLoading = computed(() => store.getters['textbooks/isLoading']); // Get loading state for fetching textbooks
const fetchError = computed(() => store.getters['textbooks/error']); // Get error state from fetching textbooks

// --- Methods ---

// Resets the 'Add Textbook' form fields and error states
const resetForm = () => {
    newTextbook.title = '';
    newTextbook.description = '';
    addError.value = null;
    isAdding.value = false;
};

// Handles the submission of the 'Add Textbook' form
const handleAddTextbook = async () => {
    // Basic validation
    if (!newTextbook.title) {
        addError.value = "Textbook title is required.";
        return;
    }
    // Set loading state and clear previous errors
    isAdding.value = true;
    addError.value = null;

    try {
        // Dispatch action to add the textbook via API
        await store.dispatch('textbooks/addTextbook', { ...newTextbook });
        // Reset form and hide it on success
        resetForm();
        showAddForm.value = false;
    } catch (error) {
        // Set error message if adding fails
        addError.value = error.message || "Failed to add textbook.";
    } finally {
        // Always reset loading state
        isAdding.value = false;
    }
};

// Method to open the edit modal
const handleEditClick = (book) => {
    console.log("Opening edit modal for textbook:", book);
    // Dispatch action to open the modal and pass the textbook data
    store.dispatch('ui/openModal', {
        modalName: 'textbookEditor', // Use the modal name defined in ui.js
        data: book // Pass the textbook object (action will deep copy)
    });
};

// Handles clicking the delete button for a textbook
const handleDeleteTextbook = async (id) => {
    // Show confirmation dialog to the user
    if (!confirm('Are you sure you want to delete this textbook?')) {
        return; // Stop if user cancels
    }

    // Set loading state for the specific delete button being clicked
    deletingTextbookId.value = id;
    deleteError.value = null; // Clear previous delete errors

    try {
        // Dispatch action to delete the textbook via API
        await store.dispatch('textbooks/deleteTextbook', id);
        // Textbook is removed from the list reactively by the store mutation
    } catch (error) {
        // Set error message and show an alert if deleting fails
        deleteError.value = error.message || "Failed to delete textbook.";
        alert(`Error: ${deleteError.value}`); // Using simple alert for now
    } finally {
        // Reset the loading state for the delete button
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
// Fetch textbooks when the component is first mounted, if they aren't already loaded
onMounted(() => {
  if (textbooks.value.length === 0 && !isLoading.value) {
    store.dispatch('textbooks/fetchTextbooks');
  }
});

</script>

<style scoped>
/* Styles for the panel */
.panel-body {
  max-height: 400px; /* Limit panel height and enable scrolling */
  overflow-y: auto;
  padding-top: 0; /* Remove top padding if header is present */
}
/* Styles for the add textbook form */
.add-form {
    padding: 1rem;
    margin-bottom: 1rem;
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius);
    background-color: var(--light); /* Light background for the form */
}
.add-form h4 {
    margin-top: 0;
    margin-bottom: 1rem;
    font-size: 1rem;
    font-weight: 600;
}
/* Smaller form control styles */
.form-control-sm {
    font-size: 0.875rem;
    padding: 0.3rem 0.6rem;
}
textarea.form-control-sm {
    line-height: 1.5; /* Ensure textarea line height is reasonable */
}
.add-form .form-group {
    margin-bottom: 0.75rem; /* Space between form groups */
}

/* Styles for the list of textbooks */
.item-list {
  list-style: none; /* Remove default bullet points */
  padding: 0;
  margin: 0;
}
.item {
  display: flex; /* Arrange details and actions side-by-side */
  justify-content: space-between; /* Push details and actions apart */
  align-items: center; /* Vertically align items */
  padding: 0.6rem 0.2rem;
  border-bottom: 1px solid var(--border-color); /* Separator line */
}
.item:last-child {
  border-bottom: none; /* Remove border from last item */
}
.item-details {
    display: flex;
    flex-direction: column; /* Stack name and meta vertically */
    gap: 0.1rem;
    flex-grow: 1; /* Allow details to take up available space */
    min-width: 0; /* Required for text-overflow to work correctly in flex items */
    margin-right: 0.5rem; /* Space between details and action buttons */
}
.item-name {
    font-weight: 500;
    white-space: nowrap; /* Prevent wrapping */
    overflow: hidden; /* Hide overflow */
    text-overflow: ellipsis; /* Show ellipsis (...) for overflow */
}
.item-meta {
    font-size: 0.8rem;
    color: var(--secondary); /* Use secondary text color */
    white-space: normal; /* Allow description text to wrap */
    overflow: hidden; /* Hide overflow */
    /* text-overflow: ellipsis; */ /* Ellipsis might not be desired for wrapped text */
    display: -webkit-box; /* Optional: Limit description to N lines with ellipsis */
   -webkit-line-clamp: 2; /* Limit to 2 lines */
   -webkit-box-orient: vertical;
}
.item-actions {
   display: flex;
   gap: 0.5rem; /* Space between action buttons */
   flex-shrink: 0; /* Prevent action buttons from shrinking */
}
/* Smaller button style */
.btn-sm {
  padding: 0.2rem 0.5rem;
  font-size: 0.75rem;
}
/* Styles for loading/error/placeholder messages */
.loading, .error-message, .placeholder-content {
    padding: 1rem;
    text-align: center;
    color: var(--secondary);
    font-size: 0.9rem;
}
.error-message {
    color: var(--danger); /* Use danger color for errors */
    background-color: #f8d7da; /* Light red background */
    border: 1px solid #f5c6cb; /* Reddish border */
    border-radius: var(--border-radius);
    margin-bottom: 1rem; /* Space below error message */
}
/* Style for disabled action buttons */
.btn-danger:disabled, .btn-secondary:disabled {
    cursor: not-allowed; /* Indicate non-interactive state */
    opacity: 0.65; /* Make it look faded */
}
</style>

