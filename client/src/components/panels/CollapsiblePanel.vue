<template>
  <div class="collapsible-panel">
    <div class="header" @click="toggle">
      <!-- 1) toggle icon -->
      <span class="toggle-icon">{{ isOpen ? '▾' : '▸' }}</span>

      <!-- 2) title slot, takes all remaining space -->
      <div class="title">
        <slot name="header"></slot>
      </div>

      <!-- 3) action slot, click.stop so it doesn’t re‐toggle -->
      <div class="actions" @click.stop>
        <slot name="actions"></slot>
      </div>
    </div>

    <div v-show="isOpen" class="body">
      <slot name="body"></slot>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
const isOpen = ref(true);
function toggle() {
  isOpen.value = !isOpen.value;
}
</script>

<style scoped>
.collapsible-panel {
  border: 1px solid var(--border-color);
  background: white;
  border-radius: var(--border-radius);
  overflow: hidden;
}

.header {
  display: flex;
  align-items: center;
  padding: 0.5rem 1rem;
  background: var(--light);
  cursor: pointer;
}

.toggle-icon {
  width: 1.2rem;
  text-align: center;
  user-select: none;
}

.title {
  flex: 1;
  text-align: center;
  font-weight: 600;
}

.actions {
  display: flex;
  gap: 0.5rem;
}

.body {
  padding: 1rem;
}
</style>
