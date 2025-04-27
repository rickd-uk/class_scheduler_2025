<template>
  <div class="modal-overlay" @click.self="closeModal">
    <div class="modal-content">
       <button @click="closeModal" class="modal-close-btn">&times;</button>
      <h3>Edit Regular Weekly Schedule</h3>
      <div class="modal-body">
           <p class="placeholder-content">Weekly schedule editor component/form goes here.</p>
            </div>
       <div class="modal-footer">
          <button @click="closeModal" class="btn btn-secondary">Cancel</button>
          <button @click="saveSchedule" class="btn btn-primary">Save Schedule</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useStore } from 'vuex';

const store = useStore();
const modalName = 'weeklySchedule';

// Get data passed when opening the modal
const modalData = computed(() => store.getters['ui/getModalData'](modalName));

// Form state - represents the schedule being edited
const editedSchedule = ref({});

watch(modalData, (newData) => {
     // Load the current schedule into the editor state when modal opens
    if (newData) {
        editedSchedule.value = JSON.parse(JSON.stringify(newData)); // Deep copy
         console.log("Weekly Schedule Modal Data Loaded:", editedSchedule.value);
    } else {
        editedSchedule.value = {}; // Reset if no data passed
    }
}, { immediate: true, deep: true });


const closeModal = () => {
  store.dispatch('ui/closeModal', modalName);
};

const saveSchedule = () => {
    console.log("Saving weekly schedule:", editedSchedule.value);
    // 1. Get updated schedule data from form/editor component
    // 2. Dispatch action to save schedule in store/API
    // store.dispatch('schedule/updateRegularSchedule', editedSchedule.value);
    closeModal(); // Close modal after saving
}
</script>

<style scoped>
/* Rely on global modal styles from main.css */
.modal-content {
     min-width: 800px; /* Example width */
     max-width: 95%;
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

