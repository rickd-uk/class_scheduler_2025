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
         <li v-for="cls in classes" :key="cls.id" class="item class-item">
            <div class="class-main-info">
                <div class="item-details">
                    <span class="item-name">Year {{ cls.yearLevel }} - Class {{ cls.classNumber }}</span>
                </div>
                <div class="item-actions">
                   <button
                      class="btn btn-sm btn-info"
                      @click="openLinkModal(cls)"
                      title="Link Textbooks">
                      Link </button>
                   <button
                      class="btn btn-sm btn-danger"
                      @click="handleDeleteClass(cls.id)"
                      :disabled="deletingClassId === cls.id" >
                       {{ deletingClassId === cls.id ? 'Deleting...' : 'Del' }}
                    </button>
                </div>
            </div>
            <div v-if="cls.textbooks && cls.textbooks.length > 0" class="linked-textbooks">
                <strong>Textbooks:</strong>
                <ul>
                    <li v-for="book in cls.textbooks" :key="book.id">
                        <span>{{ book.title }}</span>
                        <button
                           class="btn-unlink"
                           title="Unlink Textbook"
                           @click="handleUnlinkTextbook(cls.id, book.id)"
                           :disabled="unlinkingTextbookInfo?.classId === cls.id && unlinkingTextbookInfo?.textbookId === book.id"
                        >
                           &times; </button>
                    </li>
                </ul>
            </div>
            <div v-else class="linked-textbooks-empty">
                No textbooks linked.
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
const unlinkingTextbookInfo = ref(null); // Tracks { classId, textbookId } being unlinked for UI feedback
const linkError = ref(null); // Stores error messages related to linking/unlinking

// Reactive object to hold data for the new class form
const newClass = reactive({
  classNumber: '', // Initialize as empty for the dropdown placeholder
  yearLevel: ''    // Initialize as empty for the dropdown placeholder
});

// State for controlling the (not yet implemented) linking modal
// const showLinkModal = ref(false); // Commented out as modal is global
// const selectedClassForLinking = ref(null); // Commented out as modal is global


// --- Store State ---
// Computed properties to get data from the Vuex store reactively
const classes = computed(() => store.getters['classes/allClasses']); // Get the list of classes (includes linked textbooks)
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
    // Basic validation
    if (!newClass.classNumber || !newClass.yearLevel) {
        addError.value = "Please select Class Number and Year Level.";
        return;
    }
    // Set loading state and clear previous errors
    isAdding.value = true;
    addError.value = null;

    try {
        // Dispatch action to add the class via API
        await store.dispatch('classes/addClass', { ...newClass });
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
    console.log(`[ClassesPanel] handleDeleteClass called for ID: ${id}`); // <-- Log 1
    // --- Temporarily comment out the confirmation ---
    // if (!confirm(`Are you sure you want to delete this class? This will also remove any textbook links.`)) {
    //      console.log(`[ClassesPanel] Deletion cancelled by user for ID: ${id}`); // <-- Log 2 (if cancelled)
    //     return; // Stop if user cancels
    // }
    // console.log(`[ClassesPanel] Deletion confirmed (or bypassed) for ID: ${id}. Proceeding...`); // <-- Log 3 (if confirmed/bypassed)
    // --- End temporary comment ---

    // Set loading state for the specific delete button
    deletingClassId.value = id;
    deleteError.value = null; // Clear previous delete errors

    try {
        console.log(`[ClassesPanel] Dispatching classes/deleteClass for ID: ${id}`); // <-- Log 4
        // Dispatch action to delete the class via API
        await store.dispatch('classes/deleteClass', id);
         console.log(`[ClassesPanel] Dispatch successful for ID: ${id}`); // <-- Log 5
        // Class is removed from the list reactively by the store mutation
    } catch (error) {
        console.error(`[ClassesPanel] Error during delete dispatch for ID: ${id}`, error); // <-- Log 6 (if error)
        // Set error message and show an alert if deleting fails
        deleteError.value = error.message || "Failed to delete class.";
        alert(`Error: ${deleteError.value}`); // Using simple alert for now
    } finally {
        console.log(`[ClassesPanel] Resetting delete state for ID: ${id}`); // <-- Log 7
        // Reset the loading state for the delete button
        deletingClassId.value = null;
    }
};


// --- Linking/Unlinking Methods ---

// Opens the LinkTextbookModal
const openLinkModal = (cls) => {
    console.log("[ClassesPanel] openLinkModal called with class:", cls); // Log 1
    try {
        console.log("[ClassesPanel] Attempting to dispatch ui/openModal..."); // Log 2
        // Dispatch action to open the modal and pass the class data
        store.dispatch('ui/openModal', {
            modalName: 'linkTextbookModal', // Matches the key in the UI store state
            data: cls // Pass the whole class object (includes already linked textbooks)
        });
         console.log("[ClassesPanel] Dispatch ui/openModal completed (no error thrown)."); // Log 3
    } catch (error) {
        // This catch block might not catch errors within async dispatch if not awaited
        console.error("[ClassesPanel] Error occurred during dispatch:", error); // Log 4
    }
};

// Placeholder function to close the Link Textbook modal (Not needed here as modal is global)
// const closeLinkModal = () => {
//     showLinkModal.value = false;
//     selectedClassForLinking.value = null;
// };

// Handles clicking the unlink ('x') button next to a linked textbook
const handleUnlinkTextbook = async (classId, textbookId) => {
    // --- Temporarily comment out confirmation ---
    // if (!confirm(`Are you sure you want to unlink this textbook from this class?`)) {
    //     return; // Stop if user cancels
    // }
    // --- End temporary comment ---

    // Set loading state for the specific unlink button
    unlinkingTextbookInfo.value = { classId, textbookId };
    linkError.value = null; // Clear previous linking errors

    try {
        // Dispatch action to unlink the textbook via API
        await store.dispatch('classes/unlinkTextbook', { classId, textbookId });
        // State updates reactively based on the store mutation
    } catch (error) {
         // Set error message and show an alert if unlinking fails
         linkError.value = error.message || "Failed to unlink textbook.";
         alert(`Error: ${linkError.value}`); // Simple alert for now
    } finally {
        // Reset the loading state for the unlink button
        unlinkingTextbookInfo.value = null;
    }
};


// --- Lifecycle Hook ---
// Fetch data when the component is first mounted
onMounted(() => {
  // Fetch classes (which now include textbooks) if they aren't already loaded
  if (classes.value.length === 0 && !isLoading.value) {
    store.dispatch('classes/fetchClasses');
  }
  // Also ensure the full list of textbooks is loaded for the linking modal (even if modal isn't open yet)
  if (store.getters['textbooks/allTextbooks'].length === 0) {
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
.class-item { /* Specific class item styling */
  padding: 0.6rem 0.2rem;
  border-bottom: 1px solid var(--border-color); /* Separator line */
}
.class-item:last-child {
  border-bottom: none; /* Remove border from last item */
}
/* Container for main class info (name, actions) */
.class-main-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem; /* Add space below main info if textbooks are listed */
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
.item-meta { /* Style for JH/HS indicator */
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
/* Style for disabled action buttons */
.btn-danger:disabled, .btn-info:disabled {
    cursor: not-allowed; /* Indicate non-interactive state */
    opacity: 0.65; /* Make it look faded */
}

/* Styles for the linked textbooks section within a class item */
.linked-textbooks {
    font-size: 0.85rem;
    margin-left: 1rem; /* Indent slightly */
    padding-left: 0.5rem;
    border-left: 2px solid var(--border-color); /* Visual indicator */
    margin-top: 0.5rem; /* Space above textbook list */
    padding-top: 0.3rem;
}
.linked-textbooks strong {
    font-weight: 600;
    color: var(--secondary);
}
.linked-textbooks ul {
    list-style: none; /* Remove bullets */
    padding: 0;
    margin-top: 0.25rem;
}
.linked-textbooks li {
    display: flex;
    justify-content: space-between; /* Push title and unlink button apart */
    align-items: center;
    padding: 0.15rem 0;
    color: #555; /* Dark grey text */
}
/* Style for message when no textbooks are linked */
.linked-textbooks-empty {
    font-size: 0.8rem;
    color: var(--secondary);
    margin-left: 1rem;
    font-style: italic;
    margin-top: 0.5rem; /* Consistent spacing */
}
/* Style for the small 'x' unlink button */
.btn-unlink {
    background: none;
    border: none;
    color: var(--danger); /* Red color */
    cursor: pointer;
    font-size: 1.1rem; /* Make 'x' slightly larger */
    line-height: 1; /* Prevent extra vertical space */
    padding: 0 0.3rem;
    margin-left: 0.5rem; /* Space between title and button */
}
.btn-unlink:hover {
    color: var(--dark); /* Darken on hover */
}
.btn-unlink:disabled {
    color: #ccc; /* Grey out when disabled */
    cursor: not-allowed;
}
</style>

