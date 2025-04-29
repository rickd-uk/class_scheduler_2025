<template>
  <div class="modal-overlay" @click.self="closeModal">
    <div class="modal-content">
      <button @click="closeModal" class="modal-close-btn">&times;</button>
      <h3>Edit Day Off</h3>
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
           <input type="color" id="edit-dayoff-color" v-model="editableData.color" class="form-control form-control-sm form-control-color" :disabled="isUpdating">
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
// Import nextTick
import { ref, reactive, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { useStore } from 'vuex';

const store = useStore();
const modalName = 'dayOffEditor'; // Unique name for this modal

// --- State ---
const isUpdating = ref(false);
const editError = ref(null);
// Use reactive object for editable fields
const editableData = reactive({
    reason: '',
    color: '#F0F0F0' // Default color
});

// --- Computed Properties ---
const dayOffData = computed(() => store.getters['ui/getModalData'](modalName));

// --- Watchers ---
// Populate the form when the modal data changes (modal opens)
watch(dayOffData, (newData) => {
  editError.value = null;
  if (newData && typeof newData === 'object') {
    editableData.reason = newData.reason || '';
    editableData.color = newData.color || '#F0F0F0'; // Populate color or use default
    console.log("DayOffEditorModal received data:", newData);
  } else {
    editableData.reason = '';
    editableData.color = '#F0F0F0'; // Reset to default
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
    // Send both reason and color in the data payload
    await store.dispatch('daysOff/updateDayOff', {
      date: dayOffData.value.date, // Get the date from the passed data
      data: {
          reason: editableData.reason,
          color: editableData.color
      }
    });
    console.log("[DayOffEditorModal] Update dispatch successful. Calling closeModal via nextTick...");
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

// Helper function to format date for the title display
const formatDateForTitle = (dateString) => {
    if (!dateString) return 'Invalid Date';
    try {
        const date = new Date(dateString + 'T00:00:00');
        if (isNaN(date.getTime())) return 'Invalid Date';
        return date.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    } catch (e) { return 'Invalid Date'; }
}

// --- Lifecycle Hooks (Optional: Esc key to close) ---
const handleEscapeKey = (event) => { if (event.key === 'Escape') { closeModal(); } };
onMounted(() => { document.addEventListener('keydown', handleEscapeKey); });
onUnmounted(() => { document.removeEventListener('keydown', handleEscapeKey); });

</script>

<style scoped>
/* Uses global modal styles */
.modal-content { min-width: 350px; max-width: 500px; }
.modal-form { margin-top: 1rem; }
h3 { margin: 0; padding-bottom: 1rem; border-bottom: 1px solid var(--border-color); font-weight: 600; font-size: 1.2rem; }
p strong { font-weight: 600; color: var(--primary); }
hr { border: none; border-top: 1px solid var(--border-color); margin: 1rem 0; }
.modal-footer { display: flex; justify-content: flex-end; gap: 0.75rem; padding-top: 1.5rem; border-top: 1px solid var(--border-color); margin-top: 1.5rem; }
.form-control-sm { font-size: 0.9rem; }
textarea.form-control-sm { line-height: 1.5; }
.error-message { color: var(--danger); background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: var(--border-radius); padding: 0.5rem 0.8rem; margin-bottom: 1rem; font-size: 0.875rem; }
.btn-primary:disabled, .btn-secondary:disabled { cursor: not-allowed; opacity: 0.65; }
/* Style for color picker */
.form-control-color { width: 100px; height: 30px; padding: 0.1rem 0.2rem; cursor: pointer; }
/* Adjust button sizes slightly if needed */
.modal-footer .btn-sm { padding: 0.35rem 0.8rem; font-size: 0.875rem; }
</style>
