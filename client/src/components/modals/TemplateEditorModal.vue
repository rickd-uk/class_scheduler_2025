<template>
  <div class="modal-overlay" @click.self="closeModal">
    <div class="modal-content">
       <button @click="closeModal" class="modal-close-btn">&times;</button>
      <h3>{{ isEditing ? 'Edit Template' : 'Create New Template' }}</h3>
       <div class="modal-body">
          <div class="form-group">
              <label for="template-name">Template Name</label>
              <input type="text" id="template-name" v-model="templateName" class="form-control"/>
          </div>
          <p class="placeholder-content">Template schedule editor (e.g., weekly grid) goes here.</p>
          </div>
       <div class="modal-footer">
          <button @click="closeModal" class="btn btn-secondary">Cancel</button>
          <button @click="saveTemplate" class="btn btn-primary">{{ isEditing ? 'Update Template' : 'Create Template' }}</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useStore } from 'vuex';

const store = useStore();
const modalName = 'templateEditor';

// Get data passed when opening the modal
const modalData = computed(() => store.getters['ui/getModalData'](modalName));
const isEditing = computed(() => !!modalData.value?.id); // Check if editing existing template

// Form state
const templateId = ref(null);
const templateName = ref('');
const templateSchedule = ref({}); // Structure matching schedule module { monday: [], ... }

watch(modalData, (newData) => {
    if (newData) {
        templateId.value = newData.id || null;
        templateName.value = newData.name || '';
        templateSchedule.value = newData.schedule || {}; // Reset or load existing
         console.log("Modal Data Loaded:", newData);
    } else {
        // Reset form when modal closes or opens for creation
        templateId.value = null;
        templateName.value = '';
        templateSchedule.value = {};
    }
}, { immediate: true, deep: true }); // Deep watch might be needed for schedule object


const closeModal = () => {
  store.dispatch('ui/closeModal', modalName);
};

const saveTemplate = () => {
    console.log("Saving template:", templateName.value);
    const templateData = {
        id: templateId.value, // Will be null for new templates
        name: templateName.value,
        schedule: templateSchedule.value // Get schedule data from form/editor component
    };

    if (isEditing.value) {
        // store.dispatch('templates/updateTemplate', templateData);
         console.log("Dispatching updateTemplate:", templateData);
    } else {
        // store.dispatch('templates/addTemplate', templateData); // Need to handle ID assignment
         console.log("Dispatching addTemplate:", templateData);
    }
    closeModal(); // Close modal after saving
}

</script>

<style scoped>
/* Rely on global modal styles from main.css */
.modal-content {
    min-width: 700px; /* Example width */
    max-width: 90%;
}
.modal-body {
    margin-top: 1rem;
    margin-bottom: 1.5rem;
}
.modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
     padding-top: 1rem;
    border-top: 1px solid var(--border-color);
}
h3 {
    margin: 0;
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--border-color);
}
</style>

