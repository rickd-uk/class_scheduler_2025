<template>
  <div class="login-form">
    <h2>Login</h2>
    <form @submit.prevent="handleLogin">
      <p v-if="authError" class="error-message">{{ authError }}</p>

      <div class="form-group">
        <label for="login-username">Username</label>
        <input
          type="text"
          id="login-username"
          v-model="username"
          required
          class="form-control"
          :disabled="isLoading"
          @input="clearAuthError"
        />
      </div>

      <div class="form-group">
        <label for="login-password">Password</label>
        <input
          type="password"
          id="login-password"
          v-model="password"
          required
          class="form-control"
          :disabled="isLoading"
           @input="clearAuthError"
        />
      </div>

      <button type="submit" class="btn btn-primary" :disabled="isLoading">
        <span v-if="isLoading">Logging in...</span>
        <span v-else>Login</span>
      </button>

      <p class="mt-3">
        Don't have an account?
        <a @click.prevent="$emit('toggle')" href="#" class="toggle-link">Register</a>
      </p>
    </form>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useStore } from 'vuex'

// Define emitted events
const emit = defineEmits(['toggle'])

const store = useStore()

const username = ref('')
const password = ref('')

// Use specific getters for clarity
const isLoading = computed(() => store.getters['auth/isLoading'])
const authError = computed(() => store.getters['auth/error'])

const handleLogin = async () => {
  if (isLoading.value) return; // Prevent multiple submissions

  try {
    await store.dispatch('auth/login', {
      username: username.value.trim(),
      password: password.value
    })
    // Login successful: The router guard or App.vue watcher should handle redirection/state changes.
    // No need to push router here generally.
  } catch (err) {
    // Error is already set in the store by the action
    console.error('Login component caught error:', err.message)
    // Optionally, focus the first field with an error
  }
}

// Clear auth error when user starts typing
const clearAuthError = () => {
    if(authError.value) {
        store.dispatch('auth/clearError');
    }
}

</script>

<style scoped>
/* Use styles from main.css, add specific overrides if needed */
h2 {
  margin-top: 0;
  margin-bottom: 1.5rem;
  text-align: center;
  font-weight: 600;
}

.btn-primary {
  width: 100%; /* Make button full width */
  padding-top: 0.75rem;
  padding-bottom: 0.75rem;
  font-size: 1rem;
}

p.mt-3 {
  text-align: center;
  font-size: 0.9rem;
  color: var(--secondary);
}
</style>

