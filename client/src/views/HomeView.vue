<template>
  <div class="home">
    </div>
</template>

<script setup>
// No specific script needed usually if App.vue handles the main content display
import { onMounted } from 'vue';

onMounted(() => {
    console.log("HomeView mounted.");
    // Initial data loading is handled in App.vue based on auth state
});
</script>

<style scoped>
.home {
  /* Add styling for dashboard content if you put any here */
  padding: 1rem;
}
</style>

