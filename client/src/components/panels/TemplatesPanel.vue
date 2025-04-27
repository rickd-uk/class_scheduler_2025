<template>
  <div class="panel templates-panel">
     <div class="panel-header">
      <h2 class="panel-title">Schedule Templates</h2>
       <button class="btn btn-primary btn-sm" @click="openAddModal">Create New Template</button>
    </div>

     <div v-if="isLoading" class="loading">Loading templates...</div>
     <div v-else-if="error" class="error-message">{{ error }}</div>
      <div v-else-if="templates.length > 0" class="templates-list">
         <div v-for="template in templates" :key="template.id" class="template-item card">
             <div class="card-header">
                 <h3 class="card-title">{{ template.name }}</h3>
                 <div class="template-actions">
                     <button class="btn btn-success btn-sm" @click="applyTemplate(template.id)" :disabled="isApplying">
                        {{ isApplying ? 'Applying...' : 'Apply' }}
                    </button>
                     <button class="btn btn-secondary btn-sm" @click="openEditModal(template)">Edit</button>
                     <button class="btn btn-danger btn-sm" @click="deleteTemplate(template.id)">Delete</button>
                 </div>
             </div>
             <div class="card-body">
                 <p class="placeholder-content">Template details for {{ template.name }}</p>
             </div>
         </div>
      </div>
      <p v-else class="placeholder-content">No schedule templates saved yet.</p>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';

const store = useStore();

const templates = computed(() => store.getters['templates/allTemplates']);
const isLoading = computed(() => store.getters['templates/isLoading']);
const error = computed(() => store.getters['templates/error']);
const isApplying = ref(false); // Local state for applying feedback

onMounted(() => {
  if (templates.value.length === 0 && !isLoading.value) {
    store.dispatch('templates/fetchTemplates');
  }
});


const openAddModal = () => {
    console.log("Trigger Add Template Modal");
    store.dispatch('ui/openModal', { modalName: 'templateEditor', data: null });
};

const openEditModal = (template) => {
    console.log("Trigger Edit Template Modal for:", template);
    // Pass a deep copy to avoid modifying store state directly in modal
    store.dispatch('ui/openModal', { modalName: 'templateEditor', data: JSON.parse(JSON.stringify(template)) });
};

const applyTemplate = async (id) => {
    if (isApplying.value) return;
    if (confirm('Are you sure you want to apply this template? This will overwrite your current regular weekly schedule.')) {
        isApplying.value = true;
        console.log("Trigger Apply Template:", id);
        try {
             await store.dispatch('templates/applyTemplate', id);
             // Success notification handled within the action potentially
        } catch(err) {
             // Error notification handled within the action potentially
            console.error("Failed to apply template from panel:", err);
        } finally {
            isApplying.value = false;
        }
    }
};

const deleteTemplate = (id) => {
  if (confirm('Are you sure you want to delete this template?')) {
    console.log("Trigger Delete Template:", id);
    // store.dispatch('templates/deleteTemplate', id); // Example
  }
};
</script>

<style scoped>
.panel-header {
    margin-bottom: 1.5rem; /* More space below header */
}
.templates-list {
    display: grid;
    gap: 1rem;
}
.template-item.card {
    margin-bottom: 0; /* Remove default card margin */
    padding: 0; /* Remove default card padding, use header/body */
}
.template-item .card-header {
    padding: 0.75rem 1rem;
    background-color: var(--light);
    border-bottom: 1px solid var(--border-color);
    border-radius: var(--border-radius) var(--border-radius) 0 0;
}
.template-item .card-title {
    font-size: 1rem;
    font-weight: 600;
}
.template-actions {
    display: flex;
    gap: 0.5rem;
}
.template-item .card-body {
    padding: 1rem;
}
.btn-sm {
  padding: 0.2rem 0.5rem;
  font-size: 0.75rem;
}
.loading, .error-message {
    padding: 1rem;
    text-align: center;
    color: var(--secondary);
}
</style>

