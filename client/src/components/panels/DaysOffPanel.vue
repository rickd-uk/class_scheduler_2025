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
            <li v-for="day in daysOff" :key="day.id || day.date" class="item">
               <div class="item-details">
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
   const showAddForm = ref(false);
   const isAdding = ref(false);
   const addError = ref(null);
   const deletingDate = ref(null);
   const deleteError = ref(null);
   const newDayOff = reactive({ date: '', reason: '' });
   const daysOff = computed(() => store.getters['daysOff/allDaysOff']);
   const isLoading = computed(() => store.getters['daysOff/isLoading']);
   const fetchError = computed(() => store.getters['daysOff/error']);

   // Methods for Add and Edit (simplified for brevity)
   const resetForm = () => {
       newDayOff.date = ''; newDayOff.reason = ''; addError.value = null; isAdding.value = false;
   };
   const handleAddDayOff = async () => {
       if (!newDayOff.date) { addError.value = "Please select a date."; return; }
       isAdding.value = true; addError.value = null;
       try { await store.dispatch('daysOff/addDayOff', { ...newDayOff }); resetForm(); showAddForm.value = false; }
       catch (error) { addError.value = error.message || "Failed to add day off."; }
       finally { isAdding.value = false; }
   };
   const handleEditClick = (dayOff) => {
       console.log("Opening edit modal for day off:", dayOff);
       store.dispatch('ui/openModal', { modalName: 'dayOffEditor', data: dayOff });
   };

   // Handles clicking the delete button for a day off
   const handleDeleteDayOff = async (date) => {
      console.log(`[DaysOffPanel] handleDeleteDayOff called for date: ${date}`); // Log 1

      // --- REMOVED Confirmation Dialog ---
      // if (!confirm(`Are you sure you want to remove ${formatDate(date)} as a day off?`)) {
      //    console.log(`[DaysOffPanel] Deletion cancelled by user for date: ${date}`); // Log 2 (if cancelled)
      //    return; // Stop if user cancels
      // }
      // console.log(`[DaysOffPanel] Deletion confirmed (or bypassed) for date: ${date}. Proceeding...`); // Log 3 (if confirmed/bypassed)
      // --- End Removal ---


      // Set loading state for the specific delete button
      deletingDate.value = date;
      deleteError.value = null; // Clear previous delete errors

      try {
         console.log(`[DaysOffPanel] Dispatching daysOff/deleteDayOff for date: ${date}`); // Log 4
         // Dispatch action to delete the day off via API
         await store.dispatch('daysOff/deleteDayOff', date); // <-- Ensure this dispatch exists
         console.log(`[DaysOffPanel] Dispatch successful for date: ${date}`); // Log 5
         // Day off is removed reactively by the store mutation
      } catch (error) {
         console.error(`[DaysOffPanel] Error during delete dispatch for date: ${date}`, error); // Log 6 (if error)
         // Set error message and show an alert
         deleteError.value = error.message || "Failed to delete day off.";
         alert(`Error: ${deleteError.value}`); // Simple alert for now
      } finally {
         console.log(`[DaysOffPanel] Resetting delete state for date: ${date}`); // Log 7
         // Reset the loading state for the button
         deletingDate.value = null;
      }
   };

   // Helper function to format date for display in the list
   const formatDate = (dateString) => {
       if (!dateString) return '';
       const date = new Date(dateString + 'T00:00:00');
       if (isNaN(date.getTime())) return 'Invalid Date';
        return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', weekday: 'short' });
   };

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
    .add-form { padding: 1rem; margin-bottom: 1rem; border: 1px solid var(--border-color); border-radius: var(--border-radius); background-color: var(--light); }
    .add-form h4 { margin-top: 0; margin-bottom: 1rem; font-size: 1rem; font-weight: 600; }
    .form-control-sm { font-size: 0.875rem; padding: 0.3rem 0.6rem; }
    .add-form .form-group { margin-bottom: 0.75rem; }
    input[type="date"].form-control-sm { height: calc(1.5em + 0.6rem + 2px); line-height: 1.5; }
    .item-list { list-style: none; padding: 0; margin: 0; }
    .item { display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0.2rem; border-bottom: 1px solid var(--border-color); }
    .item:last-child { border-bottom: none; }
    .item-details { display: flex; flex-direction: column; gap: 0.1rem; flex-grow: 1; min-width: 0; margin-right: 0.5rem; }
    .item-name { font-weight: 500; font-size: 0.9rem; }
    .item-meta { font-size: 0.8rem; color: var(--secondary); }
    .item-actions { display: flex; gap: 0.5rem; flex-shrink: 0; }
    .btn-sm { padding: 0.2rem 0.5rem; font-size: 0.75rem; }
    .loading, .error-message, .placeholder-content { padding: 1rem; text-align: center; color: var(--secondary); font-size: 0.9rem; }
    .error-message { color: var(--danger); background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: var(--border-radius); margin-bottom: 1rem; }
    .btn-danger:disabled { cursor: not-allowed; opacity: 0.65; }
   </style>
   
