<template>
  <div class="panel textbooks-panel">
     <div class="panel-header">
      <h3 class="panel-title">Manage Textbooks</h3>
      <button class="btn btn-sm btn-primary" @click="openAddModal">Add Textbook</button>
    </div>
    <div class="panel-body">
       <div v-if="isLoading" class="loading">Loading textbooks...</div>
       <div v-else-if="error" class="error-message">{{ error }}</div>
      <ul v-else-if="textbooks.length > 0" class="item-list">
         <li v-for="book in textbooks" :key="book.id" class="item">
            <span>{{ book.title }} ({{ book.subject }})</span>
            <div class="item-actions">
               <button class="btn btn-sm btn-secondary" @click="openEditModal(book)">Edit</button>
               <button class="btn btn-sm btn-danger" @click="deleteTextbook(book.id)">Del</button>
            </div>
         </li>
      </ul>
        <p v-else class="placeholder-content">No textbooks defined yet.</p>
    </div>
     </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useStore } from 'vuex';

const store = useStore();

const textbooks = computed(() => store.getters['textbooks/allTextbooks']);
const isLoading = computed(() => store.getters['textbooks/isLoading']);
const error = computed(() => store.getters['textbooks/error']);

onMounted(() => {
  if (textbooks.value.length === 0 && !isLoading.value) {
    store.dispatch('textbooks/fetchTextbooks');
  }
});

const openAddModal = () => {
  console.log("Trigger Add Textbook Modal");
  // store.dispatch('ui/openModal', { modalName: 'textbookEditor', data: null }); // Example
};

const openEditModal = (book) => {
  console.log("Trigger Edit Textbook Modal for:", book);
  // store.dispatch('ui/openModal', { modalName: 'textbookEditor', data: { ...book } }); // Example
};

const deleteTextbook = (id) => {
  if (confirm('Are you sure you want to delete this textbook?')) {
    console.log("Trigger Delete Textbook:", id);
    // store.dispatch('textbooks/deleteTextbook', id); // Example
  }
};
</script>

<style scoped>
.panel-body {
  max-height: 300px; /* Example max height */
  overflow-y: auto;
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
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--border-color);
}
.item:last-child {
  border-bottom: none;
}
.item-actions {
   display: flex;
   gap: 0.5rem;
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

