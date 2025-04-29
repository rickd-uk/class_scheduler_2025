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
            v-model="editableReason"
            class="form-control form-control-sm"
            placeholder="e.g., Holiday, Personal (Optional)"
            :disabled="isUpdating"
          />
        </div>

        <div class="modal-footer">
          <button @click="closeModal" type="button" class="btn btn-secondary btn-sm" :disabled="isUpdating">
            Cancel
          </button>
          <button type="submit" class="btn btn-primary btn-sm" :disabled="isUpdating">
            {{ isUpdating ? 'Updating...' : 'Save Reason' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
// Import nextTick
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { useStore } from 'vuex';

const store = useStore();
const modalName = 'dayOffEditor'; // Unique name for this modal

// --- State ---
const isUpdating = ref(false);
const editError = ref(null);
const editableReason = ref(''); // Store only the reason being edited

// --- Computed Properties ---
const dayOffData = computed(() => store.getters['ui/getModalData'](modalName));

// --- Watchers ---
watch(dayOffData, (newData) => {
  editError.value = null;
  if (newData && typeof newData === 'object') {
    editableReason.value = newData.reason || '';
    console.log("DayOffEditorModal received data:", newData);
  } else {
    editableReason.value = '';
  }
}, { immediate: true });

// --- Methods ---
const closeModal = () => {
  if (isUpdating.value) return;
  store.dispatch('ui/closeModal', modalName);
};

const handleUpdate = async () => {
  if (!dayOffData.value || !dayOffData.value.date) {
      editError.value = "Cannot update: Missing day off data.";
      return;
  }

  isUpdating.value = true;
  editError.value = null;

  try {
    await store.dispatch('daysOff/updateDayOff', {
      date: dayOffData.value.date,
      data: { reason: editableReason.value }
    });
    console.log("[DayOffEditorModal] Update dispatch successful. Calling closeModal via nextTick..."); // Log added
    // Wrap closeModal in nextTick
    nextTick(() => {
        closeModal(); // Close modal after the next DOM update cycle
    });
  } catch (error) {
    editError.value = error.message || "Failed to update reason.";
    console.error("Error updating day off reason:", error);
  } finally {
    isUpdating.value = false; // Reset loading state
  }
};

// Helper to format date for the title display
const formatDateForTitle = (dateString) => {
    if (!dateString) return 'Invalid Date';
    try {
        const date = new Date(dateString + 'T00:00:00');
        if (isNaN(date.getTime())) return 'Invalid Date';
        return date.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    } catch (e) { return 'Invalid Date'; }
};

// --- Lifecycle Hooks (Optional: Esc key) ---
const handleEscapeKey = (event) => { if (event.key === 'Escape') { closeModal(); } };
onMounted(() => { document.addEventListener('keydown', handleEscapeKey); });
onUnmounted(() => { document.removeEventListener('keydown', handleEscapeKey); });

</script>

<style scoped>
/* Uses global modal styles from main.css */
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
/* Adjust button sizes slightly if needed */
.modal-footer .btn-sm {
    padding: 0.35rem 0.8rem; /* Slightly larger padding */
    font-size: 0.875rem; /* Slightly larger font */
}
</style>

