<template>
  <div class="modal-overlay" @click.self="closeModal">
    <div class="modal-content">
      <button @click="closeModal" class="modal-close-btn">&times;</button>
      <h3>Edit Exceptions for {{ formattedDate }}</h3>
      <div class="modal-body">
          <p class="placeholder-content">Daily exception editing form goes here.</p>
          </div>
      <div class="modal-footer">
          <button @click="closeModal" class="btn btn-secondary">Cancel</button>
          <button @click="saveChanges" class="btn btn-primary">Save Changes</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex';

const store = useStore();
const modalName = 'dailyException';

// Get data passed when opening the modal
const modalData = computed(() => store.getters['ui/getModalData'](modalName));
const date = computed(() => modalData.value?.date);
const existingException = computed(() => modalData.value?.exception);

const formattedDate = computed(() => {
    if (!date.value) return '';
    const d = new Date(date.value + 'T00:00:00');
    return d.toLocaleDateString(undefined, {
         weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
     });
});

const closeModal = () => {
  store.dispatch('ui/closeModal', modalName);
};

const saveChanges = () => {
    console.log("Saving daily exceptions for:", date.value);
    // 1. Get changes from form inputs
    // 2. Dispatch action to save/update exception in store/API
    // store.dispatch('schedule/saveException', { date: date.value, changes: [...] });
    closeModal(); // Close modal after saving
}

// Initialize form state based on existingException when modal opens
// watch(existingException, (newVal) => { ... setup form ... }, { immediate: true })

</script>

<style scoped>
/* Rely on global modal styles from main.css */
.modal-content {
    min-width: 500px; /* Example width */
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

