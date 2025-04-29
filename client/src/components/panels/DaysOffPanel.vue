<template>
  <div class="panel days-off-panel">
    <div class="panel-header">
      <h3 class="panel-title">Manage Days Off</h3>
       <button class="btn btn-sm btn-primary" @click="showAddForm = !showAddForm">
          {{ showAddForm ? 'Cancel' : '+ Add Day Off' }}
      </button>
    </div>
    <div class="panel-body">
        <form v-if="showAddForm" @submit.prevent="handleAddDayOff" class="add-form">
            <h4>Add New Day Off</h4>
            <p v-if="addError" class="error-message">{{ addError }}</p>
            <div class="form-group">
                <label for="new-dayoff-date">Date</label>
                <input type="date" id="new-dayoff-date" v-model="newDayOff.date" required class="form-control form-control-sm">
            </div>
            <div class="form-group">
                <label for="new-dayoff-reason">Reason (Optional)</label>
                <input type="text" id="new-dayoff-reason" v-model="newDayOff.reason" class="form-control form-control-sm" placeholder="e.g., Holiday, Personal">
            </div>
            <button type="submit" class="btn btn-success btn-sm" :disabled="isAdding">
                {{ isAdding ? 'Adding...' : 'Save Day Off' }}
            </button>
        </form>

        <div v-if="isLoading" class="loading">Loading days off...</div>
      <div v-else-if="fetchError" class="error-message">{{ fetchError }}</div>
      <ul v-else-if="daysOff.length > 0" class="item-list">
         <li v-for="day in daysOff" :key="day.id || day.date" class="item"> <div class="item-details">
                <span class="item-name">{{ formatDate(day.date) }}</span>
                <span v-if="day.reason" class="item-meta">{{ day.reason }}</span>
            </div>
            <div class="item-actions">
               <button
                  class="btn btn-sm btn-secondary"
                  @click="handleEditClick(day)"
                  title="Edit Reason">
                   Edit
               </button>
               <button
                  class="btn btn-sm btn-danger"
                  @click="handleDeleteDayOff(day.date)"
                  :disabled="deletingDate === day.date"
                >
                   {{ deletingDate === day.date ? 'Deleting...' : 'Del' }}
                </button>
            </div>
         </li>
      </ul>
       <p v-else class="placeholder-content">No specific days off configured.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useStore } from 'vuex';

const store = useStore();

// --- Component State ---
const showAddForm = ref(false); // Controls visibility of the add form
const isAdding = ref(false); // Tracks if add operation is in progress
const addError = ref(null); // Stores errors related to adding
const deletingDate = ref(null); // Tracks which date is being deleted for UI feedback
const deleteError = ref(null); // Stores errors related to deleting
// Reactive object for the add form data
const newDayOff = reactive({
    date: '',
    reason: ''
});

// --- Store State ---
// Computed properties to get data from the Vuex store reactively
const daysOff = computed(() => store.getters['daysOff/allDaysOff']); // Get list of days off
const isLoading = computed(() => store.getters['daysOff/isLoading']); // Get loading state
const fetchError = computed(() => store.getters['daysOff/error']); // Get error state

// --- Methods ---

// Resets the add form fields and error state
const resetForm = () => {
    newDayOff.date = '';
    newDayOff.reason = '';
    addError.value = null;
    isAdding.value = false;
};

// Handles submission of the add day off form
const handleAddDayOff = async () => {
    // Basic validation
    if (!newDayOff.date) {
        addError.value = "Please select a date.";
        return;
    }
    // Set loading state and clear errors
    isAdding.value = true;
    addError.value = null;
    try {
        // Dispatch action to add the day off via API
        await store.dispatch('daysOff/addDayOff', { ...newDayOff });
        // Reset form and hide it on success
        resetForm();
        showAddForm.value = false;
    } catch (error) {
        // Set error message if adding fails
        addError.value = error.message || "Failed to add day off.";
    } finally {
        // Always reset loading state
        isAdding.value = false;
    }
};

const handleEditClick = (dayOff) => {
    console.log("Opening edit modal for day off:", dayOff);
    // Dispatch action to open the modal and pass the full day off object
    // The modal component will use this data (specifically date and reason)
    store.dispatch('ui/openModal', {
        modalName: 'dayOffEditor', // Use the modal name defined in ui.js state
        data: dayOff // Pass the day off object (action deep copies)
    });
};

// Handles clicking the delete button for a day off
const handleDeleteDayOff = async (date) => {
   // Confirmation dialog
   if (!confirm(`Are you sure you want to remove ${formatDate(date)} as a day off?`)) {
      return; // Stop if user cancels
   }
   // Set loading state for the specific delete button
   deletingDate.value = date;
   deleteError.value = null; // Clear previous errors
   try {
     // Dispatch action to delete the day off via API
     await store.dispatch('daysOff/deleteDayOff', date);
     // Day off is removed reactively by the store mutation
   } catch (error) {
     // Set error message and show an alert
     deleteError.value = error.message || "Failed to delete day off.";
     alert(`Error: ${deleteError.value}`); // Simple alert for now
   } finally {
     // Reset loading state for the button
     deletingDate.value = null;
   }
};

// Helper function to format date for display in the list
const formatDate = (dateString) => {
    if (!dateString) return ''; // Handle null/empty dates
    // Add T00:00:00 to ensure date is interpreted in local timezone, not UTC
    const date = new Date(dateString + 'T00:00:00');
    // Check for invalid date object after parsing
    if (isNaN(date.getTime())) return 'Invalid Date';
    // Format using locale-specific options
     return date.toLocaleDateString(undefined, { // Use browser's locale
          year: 'numeric', month: 'short', day: 'numeric', weekday: 'short'
     });
}

// --- Lifecycle Hook ---
// Fetch days off when the component is first mounted if they aren't already loaded
onMounted(() => {
  if (daysOff.value.length === 0 && !isLoading.value) {
    store.dispatch('daysOff/fetchDaysOff');
  }
});
</script>

<style scoped>
/* Styles for the panel */
.panel-body {
    max-height: 300px; /* Adjust max height as needed */
    overflow-y: auto; /* Enable vertical scroll */
    padding-top: 0;
}
/* Styles for the add form */
.add-form {
    padding: 1rem;
    margin-bottom: 1rem;
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius);
    background-color: var(--light);
}
.add-form h4 {
    margin-top: 0;
    margin-bottom: 1rem;
    font-size: 1rem;
    font-weight: 600;
}
/* Smaller form controls */
.form-control-sm {
    font-size: 0.875rem;
    padding: 0.3rem 0.6rem;
}
.add-form .form-group {
    margin-bottom: 0.75rem;
}
/* Specific style for date input to match height */
input[type="date"].form-control-sm {
    height: calc(1.5em + 0.6rem + 2px);
    line-height: 1.5;
}
/* Styles for the list */
.item-list {
    list-style: none;
    padding: 0;
    margin: 0;
}
.item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0.2rem;
    border-bottom: 1px solid var(--border-color);
}
.item:last-child {
    border-bottom: none;
}
.item-details {
    display: flex;
    flex-direction: column; /* Stack date and reason */
    gap: 0.1rem;
    flex-grow: 1;
    min-width: 0;
    margin-right: 0.5rem;
}
.item-name { /* For the date */
    font-weight: 500;
    font-size: 0.9rem;
}
.item-meta { /* For the reason */
    font-size: 0.8rem;
    color: var(--secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.item-actions {
    display: flex;
    gap: 0.5rem;
    flex-shrink: 0;
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
    color: var(--danger);
    background-color: #f8d7da;
    border: 1px solid #f5c6cb;
    border-radius: var(--border-radius);
    margin-bottom: 1rem;
}
/* Style for disabled delete button */
.btn-danger:disabled {
    cursor: not-allowed;
    opacity: 0.65;
}
</style>

