<template>
  <CollapsiblePanel>
    <template #header>
      <h3 class="panel-title">Classes</h3>
    </template>

    <template #actions>
      <button class="btn btn-sm btn-primary" @click.stop="openAddModal">
        +
      </button>
    </template>

    <template #body>
      <div class="panel-body">
        <div v-if="isLoading" class="loading">Loading classes...</div>
        <div v-else-if="fetchError" class="error-message">{{ fetchError }}</div>
        <ul v-else-if="classes.length > 0" class="item-list">
          <li v-for="cls in classes" :key="cls.id" class="item class-item">
            <div class="class-main-info">
              <span class="color-square" :style="{ backgroundColor: cls.color || '#FFFFFF' }"></span>
              <div class="item-details">
                <span v-if="cls.classType === 'numbered'" class="item-name">
                  {{ formatNumberedClassName(cls) }}
                </span>
                <span v-else-if="cls.classType === 'special'" class="item-name special-class-name">
                  {{ cls.className }}
                  <span v-if="cls.yearLevel" class="special-year-level">(Yr {{ cls.yearLevel }})</span>
                  <span v-else class="special-year-level">(All Years)</span>
                </span>
                <span v-else class="item-name">Unknown Class Type</span>
              </div>
              <div class="item-actions">
                <button class="btn btn-sm btn-secondary" @click.stop="openEditModal(cls)" title="Edit Class">
                  Edit
                </button>
                <button class="btn btn-sm btn-info" @click.stop="openLinkModal(cls)" title="Link Textbooks">
                  Link
                </button>
                <button class="btn btn-sm btn-danger" @click.stop="handleDeleteClass(cls.id)"
                  :disabled="deletingClassId === cls.id">
                  {{ deletingClassId === cls.id ? 'Deleting...' : 'Del' }}
                </button>
              </div>
            </div>
            <div v-if="cls.textbooks?.length" class="linked-textbooks">
              <ul>
                <li v-for="book in cls.textbooks" :key="book.id" class="linked-item">
                  <span class="linked-item-name">{{ book.title }}</span>
                  <div class="linked-item-actions">
                    <button class="btn btn-link btn-sm text-danger" title="Unlink Textbook"
                      @click.stop="handleUnlinkTextbook(cls.id, book.id)" :disabled="unlinkingTextbookInfo?.classId === cls.id
                        && unlinkingTextbookInfo?.textbookId === book.id">
                      Unlink
                    </button>
                  </div>
                </li>
              </ul>
            </div>
          </li>
        </ul>
        <p v-else class="placeholder-content">
          No classes defined yet. Click '+' to add one.
        </p>
      </div>
    </template>
  </CollapsiblePanel>
</template>

<script setup>
// Removed 'reactive' as it was only used for the inline form's 'newClass' object
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import CollapsiblePanel from './CollapsiblePanel.vue';

const store = useStore();

// --- Component State ---
// Removed state related to the inline add form: showAddForm, isAdding, addError, newClass
const deletingClassId = ref(null); // Tracks ID of class being deleted for button state
const deleteError = ref(null); // Stores errors related to deleting a class
const unlinkingTextbookInfo = ref(null); // Tracks { classId, textbookId } being unlinked for button state
const linkError = ref(null); // Stores errors related to linking/unlinking textbooks

// --- Store State ---
// Computed properties to get data reactively from the Vuex store
const classes = computed(() => store.getters['classes/allClasses']); // Get the list of all classes
const isLoading = computed(() => store.getters['classes/isLoading']); // Get loading state for classes
const fetchError = computed(() => store.getters['classes/error']); // Get error state for classes

// --- Methods ---

// Removed handleAddClass and resetForm methods, as they are now handled within ClassFormModal.vue

// Method to open the ClassFormModal for adding a new class
const openAddModal = () => {
  console.log("Opening class modal in ADD mode");
  store.dispatch('ui/openModal', {
    modalName: 'classFormModal', // Use the name defined in the UI store state
    data: null // Pass null data to indicate 'Add' mode to the modal
  });
};

// Method to open the ClassFormModal for editing an existing class
const openEditModal = (cls) => {
  console.log("Opening class modal in EDIT mode for:", cls);
  store.dispatch('ui/openModal', {
    modalName: 'classFormModal', // Use the same modal name
    data: cls // Pass the existing class data (action will deep copy)
  });
};

// Handles deleting a class (no confirmation dialog in this version)
const handleDeleteClass = async (id) => {
  console.log(`[ClassesPanel] handleDeleteClass called for ID: ${id}`);
  deletingClassId.value = id; // Set loading state for the specific button
  deleteError.value = null; // Clear previous errors
  try {
    console.log(`[ClassesPanel] Dispatching classes/deleteClass for ID: ${id}`);
    // Dispatch the delete action to the store
    await store.dispatch('classes/deleteClass', id);
    console.log(`[ClassesPanel] Dispatch successful for ID: ${id}`);
    // Class is removed reactively from the list by the store mutation
  } catch (error) {
    // Handle potential errors from the delete action
    console.error(`[ClassesPanel] Error during delete dispatch for ID: ${id}`, error);
    deleteError.value = error.message || "Failed to delete class.";
    alert(`Error: ${deleteError.value}`); // Show simple alert for now
  } finally {
    // Reset loading state for the button
    console.log(`[ClassesPanel] Resetting delete state for ID: ${id}`);
    deletingClassId.value = null;
  }
};

// Handles unlinking a textbook from a class (no confirmation dialog)
const handleUnlinkTextbook = async (classId, textbookId) => {
  console.log(`[ClassesPanel] handleUnlinkTextbook called for Class ${classId}, Textbook ${textbookId}`);
  // Set loading state for the specific unlink button
  unlinkingTextbookInfo.value = { classId, textbookId };
  linkError.value = null; // Clear previous errors
  try {
    // Dispatch the unlink action to the store
    await store.dispatch('classes/unlinkTextbook', { classId, textbookId });
    // The class list updates reactively via the store mutation
  } catch (error) {
    // Handle potential errors
    linkError.value = error.message || "Failed to unlink textbook.";
    alert(`Error: ${linkError.value}`); // Simple alert for now
  } finally {
    // Reset loading state
    unlinkingTextbookInfo.value = null;
  }
};

// Opens the modal to link textbooks to a class
const openLinkModal = (cls) => {
  // Allow linking even for special classes now
  console.log("Opening link modal for class:", cls);
  store.dispatch('ui/openModal', {
    modalName: 'linkTextbookModal', // Name matches the modal component and UI store state
    data: cls // Pass the full class object
  });
};

// --- Placeholder for Edit Link functionality ---
const handleEditLink = (classId, textbookId) => {
  console.warn(`Edit link functionality for Class ${classId}, Textbook ${textbookId} is not implemented yet.`);
  alert("Edit link functionality is not yet implemented.");
  // TODO: Implement editing logic
};

// Formatting helper for numbered classes (e.g., 1J-3, 3H-8)
const formatNumberedClassName = (cls) => {
  if (!cls || cls.classType !== 'numbered' || !cls.yearLevel || !cls.classNumber) {
    return '?'; // Fallback for invalid data
  }
  const yearNum = parseInt(cls.yearLevel, 10);
  // Calculate display year (1-3 for both JH and HS)
  const displayYear = yearNum <= 3 ? yearNum : yearNum - 3;
  // Determine suffix (J for Junior High, H for High School)
  const schoolSuffix = yearNum <= 3 ? 'J' : 'H';
  // Return formatted string
  return `${displayYear}${schoolSuffix}-${cls.classNumber}`;
};

// --- Lifecycle Hook ---
onMounted(() => {
  // Fetch classes if the list is empty and not already loading
  if (classes.value.length === 0 && !isLoading.value) {
    store.dispatch('classes/fetchClasses');
  }
  // Fetch textbooks if needed for the LinkTextbookModal (pre-load)
  if (store.getters['textbooks/allTextbooks'].length === 0) {
    store.dispatch('textbooks/fetchTextbooks');
  }
});

</script>

<style scoped>
/* Styles remain largely the same */
.panel-body {
  max-height: 400px;
  overflow-y: auto;
  padding-top: 0;
}

.item-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.class-item {
  padding: 0.6rem 0.2rem;
  border-bottom: 1px solid var(--border-color);
}

.class-item:last-child {
  border-bottom: none;
}

.class-main-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.item-details {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  flex-shrink: 1;
  min-width: 0;
  margin-right: 0.5rem;
}

.item-name {
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.special-class-name {
  font-style: italic;
  color: var(--primary);
}

.special-year-level {
  font-size: 0.8em;
  color: var(--secondary);
  margin-left: 0.5em;
}

.item-actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}

.btn-sm {
  padding: 0.2rem 0.5rem;
  font-size: 0.75rem;
}

.loading,
.error-message,
.placeholder-content {
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

.btn-danger:disabled,
.btn-info:disabled,
.btn-secondary:disabled {
  cursor: not-allowed;
  opacity: 0.65;
}

.linked-textbooks {
  font-size: 0.85rem;
  margin-left: 1rem;
  padding-left: 0.5rem;
  border-left: 2px solid var(--border-color);
  margin-top: 0.5rem;
  padding-top: 0.3rem;
}

.linked-textbooks strong {
  font-weight: 600;
  color: var(--secondary);
  display: block;
  margin-bottom: 0.25rem;
}

.linked-textbooks ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.linked-item {
  /* Style for each linked textbook row */
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.15rem 0;
  color: #555;
}

.linked-item-name {
  /* Allow textbook name to take space */
  flex-grow: 1;
  margin-right: 0.5rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.linked-item-actions {
  /* Container for edit/unlink buttons */
  display: flex;
  gap: 0.3rem;
  flex-shrink: 0;
}

.linked-textbooks-empty {
  font-size: 0.8rem;
  color: var(--secondary);
  margin-left: 1rem;
  font-style: italic;
  margin-top: 0.5rem;
}

/* Updated btn-link for Edit/Unlink */
.btn-link {
  background: none;
  border: none;
  text-decoration: underline;
  padding: 0.1rem 0.2rem;
  font-size: 0.75rem;
  cursor: pointer;
}

.btn-link.text-danger {
  color: var(--danger);
}

.btn-link.text-danger:hover {
  color: #a00;
}

/* Darker red on hover */
.btn-link:disabled {
  color: #ccc;
  cursor: not-allowed;
  text-decoration: none;
}

.color-square {
  display: inline-block;
  width: 1em;
  height: 1em;
  border: 1px solid #ccc;
  margin-right: 0.5em;
  vertical-align: middle;
  flex-shrink: 0;
}

.class-main-info {
  align-items: center;
}
</style>
