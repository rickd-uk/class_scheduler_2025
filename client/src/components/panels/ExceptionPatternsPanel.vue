<template>
  <div class="panel exception-patterns-panel">
    <div class="panel-header">
      <h3 class="panel-title">Exceptions</h3>
      <button class="btn btn-sm btn-primary" @click="openAddModal">
        +
      </button>
    </div>
    <div class="panel-body">
      <div v-if="isLoading" class="loading">Loading patterns...</div>
      <div v-else-if="error" class="error-message">{{ error }}</div>
      <ul v-else-if="patterns.length > 0" class="item-list">
        <li v-for="pattern in patterns" :key="pattern.id" class="item">
          <div class="item-details">
            <span class="item-name">{{ pattern.name }}</span>
          </div>
          <div class="item-actions">
            <button class="btn btn-sm btn-secondary" @click="openEditModal(pattern)" title="Edit Pattern">
              Edit
            </button>
            <button class="btn btn-sm btn-danger" @click="handleDeletePattern(pattern.id)"
              :disabled="deletingPatternId === pattern.id">
              {{ deletingPatternId === pattern.id ? 'Deleting...' : 'Del' }}
            </button>
          </div>
        </li>
      </ul>
      <p v-else class="placeholder-content">No exception patterns created yet.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';

const store = useStore();

const isAdminUser = computed(() => !!store.getters['auth/currentUser']?.isAdmin)

// --- Component State ---
const deletingPatternId = ref(null); // Tracks ID of pattern being deleted for UI feedback
const deleteError = ref(null); // Stores errors related to deleting

// --- Store State ---
// Computed properties to get data from the exceptionPatterns store module
//const patterns = computed(() => store.getters['exceptionPatterns/personalPatterns']);

const patterns = computed(() => {
  return isAdminUser.value
    // admins get everything (global + personal)
    ? store.getters['exceptionPatterns/allPatterns']
    // everyone else only their own non-global ones
    : store.getters['exceptionPatterns/personalPatterns']
})

const isLoading = computed(() => store.getters['exceptionPatterns/isLoading']);
const error = computed(() => store.getters['exceptionPatterns/error']);

// --- Methods ---

// Opens the modal for adding a new pattern (passes null data)
const openAddModal = () => {
  console.log("Opening exception pattern modal in ADD mode");
  store.dispatch('ui/openModal', {
    modalName: 'exceptionPatternEditor', // Name matches the modal component and UI store state key
    data: null // Indicate 'Add' mode
  });
};

// Opens the modal for editing an existing pattern (passes pattern data)
const openEditModal = (pattern) => {
  console.log("Opening exception pattern modal in EDIT mode for:", pattern);
  store.dispatch('ui/openModal', {
    modalName: 'exceptionPatternEditor',
    data: pattern // Pass the pattern object (Vuex action will deep copy)
  });
};

// Handles deleting a pattern
const handleDeletePattern = async (id) => {
  // Set loading state for the specific delete button
  deletingPatternId.value = id;
  deleteError.value = null; // Clear previous errors
  try {
    // Dispatch action to delete the pattern via API and update store
    await store.dispatch('exceptionPatterns/deletePattern', id);
    // Pattern is removed reactively by the store mutation
  } catch (error) {
    // Set error message and show an alert
    deleteError.value = error.message || "Failed to delete pattern.";
    alert(`Error: ${deleteError.value}`); // Simple alert for now
  } finally {
    // Reset loading state for the button
    deletingPatternId.value = null;
  }
};

// Optional helper function to summarize pattern data for display
// const summarizePattern = (data) => {
//     if (!data || !Array.isArray(data)) return '';
//     const definedPeriods = data.filter(p => p !== null && p.classId !== null).length;
//     const totalPeriods = data.length;
//     return `${definedPeriods} of ${totalPeriods} periods defined`;
// }

// --- Lifecycle Hook ---
onMounted(() => {
  // Fetch patterns when the component is first mounted if they aren't already loaded
  if (patterns.value.length === 0 && !isLoading.value) {
    store.dispatch('exceptionPatterns/fetchPatterns');
  }
});
</script>

<style scoped>
/* Styles similar to other panels */
.panel-body {
  max-height: 300px;
  overflow-y: auto;
  padding-top: 0;
}

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
  flex-direction: column;
  gap: 0.1rem;
  flex-grow: 1;
  min-width: 0;
  margin-right: 0.5rem;
}

.item-name {
  font-weight: 500;
  font-size: 0.9rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-meta {
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
}

.btn-danger:disabled,
.btn-secondary:disabled {
  cursor: not-allowed;
  opacity: 0.65;
}
</style>
