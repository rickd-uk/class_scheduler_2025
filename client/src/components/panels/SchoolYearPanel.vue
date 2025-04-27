<template>
  <div class="panel school-year-panel">
    <div class="panel-header">
      <h3 class="panel-title">School Year Info</h3>
      <button class="btn btn-sm btn-secondary" @click="openEditModal">Edit</button>
    </div>
    <div class="panel-body">
       <div v-if="isLoading" class="loading">Loading school year...</div>
       <div v-else-if="error" class="error-message">{{ error }}</div>
       <div v-else-if="schoolYear && schoolYear.startDate">
            <p><strong>Start Date:</strong> {{ formatDate(schoolYear.startDate) }}</p>
            <p><strong>End Date:</strong> {{ formatDate(schoolYear.endDate) }}</p>
            <div v-if="schoolYear.terms && schoolYear.terms.length > 0" class="terms-list">
                <strong>Terms:</strong>
                <ul>
                    <li v-for="(term, index) in schoolYear.terms" :key="index">
                       {{ term.name }}: {{ formatDate(term.startDate) }} - {{ formatDate(term.endDate) }}
                    </li>
                </ul>
            </div>
       </div>
        <p v-else class="placeholder-content">School year data not set.</p>
    </div>
     </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useStore } from 'vuex';

const store = useStore();

const schoolYear = computed(() => store.getters['schoolYear/currentSchoolYear']);
const isLoading = computed(() => store.getters['schoolYear/isLoading']);
const error = computed(() => store.getters['schoolYear/error']);

onMounted(() => {
  // Fetch only if data isn't already loaded
  if (!schoolYear.value?.startDate && !isLoading.value) {
    store.dispatch('schoolYear/fetchSchoolYear');
  }
});

const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString + 'T00:00:00');
     return date.toLocaleDateString(undefined, {
          year: 'numeric', month: 'short', day: 'numeric'
     });
}

const openEditModal = () => {
    console.log("Trigger Edit School Year Modal");
    // store.dispatch('ui/openModal', { modalName: 'schoolYearEditor', data: { ...schoolYear.value } }); // Example
}
</script>

<style scoped>
.panel-body p, .panel-body strong {
    margin-bottom: 0.5rem;
    font-size: 0.9rem;
}
.terms-list {
    margin-top: 0.75rem;
    font-size: 0.9rem;
}
.terms-list ul {
    list-style: none;
    padding-left: 1rem;
    margin-top: 0.25rem;
}
.terms-list li {
    margin-bottom: 0.25rem;
     color: var(--secondary);
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
