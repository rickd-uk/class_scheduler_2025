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
                <label>Class Type:</label>
                <div class="radio-group">
                    <label>
                        <input type="radio" v-model="newClass.classType" value="numbered" name="classType" @change="resetConditionalFields"> Numbered
                    </label>
                    <label>
                        <input type="radio" v-model="newClass.classType" value="special" name="classType" @change="resetConditionalFields"> Special
                    </label>
                </div>
            </div>

           <div v-if="newClass.classType === 'numbered'">
               <div class="form-group">
                  <label for="new-class-number">Class Number</label>
                  <select id="new-class-number" v-model="newClass.classNumber" required class="form-control form-control-sm">
                      <option disabled value="">Please select one</option>
                      <option v-for="n in 15" :key="n" :value="n">{{ n }}</option>
                  </select>
               </div>
               <div class="form-group">
                  <label for="new-year-level-numbered">Year Level</label>
                  <select id="new-year-level-numbered" v-model="newClass.yearLevel" required class="form-control form-control-sm">
                       <option disabled value="">Please select one</option>
                       <option v-for="n in 6" :key="`year-${n}`" :value="n">{{ n }}</option>
                  </select>
               </div>
           </div>

           <div v-if="newClass.classType === 'special'">
                <div class="form-group">
                    <label for="new-class-name">Special Class Name</label>
                    <input
                        type="text"
                        id="new-class-name"
                        v-model="newClass.className"
                        required
                        class="form-control form-control-sm"
                        placeholder="e.g., Global, Assembly"
                    />
                    <button type="button" @click="setClassName('Global')" class="btn btn-link btn-sm">Use "Global"</button>
                </div>
                 <div class="form-group">
                  <label for="new-year-level-special">Year Level (Optional)</label>
                  <select id="new-year-level-special" v-model="newClass.yearLevel" class="form-control form-control-sm">
                       <option value="">-- All Years --</option> <option v-for="n in 6" :key="`s-year-${n}`" :value="n">{{ n }}</option>
                  </select>
               </div>
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
                    <span v-if="cls.classType === 'numbered'" class="item-name">
                      {{ formatNumberedClassName(cls) }}
                    </span>
                    <span v-else-if="cls.classType === 'special'" class="item-name special-class-name">
                        {{ cls.className }}
                        <span v-if="cls.yearLevel" class="special-year-level">(Yr {{ cls.yearLevel }})</span>
                        <span v-else class="special-year-level">(All Years)</span>
                    </span>
                     <span v-else class="item-name">
                        Unknown Class Type
                    </span>
                </div>
                <div class="item-actions">
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
                           &times;
                        </button>
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
import { ref, reactive, computed, onMounted } from 'vue';
import { useStore } from 'vuex';

const store = useStore();

// --- Component State ---
const showAddForm = ref(false);
const isAdding = ref(false);
const addError = ref(null);
const deletingClassId = ref(null);
const deleteError = ref(null);
const unlinkingTextbookInfo = ref(null);
const linkError = ref(null);
const newClass = reactive({
  classType: 'numbered',
  classNumber: '',
  yearLevel: '',
  className: ''
});

// --- Store State ---
const classes = computed(() => store.getters['classes/allClasses']);
const isLoading = computed(() => store.getters['classes/isLoading']);
const fetchError = computed(() => store.getters['classes/error']);

// --- Methods ---
const resetConditionalFields = () => {
    newClass.classNumber = '';
    newClass.className = '';
    addError.value = null;
};
const resetForm = () => {
    resetConditionalFields();
    newClass.classType = 'numbered';
    newClass.yearLevel = '';
    isAdding.value = false;
};
const handleAddClass = async () => {
    isAdding.value = true;
    addError.value = null;
    let dataToSend = {
        classType: newClass.classType,
        yearLevel: newClass.yearLevel || null
    };
    if (newClass.classType === 'numbered') {
        if (!newClass.classNumber || !newClass.yearLevel) {
            addError.value = "Please select Class Number and Year Level for numbered classes.";
            isAdding.value = false; return;
        }
        dataToSend.classNumber = newClass.classNumber;
    } else if (newClass.classType === 'special') {
        if (!newClass.className || newClass.className.trim() === '') {
             addError.value = "Please enter a name for the special class.";
             isAdding.value = false; return;
        }
         dataToSend.className = newClass.className.trim();
    } else {
         addError.value = "Invalid class type selected.";
         isAdding.value = false; return;
    }
    try {
        await store.dispatch('classes/addClass', dataToSend);
        resetForm(); showAddForm.value = false;
    } catch (error) { addError.value = error.message || "Failed to add class."; }
    finally { isAdding.value = false; }
};

// Handles clicking the delete button for a class
const handleDeleteClass = async (id) => {
    console.log(`[ClassesPanel] handleDeleteClass called for ID: ${id}`); // Log 1
    // --- REMOVED Confirmation Dialog ---
    // if (!confirm(`Are you sure you want to delete this class?`)) {
    //      console.log(`[ClassesPanel] Deletion cancelled by user for ID: ${id}`); // Log 2 (if cancelled)
    //     return; // Stop if user cancels
    // }
    // console.log(`[ClassesPanel] Deletion confirmed (or bypassed) for ID: ${id}. Proceeding...`); // Log 3 (if confirmed/bypassed)
    // --- End Removal ---

    // Set loading state for the specific delete button
    deletingClassId.value = id;
    deleteError.value = null; // Clear previous delete errors

    try {
        console.log(`[ClassesPanel] Dispatching classes/deleteClass for ID: ${id}`); // Log 4
        // Dispatch action to delete the class via API
        await store.dispatch('classes/deleteClass', id); // <-- Ensure this dispatch exists
         console.log(`[ClassesPanel] Dispatch successful for ID: ${id}`); // Log 5
        // Class is removed from the list reactively by the store mutation
    } catch (error) {
        console.error(`[ClassesPanel] Error during delete dispatch for ID: ${id}`, error); // Log 6 (if error)
        // Set error message and show an alert if deleting fails
        deleteError.value = error.message || "Failed to delete class.";
        alert(`Error: ${deleteError.value}`); // Simple alert for now
    } finally {
        console.log(`[ClassesPanel] Resetting delete state for ID: ${id}`); // Log 7
        // Reset the loading state for the delete button
        deletingClassId.value = null;
    }
};

const handleUnlinkTextbook = async (classId, textbookId) => {
    // --- REMOVED Confirmation Dialog ---
    // if (!confirm(`Are you sure you want to unlink this textbook?`)) { return; }
    // --- End Removal ---
    unlinkingTextbookInfo.value = { classId, textbookId };
    linkError.value = null;
    try {
        await store.dispatch('classes/unlinkTextbook', { classId, textbookId });
    } catch (error) {
         linkError.value = error.message || "Failed to unlink textbook.";
         alert(`Error: ${linkError.value}`);
    } finally {
        unlinkingTextbookInfo.value = null;
    }
};
const openLinkModal = (cls) => {
    console.log("Opening link modal for class:", cls);
    store.dispatch('ui/openModal', { modalName: 'linkTextbookModal', data: cls });
};
const setClassName = (name) => { newClass.className = name; };

// --- Add Formatting Helper ---
const formatNumberedClassName = (cls) => {
    if (!cls || cls.classType !== 'numbered' || !cls.yearLevel || !cls.classNumber) {
        return 'Invalid Class'; // Fallback
    }
    const yearNum = parseInt(cls.yearLevel, 10);
    const displayYear = yearNum <= 3 ? yearNum : yearNum - 3; // Calculate 1, 2, 3 for HS years
    const schoolSuffix = yearNum <= 3 ? 'J' : 'H'; // J for Junior High, H for High School
    return `${displayYear}${schoolSuffix}-${cls.classNumber}`;
};



// --- Lifecycle Hook ---
onMounted(() => {
  if (classes.value.length === 0 && !isLoading.value) { store.dispatch('classes/fetchClasses'); }
  if (store.getters['textbooks/allTextbooks'].length === 0) { store.dispatch('textbooks/fetchTextbooks'); }
});

</script>

<style scoped>
/* Add styles for radio group and special class name */
.add-form .radio-group { display: flex; gap: 1rem; margin-bottom: 1rem; align-items: center; }
.add-form .radio-group label { display: flex; align-items: center; gap: 0.3rem; font-weight: normal; cursor: pointer; margin-bottom: 0; }
.add-form .radio-group input[type="radio"] { margin-top: 0; margin-right: 0.2rem; }
.special-class-name { font-style: italic; color: var(--primary); }
.special-year-level { font-size: 0.8em; color: var(--secondary); margin-left: 0.5em; }
.btn-link { background: none; border: none; color: var(--primary); text-decoration: underline; padding: 0.2rem; font-size: 0.8rem; cursor: pointer; margin-left: 0.5rem; }
.btn-link:hover { color: var(--primary-dark); }
.panel-body { max-height: 400px; overflow-y: auto; padding-top: 0; }
.add-form { padding: 1rem; margin-bottom: 1rem; border: 1px solid var(--border-color); border-radius: var(--border-radius); background-color: var(--light); }
.add-form h4 { margin-top: 0; margin-bottom: 1rem; font-size: 1rem; font-weight: 600; }
select.form-control-sm, input.form-control-sm { font-size: 0.875rem; padding: 0.3rem 0.6rem; }
select.form-control-sm { height: calc(1.5em + 0.6rem + 2px); line-height: 1.5; }
.add-form .form-group { margin-bottom: 0.75rem; }
.item-list { list-style: none; padding: 0; margin: 0; }
.class-item { padding: 0.6rem 0.2rem; border-bottom: 1px solid var(--border-color); }
.class-item:last-child { border-bottom: none; }
.class-main-info { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
.item-details { display: flex; flex-direction: column; gap: 0.1rem; flex-shrink: 1; min-width: 0; margin-right: 0.5rem; }
.item-name { font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.item-actions { display: flex; gap: 0.5rem; flex-shrink: 0; }
.btn-sm { padding: 0.2rem 0.5rem; font-size: 0.75rem; }
.loading, .error-message, .placeholder-content { padding: 1rem; text-align: center; color: var(--secondary); font-size: 0.9rem; }
.error-message { color: var(--danger); background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: var(--border-radius); margin-bottom: 1rem; }
.btn-danger:disabled, .btn-info:disabled { cursor: not-allowed; opacity: 0.65; }
.linked-textbooks { font-size: 0.85rem; margin-left: 1rem; padding-left: 0.5rem; border-left: 2px solid var(--border-color); margin-top: 0.5rem; padding-top: 0.3rem; }
.linked-textbooks strong { font-weight: 600; color: var(--secondary); }
.linked-textbooks ul { list-style: none; padding: 0; margin-top: 0.25rem; }
.linked-textbooks li { display: flex; justify-content: space-between; align-items: center; padding: 0.15rem 0; color: #555; }
.linked-textbooks-empty { font-size: 0.8rem; color: var(--secondary); margin-left: 1rem; font-style: italic; margin-top: 0.5rem; }
.btn-unlink { background: none; border: none; color: var(--danger); cursor: pointer; font-size: 1.1rem; line-height: 1; padding: 0 0.3rem; margin-left: 0.5rem; }
.btn-unlink:hover { color: var(--dark); }
.btn-unlink:disabled { color: #ccc; cursor: not-allowed; }
</style>
