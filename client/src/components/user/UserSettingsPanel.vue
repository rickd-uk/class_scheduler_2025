<template>
  <div class="settings-panel">
    <div class="panel-header">
      <h2>User Settings</h2>
      <button class="btn-close" @click="$emit('close')" title="Close">✕</button>
    </div>

    <div class="settings-content">
      <div class="user-info-section">
        <h3>Account Information</h3>
        <div class="info-item">
          <label>Username:</label>
          <span>{{ currentUser?.username }}</span>
        </div>
        <div class="info-item" v-if="currentUser?.email">
          <label>Email:</label>
          <span>{{ currentUser?.email }}</span>
        </div>
        <div class="info-item">
          <label>Account Type:</label>
          <span>{{ currentUser?.isAdmin ? "Administrator" : "User" }}</span>
        </div>
      </div>

      <hr class="section-divider" />

      <div class="password-section">
        <ChangePasswordForm @close="$emit('close')" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useStore } from "vuex";
import ChangePasswordForm from "./ChangePasswordForm.vue";

const emit = defineEmits(["close"]);

const store = useStore();
const currentUser = computed(() => store.getters["auth/currentUser"]);
</script>

<style scoped>
.settings-panel {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  background-color: white;
  border-radius: var(--border-radius);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  background-color: var(--primary);
  color: white;
}

.panel-header h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.btn-close {
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  line-height: 1;
  transition: opacity 0.2s;
}

.btn-close:hover {
  opacity: 0.7;
}

.settings-content {
  padding: 2rem;
}

.user-info-section {
  margin-bottom: 1.5rem;
}

.user-info-section h3 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: var(--secondary);
  font-size: 1.1rem;
  font-weight: 600;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--border-color);
}

.info-item:last-child {
  border-bottom: none;
}

.info-item label {
  font-weight: 500;
  color: var(--secondary);
}

.info-item span {
  color: #333;
}

.section-divider {
  border: none;
  border-top: 2px solid var(--border-color);
  margin: 2rem 0;
}

.password-section {
  margin-top: 1.5rem;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .settings-panel {
    max-width: 100%;
    border-radius: 0;
  }

  .settings-content {
    padding: 1rem;
  }

  .info-item {
    flex-direction: column;
    gap: 0.25rem;
  }

  .info-item label {
    font-size: 0.9rem;
  }
}
</style>
