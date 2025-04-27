<template>
  <div class="panel classes-panel">
    <div class="panel-header">
      <h3 class="panel-title">Manage Classes (English)</h3>
      <button class="btn btn-sm btn-primary" @click="showAddForm = !showAddForm">
          {{ showAddForm ? 'Cancel' : 'Add Class' }}
      </button>
    </div>
    <div class="panel-body">
      <form v-if="showAddForm" @submit.prevent="handleAddClass" class="add-form">
          <h4>Add New Class</h4>
           <p v-if="addError" class="error-message">{{ addError }}</p>

           <div class="form-group">
              <label for="new-class-number">Class Number</label>
              <select id="new-class-number" v-model="newClass.classNumber" required class="form-control form-control-sm">
                  <option disabled value="">Please select one</option>
                  <option v-for="n in 15" :key="n" :value="n">{{ n }}</option>
              </select>
           </div>

           <div class="form-group">
              <label for="new-year-level">Year Level</label>
              <select id="new-year-level" v-model="newClass.yearLevel" required class="form-control form-control-sm">
                   <option disabled value="">Please select one</option>
                   <option v-for="n in 6" :key="`year-${n}`" :value="n">{{ n }}</option>
              </select>
           </div>

          <button type="submit" class="btn btn-success btn-sm" :disabled="isAdding">
             {{ isAdding ? 'Adding...' : 'Save Class' }}
          </button>
      </form>

      <div v-if="isLoading" class="loading">Loading classes...</div>
      <div v-else-if="fetchError" class="error-message">{{ fetchError }}</div>
      <ul v-else-if="classes.length > 0" class="item-list">
         <li v-for="cls in classes" :key="cls.id" class="item">
            <div class="item-details">
                <span class="item-name">Year {{ cls.yearLevel }} - Class {{ cls.classNumber }}</span>
                </div>
            <div class="item-actions">
               <button
                  class="btn btn-sm btn-danger"
                  @click="handleDeleteClass(cls.id)"
                  :disabled="deletingClassId === cls.id" >
                   {{ deletingClassId === cls.id ? 'Deleting...' : 'Del' }}
                </button>
            </div>
         </li>
      </ul>
      <p v-else class="placeholder-content">No classes defined yet. Click 'Add Class' to start.</p>
    </div>
  </div>
</template>

<script setup>
// Import necessary functions from Vue and Vuex
import { ref, reactive, computed, onMounted } from 'vue';
import { useStore } from 'vuex';

// Initialize Vuex store
const store = useStore();

// --- Component State ---
const showAddForm = ref(false); // Controls visibility of the add form
const isAdding = ref(false); // Tracks if an add operation is in progress
const addError = ref(null); // Stores error messages related to adding a class
const deletingClassId = ref(null); // Tracks the ID of the class currently being deleted
const deleteError = ref(null); // Stores error messages related to deleting a class

// Reactive object to hold data for the new class form
const newClass = reactive({
  classNumber: '', // Initialize as empty for the dropdown placeholder
  yearLevel: ''    // Initialize as empty for the dropdown placeholder
});

// --- Store State ---
// Computed properties to get data from the Vuex store
const classes = computed(() => store.getters['classes/allClasses']); // Get the list of classes
const isLoading = computed(() => store.getters['classes/isLoading']); // Get loading state for fetching classes
const fetchError = computed(() => store.getters['classes/error']); // Get error state from fetching classes

// --- Methods ---

// Resets the add class form fields and error states
const resetForm = () => {
    newClass.classNumber = '';
    newClass.yearLevel = '';
    addError.value = null;
    isAdding.value = false;
};

// Handles the submission of the add class form
const handleAddClass = async () => {
    // Basic validation (already handled by 'required' on select, but good practice)
    if (!newClass.classNumber || !newClass.yearLevel) {
        addError.value = "Please select Class Number and Year Level.";
        return;
    }
    // Set loading state and clear previous errors
    isAdding.value = true;
    addError.value = null;

    try {
        // Dispatch action to add the class via API
        await store.dispatch('classes/addClass', {
             classNumber: newClass.classNumber,
             yearLevel: newClass.yearLevel
        });
        // Reset form and hide it on success
        resetForm();
        showAddForm.value = false;
    } catch (error) {
        // Set error message if adding fails
        addError.value = error.message || "Failed to add class.";
    } finally {
        // Always reset loading state
        isAdding.value = false;
    }
};

// Handles clicking the delete button for a class
const handleDeleteClass = async (id) => {
    // Show confirmation dialog to the user
    if (!confirm(`Are you sure you want to delete this class? This action cannot be undone.`)) {
        return; // Stop if user cancels
    }

    // Set loading state for the specific delete button
    deletingClassId.value = id;
    deleteError.value = null; // Clear previous delete errors

    try {
        // Dispatch action to delete the class via API
        await store.dispatch('classes/deleteClass', id);
        // Class is removed from the list reactively by the store mutation
    } catch (error) {
        // Set error message and show an alert if deleting fails
        deleteError.value = error.message || "Failed to delete class.";
        alert(`Error: ${deleteError.value}`); // Using simple alert for now
    } finally {
        // Reset the loading state for the delete button
        deletingClassId.value = null;
    }
};

// --- Lifecycle Hook ---
// Fetch classes when the component is first mounted, if they aren't already loaded
onMounted(() => {
  if (classes.value.length === 0 && !isLoading.value) {
    store.dispatch('classes/fetchClasses');
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
/* Styles for the add class form */
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
/* Make dropdowns look like other form controls */
select.form-control-sm {
    height: calc(1.5em + 0.5rem + 2px); /* Match input height */
     padding: 0.3rem 0.6rem;
     font-size: 0.875rem;
     line-height: 1.5;
     /* Inherit other form-control styles via main.css */
}
.add-form .form-group {
    margin-bottom: 0.75rem; /* Space between form groups */
}

/* Styles for the list of classes */
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
    flex-shrink: 1; /* Allow details to shrink if needed */
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
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
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
/* Style for disabled delete button */
.btn-danger:disabled {
    cursor: not-allowed; /* Indicate non-interactive state */
    opacity: 0.65; /* Make it look faded */
}
</style>

