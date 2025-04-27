<template>
  <div class="panel days-off-panel">
    <div class="panel-header">
      <h3 class="panel-title">Manage Days Off</h3>
       </div>
    <div class="panel-body">
      <div v-if="isLoading" class="loading">Loading days off...</div>
      <div v-else-if="error" class="error-message">{{ error }}</div>
      <ul v-else-if="daysOff.length > 0" class="item-list">
         <li v-for="day in daysOff" :key="day.date" class="item">
            <span>{{ formatDate(day.date) }}: {{ day.reason }}</span>
            <div class="item-actions">
                </div>
         </li>
      </ul>
       <p v-else class="placeholder-content">No specific days off configured (excluding weekends/schedule gaps).</p>
       </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';

const store = useStore();

// Data for adding new day off
const newDayOffDate = ref('');
const newDayOffReason = ref('');

const daysOff = computed(() => store.getters['daysOff/allDaysOff']);
const isLoading = computed(() => store.getters['daysOff/isLoading']);
const error = computed(() => store.getters['daysOff/error']);

onMounted(() => {
  if (daysOff.value.length === 0 && !isLoading.value) {
    store.dispatch('daysOff/fetchDaysOff');
  }
});

const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString + 'T00:00:00');
     return date.toLocaleDateString(undefined, {
          year: 'numeric', month: 'short', day: 'numeric'
     });
}

const addDayOff = () => {
    if (!newDayOffDate.value) return;
    const dayOffData = {
        date: newDayOffDate.value,
        reason: newDayOffReason.value || 'Day Off'
    };
    console.log("Trigger Add Day Off:", dayOffData);
    // store.dispatch('daysOff/addDayOff', dayOffData); // Example
    newDayOffDate.value = '';
    newDayOffReason.value = '';
}

const deleteDayOff = (date) => {
   if (confirm(`Are you sure you want to remove ${formatDate(date)} as a day off?`)) {
      console.log("Trigger Delete Day Off:", date);
    // store.dispatch('daysOff/deleteDayOff', date); // Example
   }
}
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
   font-size: 0.9rem;
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
.add-form {
    display: flex;
    gap: 0.5rem;
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid var(--border-color);
}
.add-form input[type="date"] {
    flex-basis: 120px;
    padding: 0.2rem 0.4rem;
}
 .add-form input[type="text"] {
    flex-grow: 1;
     padding: 0.2rem 0.4rem;
}
.loading, .error-message {
    padding: 1rem;
    text-align: center;
    color: var(--secondary);
}
</style>

