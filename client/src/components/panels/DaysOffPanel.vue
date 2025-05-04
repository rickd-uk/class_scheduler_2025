<template>
  <div class="panel days-off-panel">
    <div class="panel-header">
      <h3 class="panel-title">Days Off</h3>
       <button class="btn btn-sm btn-primary" @click="openAddModal">
          +
      </button>
    </div>
    <div class="panel-body">
        <div v-if="isLoading" class="loading">Loading days off...</div>
      <div v-else-if="fetchError" class="error-message">{{ fetchError }}</div>
      <ul v-else-if="daysOff.length > 0" class="item-list">
         <li v-for="day in daysOff" :key="day.id || day.date" class="item">
            <span class="color-square" :style="{ backgroundColor: day.color || '#F0F0F0' }"></span>
            <div class="item-details">
                <span class="item-name">{{ formatDate(day.date) }}</span>
                <span v-if="day.reason" class="item-meta">{{ day.reason }}</span>
            </div>
            <div class="item-actions">
               <button
                  class="btn btn-sm btn-secondary"
                  @click="openEditModal(day)"
                  title="Edit Reason/Color">
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
import { ref, computed, onMounted } from 'vue'; // Removed reactive
import { useStore } from 'vuex';

const store = useStore();

// --- Component State ---
// Removed state related to inline add form: showAddForm, isAdding, addError, newDayOff
const deletingDate = ref(null);
const deleteError = ref(null);

// --- Store State ---
const daysOff = computed(() => store.getters['daysOff/allDaysOff']);
const isLoading = computed(() => store.getters['daysOff/isLoading']);
const fetchError = computed(() => store.getters['daysOff/error']);

// --- Methods ---

// Method to open the modal for adding a new day off
const openAddModal = () => {
    console.log("Opening day off editor modal in ADD mode");
    store.dispatch('ui/openModal', {
        modalName: 'dayOffEditor', // Use the existing editor modal name
        data: null // Pass null to indicate 'Add' mode
    });
};

// Method to open the modal for editing an existing day off (renamed from handleEditClick)
const openEditModal = (dayOff) => {
    console.log("Opening day off editor modal in EDIT mode for:", dayOff);
    store.dispatch('ui/openModal', {
        modalName: 'dayOffEditor', // Use the existing editor modal name
        data: dayOff // Pass the full day off object
    });
};

// Delete handler remains the same (no confirmation)
const handleDeleteDayOff = async (date) => {
   console.log(`[DaysOffPanel] handleDeleteDayOff called for date: ${date}`);
   deletingDate.value = date; deleteError.value = null;
   try {
     console.log(`[DaysOffPanel] Dispatching daysOff/deleteDayOff for date: ${date}`);
     await store.dispatch('daysOff/deleteDayOff', date);
     console.log(`[DaysOffPanel] Dispatch successful for date: ${date}`);
   } catch (error) {
     console.error(`[DaysOffPanel] Error during delete dispatch for date: ${date}`, error);
     deleteError.value = error.message || "Failed to delete day off.";
     alert(`Error: ${deleteError.value}`);
   } finally {
     console.log(`[DaysOffPanel] Resetting delete state for date: ${date}`);
     deletingDate.value = null;
   }
};

// Helper to format date for display
const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString + 'T00:00:00');
    if (isNaN(date.getTime())) return 'Invalid Date';
     return date.toLocaleDateString(undefined, {
          year: 'numeric', month: 'short', day: 'numeric', weekday: 'short'
     });
}

// --- Lifecycle Hook ---
onMounted(() => {
  if (daysOff.value.length === 0 && !isLoading.value) {
    store.dispatch('daysOff/fetchDaysOff');
  }
});
</script>

<style scoped>
/* Styles are reused */
.panel-body { max-height: 300px; overflow-y: auto; padding-top: 0; }
/* Removed .add-form styles */
.item-list { list-style: none; padding: 0; margin: 0; }
.item { display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0.2rem; border-bottom: 1px solid var(--border-color); }
.item:last-child { border-bottom: none; }
.color-square { display: inline-block; width: 1em; height: 1em; border: 1px solid #ccc; margin-right: 0.5em; vertical-align: middle; flex-shrink: 0; }
.item-details { display: flex; flex-direction: column; gap: 0.1rem; flex-grow: 1; min-width: 0; margin-right: 0.5rem; }
.item-name { font-weight: 500; font-size: 0.9rem; }
.item-meta { font-size: 0.8rem; color: var(--secondary); }
.item-actions { display: flex; gap: 0.5rem; flex-shrink: 0; }
.btn-sm { padding: 0.2rem 0.5rem; font-size: 0.75rem; }
.loading, .error-message, .placeholder-content { padding: 1rem; text-align: center; color: var(--secondary); font-size: 0.9rem; }
.error-message { color: var(--danger); background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: var(--border-radius); margin-bottom: 1rem; }
.btn-danger:disabled, .btn-secondary:disabled { cursor: not-allowed; opacity: 0.65; }
.item { align-items: center; }
</style>

