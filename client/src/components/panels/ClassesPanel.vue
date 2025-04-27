<template>
  <div class="panel classes-panel">
    <div class="panel-header">
      <h3 class="panel-title">Manage Classes</h3>
      <button class="btn btn-sm btn-primary" @click="showAddForm = !showAddForm">
          {{ showAddForm ? 'Cancel' : 'Add Class' }}
      </button>
    </div>
    <div class="panel-body">
      <form v-if="showAddForm" @submit.prevent="handleAddClass" class="add-form">
          <h4>Add New Class</h4>
           <p v-if="addError" class="error-message">{{ addError }}</p>
          <div class="form-group">
              <label for="new-class-name">Name</label>
              <input type="text" id="new-class-name" v-model="newClass.name" required class="form-control form-control-sm">
          </div>
          <div class="form-group">
              <label for="new-class-subject">Subject</label>
              <input type="text" id="new-class-subject" v-model="newClass.subject" class="form-control form-control-sm">
          </div>
          <div class="form-group">
              <label for="new-class-grade">Grade Level</label>
              <input type="text" id="new-class-grade" v-model="newClass.gradeLevel" class="form-control form-control-sm">
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
                <span class="item-name">{{ cls.name }}</span>
                <span class="item-meta" v-if="cls.subject || cls.gradeLevel">
                    ({{ [cls.subject, cls.gradeLevel].filter(Boolean).join(', ') }})
                </span>
            </div>
            <div class="item-actions">
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

// Component State
const showAddForm = ref(false);
const isAdding = ref(false); // Loading state for add operation
const addError = ref(null); // Error specific to adding
const newClass = reactive({ // Use reactive for the form object
  name: '',
  subject: '',
  gradeLevel: ''
});

// Store State
const classes = computed(() => store.getters['classes/allClasses']);
const isLoading = computed(() => store.getters['classes/isLoading']); // Loading for fetching
const fetchError = computed(() => store.getters['classes/error']); // Error from fetching

// Methods
const resetForm = () => {
    newClass.name = '';
    newClass.subject = '';
    newClass.gradeLevel = '';
    addError.value = null;
    isAdding.value = false;
};

const handleAddClass = async () => {
    if (!newClass.name) {
        addError.value = "Class name is required.";
        return;
    }
    isAdding.value = true;
    addError.value = null; // Clear previous errors

    try {
        await store.dispatch('classes/addClass', { ...newClass });
        resetForm();
        showAddForm.value = false; // Hide form on success
    } catch (error) {
        addError.value = error.message || "Failed to add class.";
        isAdding.value = false; // Ensure loading state is reset on error
    }
};

// Lifecycle Hook
onMounted(() => {
  // Fetch classes when component mounts if not already loaded/loading
  if (classes.value.length === 0 && !isLoading.value) {
    store.dispatch('classes/fetchClasses');
  }
});

</script>

<style scoped>
.panel-body {
  max-height: 400px; /* Adjust height as needed */
  overflow-y: auto;
  padding-top: 0; /* Remove default padding if header is present */
}
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
.form-control-sm { /* Smaller form inputs */
    font-size: 0.875rem;
    padding: 0.3rem 0.6rem;
}
.add-form .form-group {
    margin-bottom: 0.75rem;
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
  padding: 0.6rem 0.2rem; /* Slightly more padding */
  border-bottom: 1px solid var(--border-color);
}
.item:last-child {
  border-bottom: none;
}
.item-details {
    display: flex;
    flex-direction: column; /* Stack name and meta */
    gap: 0.1rem;
}
.item-name {
    font-weight: 500;
}
.item-meta {
    font-size: 0.8rem;
    color: var(--secondary);
}
.item-actions {
   display: flex;
   gap: 0.5rem;
}
.btn-sm {
  padding: 0.2rem 0.5rem;
  font-size: 0.75rem;
}
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
    margin-bottom: 1rem; /* Add space below error */
}
</style>

