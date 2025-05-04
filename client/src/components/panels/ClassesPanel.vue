<template>
  <div class="panel classes-panel">
    <div class="panel-header">
      <h3 class="panel-title">Classes</h3>
      <button class="btn btn-sm btn-primary" @click="openAddModal">
          +
      </button>
    </div>
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
                   <button
                      class="btn btn-sm btn-secondary"
                      @click="openEditModal(cls)"
                      title="Edit Class">
                      Edit
                    </button>
                   <button
                      class="btn btn-sm btn-info"
                      @click="openLinkModal(cls)"
                      title="Link Textbooks">
                      Link
                    </button>
                   <button
                      class="btn btn-sm btn-danger"
                      @click="handleDeleteClass(cls.id)"
                      :disabled="deletingClassId === cls.id" >
                       {{ deletingClassId === cls.id ? 'Deleting...' : 'Del' }}
                    </button>
                </div>
            </div>
            <div v-if="cls.textbooks && cls.textbooks.length > 0" class="linked-textbooks"> </div>
            <div v-else class="linked-textbooks-empty"> No textbooks linked. </div>
         </li>
      </ul>
       <p v-else class="placeholder-content">No classes defined yet. Click 'Add Class' to start.</p>
    </div>
    </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useStore } from 'vuex';

const store = useStore();

// --- Component State ---
// Removed state related to inline add form
const deletingClassId = ref(null);
const deleteError = ref(null);
const unlinkingTextbookInfo = ref(null);
const linkError = ref(null);

// --- Store State ---
const classes = computed(() => store.getters['classes/allClasses']);
const isLoading = computed(() => store.getters['classes/isLoading']);
const fetchError = computed(() => store.getters['classes/error']);

// --- Methods ---

// Method to open the modal for adding a new class
const openAddModal = () => {
    console.log("Opening class modal in ADD mode");
    store.dispatch('ui/openModal', {
        modalName: 'classFormModal', // Use the new modal name
        data: null // Pass null data to indicate 'Add' mode
    });
};

// Method to open the modal for editing an existing class
const openEditModal = (cls) => {
    console.log("Opening class modal in EDIT mode for:", cls);
    store.dispatch('ui/openModal', {
        modalName: 'classFormModal', // Use the new modal name
        data: cls // Pass the existing class data
    });
};

// Delete handler remains the same (no confirmation)
const handleDeleteClass = async (id) => {
    console.log(`[ClassesPanel] handleDeleteClass called for ID: ${id}`);
    deletingClassId.value = id; deleteError.value = null;
    try {
        console.log(`[ClassesPanel] Dispatching classes/deleteClass for ID: ${id}`);
        await store.dispatch('classes/deleteClass', id);
        console.log(`[ClassesPanel] Dispatch successful for ID: ${id}`);
    } catch (error) {
        console.error(`[ClassesPanel] Error during delete dispatch for ID: ${id}`, error);
        deleteError.value = error.message || "Failed to delete class.";
        alert(`Error: ${deleteError.value}`);
    } finally {
        console.log(`[ClassesPanel] Resetting delete state for ID: ${id}`);
        deletingClassId.value = null;
    }
};

// Unlink handler remains the same (no confirmation)
const handleUnlinkTextbook = async (classId, textbookId) => {
    unlinkingTextbookInfo.value = { classId, textbookId }; linkError.value = null;
    try { await store.dispatch('classes/unlinkTextbook', { classId, textbookId }); }
    catch (error) { linkError.value = error.message || "Failed to unlink textbook."; alert(`Error: ${linkError.value}`); }
    finally { unlinkingTextbookInfo.value = null; }
};

// Open Link modal remains the same
const openLinkModal = (cls) => {
    console.log("Opening link modal for class:", cls);
    store.dispatch('ui/openModal', { modalName: 'linkTextbookModal', data: cls });
};

// Formatting helper for numbered classes
const formatNumberedClassName = (cls) => {
    if (!cls || cls.classType !== 'numbered' || !cls.yearLevel || !cls.classNumber) { return '?'; }
    const yearNum = parseInt(cls.yearLevel, 10);
    const displayYear = yearNum <= 3 ? yearNum : yearNum - 3;
    const schoolSuffix = yearNum <= 3 ? 'J' : 'H';
    return `${displayYear}${schoolSuffix}-${cls.classNumber}`;
};

// --- Lifecycle Hook ---
onMounted(() => {
  if (classes.value.length === 0 && !isLoading.value) { store.dispatch('classes/fetchClasses'); }
  if (store.getters['textbooks/allTextbooks'].length === 0) { store.dispatch('textbooks/fetchTextbooks'); }
});

</script>

<style scoped>
/* Styles remain largely the same, remove .add-form styles if desired */
.panel-body { max-height: 400px; overflow-y: auto; padding-top: 0; }
.item-list { list-style: none; padding: 0; margin: 0; }
.class-item { padding: 0.6rem 0.2rem; border-bottom: 1px solid var(--border-color); }
.class-item:last-child { border-bottom: none; }
.class-main-info { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
.item-details { display: flex; flex-direction: column; gap: 0.1rem; flex-shrink: 1; min-width: 0; margin-right: 0.5rem; }
.item-name { font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.special-class-name { font-style: italic; color: var(--primary); }
.special-year-level { font-size: 0.8em; color: var(--secondary); margin-left: 0.5em; }
.item-actions { display: flex; gap: 0.5rem; flex-shrink: 0; }
.btn-sm { padding: 0.2rem 0.5rem; font-size: 0.75rem; }
.loading, .error-message, .placeholder-content { padding: 1rem; text-align: center; color: var(--secondary); font-size: 0.9rem; }
.error-message { color: var(--danger); background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: var(--border-radius); margin-bottom: 1rem; }
.btn-danger:disabled, .btn-info:disabled, .btn-secondary:disabled { cursor: not-allowed; opacity: 0.65; }
.linked-textbooks { font-size: 0.85rem; margin-left: 1rem; padding-left: 0.5rem; border-left: 2px solid var(--border-color); margin-top: 0.5rem; padding-top: 0.3rem; }
.linked-textbooks strong { font-weight: 600; color: var(--secondary); }
.linked-textbooks ul { list-style: none; padding: 0; margin-top: 0.25rem; }
.linked-textbooks li { display: flex; justify-content: space-between; align-items: center; padding: 0.15rem 0; color: #555; }
.linked-textbooks-empty { font-size: 0.8rem; color: var(--secondary); margin-left: 1rem; font-style: italic; margin-top: 0.5rem; }
.btn-unlink { background: none; border: none; color: var(--danger); cursor: pointer; font-size: 1.1rem; line-height: 1; padding: 0 0.3rem; margin-left: 0.5rem; }
.btn-unlink:hover { color: var(--dark); }
.btn-unlink:disabled { color: #ccc; cursor: not-allowed; }
.color-square { display: inline-block; width: 1em; height: 1em; border: 1px solid #ccc; margin-right: 0.5em; vertical-align: middle; flex-shrink: 0; }
.class-main-info { align-items: center; }
</style>

