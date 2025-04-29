<template>
  <div class="modal-overlay" @click.self="closeModal">
    <div class="modal-content">
      <button @click="closeModal" class="modal-close-btn">&times;</button>
      <h3>Edit Day Off Reason</h3>
      <p v-if="dayOffData">Editing for: <strong>{{ formatDateForTitle(dayOffData.date) }}</strong></p>
      <hr>

      <form @submit.prevent="handleUpdate" class="modal-form">
        <p v-if="editError" class="error-message">{{ editError }}</p>

        <div class="form-group">
          <label for="edit-dayoff-reason">Reason</label>
          <input
            type="text"
            id="edit-dayoff-reason"
            v-model="editableData.reason"
            class="form-control form-control-sm"
            placeholder="e.g., Holiday, Personal (Optional)"
            :disabled="isUpdating"
          />
        </div>
        <div class="form-group">
           <label for="edit-dayoff-color">Color</label>
           <input
             type="color"
             id="edit-dayoff-color"
             v-model="editableData.color"
             class="form-control form-control-sm form-control-color"
             :disabled="isUpdating"
            >
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
// Import nextTick along with other Vue functions
import { ref, reactive, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { useStore } from 'vuex';

const store = useStore();
const modalName = 'dayOffEditor'; // Unique name for this modal

// --- State ---
const isUpdating = ref(false); // Loading state for the update operation
const editError = ref(null); // Error specific to editing in the modal
// Use reactive object for editable fields (reason and color)
const editableData = reactive({
    reason: '',
    color: '#F0F0F0' // Default color
});

// --- Computed Properties ---
// Get the data passed to this modal instance from the UI store state
const dayOffData = computed(() => store.getters['ui/getModalData'](modalName));

// --- Watchers ---
// Populate the form when the modal data changes (modal opens)
watch(dayOffData, (newData) => {
  editError.value = null; // Clear previous errors
  if (newData && typeof newData === 'object') {
    // Populate reactive object with data from the selected day off
    editableData.reason = newData.reason || '';
    editableData.color = newData.color || '#F0F0F0'; // Populate color or use default
    console.log("DayOffEditorModal received data:", newData);
  } else {
    // Reset form fields if no valid data is passed
    editableData.reason = '';
    editableData.color = '#F0F0F0'; // Reset to default
  }
}, { immediate: true }); // 'immediate: true' ensures the watcher runs once when the component mounts

// --- Methods ---

// Closes the modal by dispatching the 'closeModal' action to the UI store
const closeModal = () => {
  if (isUpdating.value) return; // Prevent closing if an update is in progress
  store.dispatch('ui/closeModal', modalName);
};

// Handles the submission of the edit form
const handleUpdate = async () => {
  // Ensure we have the necessary data (especially the date) from the original dayOffData
  if (!dayOffData.value || !dayOffData.value.date) {
      editError.value = "Cannot update: Missing day off data.";
      return;
  }

  // Set loading state and clear errors
  isUpdating.value = true;
  editError.value = null;

  try {
    // Dispatch the 'updateDayOff' action from the 'daysOff' store module
    // Pass the date to identify the record and the updated data (reason and color)
    await store.dispatch('daysOff/updateDayOff', {
      date: dayOffData.value.date, // Get the date from the passed data
      data: {
          reason: editableData.reason, // Send updated reason
          color: editableData.color    // Send updated color
      }
    });
    console.log("[DayOffEditorModal] Update dispatch successful. Calling closeModal via nextTick...");
    // Use nextTick to ensure state updates potentially complete before closing
    nextTick(() => {
        closeModal(); // Close modal on successful update
    });
  } catch (error) {
    // Display error message if update fails
    editError.value = error.message || "Failed to update reason.";
    console.error("Error updating day off reason:", error);
  } finally {
    // Always reset loading state
    isUpdating.value = false;
  }
};

// Helper function to format date for the title display
const formatDateForTitle = (dateString) => {
    if (!dateString) return 'Invalid Date';
    try {
        // Add T00:00:00 to ensure local timezone interpretation
        const date = new Date(dateString + 'T00:00:00');
        if (isNaN(date.getTime())) return 'Invalid Date';
        // Format using locale options
        return date.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    } catch (e) { return 'Invalid Date'; }
}

// --- Lifecycle Hooks (Optional: Add keyboard shortcut listener for Esc key) ---
// Function to handle the Escape key press
const handleEscapeKey = (event) => {
    if (event.key === 'Escape') {
        closeModal(); // Close modal if Escape key is pressed
    }
};
// Add the event listener when the component mounts
onMounted(() => {
    document.addEventListener('keydown', handleEscapeKey);
});
// Remove the event listener when the component unmounts to prevent memory leaks
onUnmounted(() => {
    document.removeEventListener('keydown', handleEscapeKey);
});

</script>

<style scoped>
/* Uses global modal styles defined in main.css */
.modal-content {
    min-width: 350px; /* Adjust width as needed */
    max-width: 500px;
}
.modal-form {
    margin-top: 1rem; /* Space between title/hr and form */
}
h3 {
    margin: 0;
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--border-color); /* Separator below title */
    font-weight: 600;
    font-size: 1.2rem;
}
p strong { /* Style for the date display */
    font-weight: 600;
    color: var(--primary);
}
hr {
    border: none;
    border-top: 1px solid var(--border-color);
    margin: 1rem 0; /* Space around horizontal rule */
}
.modal-footer {
    display: flex;
    justify-content: flex-end; /* Align buttons to the right */
    gap: 0.75rem; /* Increased gap between buttons */
    padding-top: 1.5rem; /* More padding above buttons */
    border-top: 1px solid var(--border-color); /* Separator above footer */
    margin-top: 1.5rem; /* More margin above footer */
}
/* Ensure form controls inside modal have reasonable size */
.form-control-sm {
    font-size: 0.9rem;
}
textarea.form-control-sm {
    line-height: 1.5; /* Adjust line height for textarea */
}
/* Error message styling (uses variables from main.css) */
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
.btn-primary:disabled, .btn-secondary:disabled { /* Apply to both */
    cursor: not-allowed; /* Indicate non-interactive state */
    opacity: 0.65; /* Make it look faded */
}
/* Style for color picker */
.form-control-color {
    width: 100px; /* Example width */
    height: 30px; /* Example height */
    padding: 0.1rem 0.2rem; /* Minimal padding */
    cursor: pointer;
    border: 1px solid var(--border-color); /* Add border for consistency */
    border-radius: var(--border-radius);
}
/* Adjust button sizes slightly if needed */
.modal-footer .btn-sm {
    padding: 0.35rem 0.8rem; /* Slightly larger padding */
    font-size: 0.875rem; /* Slightly larger font */
}
</style>

