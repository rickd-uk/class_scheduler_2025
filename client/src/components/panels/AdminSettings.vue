<template>
  <div class="admin-settings-panel">
    <h3>Registration Settings</h3>
    <div class="setting-item">
      <label for="allowRegistrationToggle">Allow New User Registrations:</label>
      <input type="checkbox" id="allowRegistrationToggle" :checked="isRegistrationAllowed"
        @change="toggleRegistrationStatus" :disabled="isLoading" />
      <span v.if="isLoading"> (Loading...)</span>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useStore } from 'vuex';

const store = useStore();

const isRegistrationAllowed = computed(() => store.getters['globalSettings/isRegistrationAllowed']);
const isLoading = computed(() => store.state.globalSettings.isLoadingRegistrationStatus);

onMounted(() => {
  store.dispatch('globalSettings/fetchRegistrationStatus');
});

const toggleRegistrationStatus = async (event) => {
  try {
    await store.dispatch('globalSettings/updateRegistrationStatus', event.target.checked);
    // Optionally show a success message
  } catch (error) {
    // Optionally show an error message
    event.target.checked = !event.target.checked; // Revert UI on error
  }
};
</script>

<style scoped>
/* Add styles for your admin panel */
.setting-item {
  margin-bottom: 1rem;
}
</style>
