<template>
  <div class="modal-overlay" @click.self="closeModal">
    <div class="modal-content">
      <button @click="closeModal" class="modal-close-btn">&times;</button>
      <h3>{{ isEditing ? 'Edit Day Off' : 'Add New Day Off' }}</h3>
      <p v-if="isEditing && editableData.date">Editing for: <strong>{{ formatDateForTitle(editableData.date) }}</strong>
      </p>

      <form @submit.prevent="handleSubmit" class="modal-form">
        <p v-if="formError" class="error-message">{{ formError }}</p>

        <div v-if="!isEditing" class="form-group">
          <label for="edit-dayoff-date">Date</label>
          <input type="date" id="edit-dayoff-date" v-model="editableData.date" required
            class="form-control form-control-sm" :disabled="isLoading" />
        </div>

        <div class="form-group">
          <label for="edit-dayoff-reason">Reason</label>
          <input type="text" id="edit-dayoff-reason" v-model="editableData.reason" class="form-control form-control-sm"
            placeholder="e.g., Holiday, Personal (Optional)" :disabled="isLoading" />
        </div>
        <div class="form-group">
          <label for="edit-dayoff-color">Color</label>
          <input type="color" id="edit-dayoff-color" v-model="editableData.color"
            class="form-control form-control-sm form-control-color" :disabled="isLoading">
        </div>

        <div class="modal-footer">
          <button @click="closeModal" type="button" class="btn btn-secondary btn-sm" :disabled="isLoading">
            Close </button>
          <button type="submit" class="btn btn-primary btn-sm" :disabled="isLoading">
            {{ isLoading ? (isEditing ? 'Updating...' : 'Adding...') : (isEditing ? 'Save Changes' : 'Add') }}
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
const isLoading = ref(false); // Combined loading state for add/update
const formError = ref(null); // Error specific to this form

const getTodayDateString = () => {
  const today = new Date();
  const offset = today.getTimezoneOffset() * 60000;
  const localDate = new Date(today.getTime() - offset);
  return localDate.toISOString().split('T')[0];
}

// Reactive object for editable fields
// Add 'date' field for Add mode
const editableData = reactive({
  id: null, // Store ID when editing
  date: '',
  reason: '',
  color: '#F0F0F0' // Default color
});

// Reset form fields (used for Add mode)
const resetForm = () => {
  editableData.id = null;
  editableData.date = getTodayDateString();
  editableData.reason = '';
  editableData.color = '#F0F0F0'; // Reset color
  formError.value = null;
  console.log("Day Off Editor form reset.");
};

// --- Computed Properties ---
const modalData = computed(() => store.getters['ui/getModalData'](modalName));
// Determine if editing based on presence of ID in modalData
const isEditing = computed(() => !!modalData.value?.id);

// --- Watchers ---
// Populate the form when the modal data changes
watch(modalData, (newData) => {
  formError.value = null; // Clear previous errors
  if (newData && typeof newData === 'object' && newData.id) {
    // Edit Mode: Populate from existing data
    editableData.id = newData.id; // Store ID for update action
    editableData.date = newData.date || ''; // Date is fixed when editing
    editableData.reason = newData.reason || '';
    editableData.color = newData.color || '#F0F0F0';
    console.log("DayOffEditorModal received EDIT data:", newData);
  } else {
    // Add Mode: Reset form
    resetForm();
    console.log("DayOffEditorModal opened in ADD mode.");
  }
}, { immediate: true }); // Run immediately

// --- Methods ---


// Close the modal
const closeModal = () => {
  if (isLoading.value) return;
  store.dispatch('ui/closeModal', modalName);
};

// Handle form submission (Add or Update)
const handleSubmit = async () => {
  // Validate date for Add mode
  if (!isEditing.value && (!editableData.date || !/^\d{4}-\d{2}-\d{2}$/.test(editableData.date))) {
    formError.value = "Please select a valid date.";
    return;
  }
  // Validate color format
  if (editableData.color && !/^#[0-9A-F]{6}$/i.test(editableData.color)) {
    formError.value = 'Invalid color format. Use hex #RRGGBB.';
    return;
  }

  isLoading.value = true;
  formError.value = null;

  try {
    if (isEditing.value) {
      // --- Update Existing Day Off ---
      console.log(`Dispatching updateDayOff for date ${editableData.date}`);
      await store.dispatch('daysOff/updateDayOff', {
        date: editableData.date, // Use the date from the form data (which was set from modalData)
        data: { // Send only updatable fields
          reason: editableData.reason,
          color: editableData.color
        }
      });
      console.log("▶️ Adding/Updating DayOff with date:", editableData.date);
      nextTick(closeModal); // Close after successful update
    } else {
      // --- Add New Day Off ---
      console.log(`Dispatching addDayOff for date ${editableData.date}`);
      await store.dispatch('daysOff/addDayOff', {
        date: editableData.date,
        reason: editableData.reason,
        color: editableData.color
      });
      resetForm(); // Reset form to allow adding another
      // Keep modal open after adding
    }
  } catch (error) {
    formError.value = error.message || `Failed to ${isEditing.value ? 'update' : 'add'} day off.`;
    console.error(`Error ${isEditing.value ? 'updating' : 'adding'} day off:`, error);
  } finally {
    isLoading.value = false; // Reset loading state
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
.modal-content {
  min-width: 350px;
  max-width: 500px;
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

p strong {
  font-weight: 600;
  color: var(--primary);
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

input[type="date"].form-control-sm {
  height: calc(1.5em + 0.6rem + 2px);
  line-height: 1.5;
  cursor: pointer;
}

textarea.form-control-sm {
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
  width: 100px;
  height: 30px;
  padding: 0.1rem 0.2rem;
  cursor: pointer;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
}
</style>
