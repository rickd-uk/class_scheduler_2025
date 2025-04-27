<template>
  <div class="register-form">
    <h2>Register</h2>
    <form @submit.prevent="handleRegister">
       <p v-if="authError" class="error-message">{{ authError }}</p>
        <p v-if="validationError" class="error-message">{{ validationError }}</p>

      <div class="form-group">
        <label for="register-username">Username</label>
        <input
          type="text"
          id="register-username"
          v-model="username"
          required
          class="form-control"
           :disabled="isLoading"
           @input="clearErrors"
        />
      </div>

       <div class="form-group">
        <label for="register-email">Email</label>
        <input
          type="email"
          id="register-email"
          v-model="email"
          required
          class="form-control"
           :disabled="isLoading"
           @input="clearErrors"
        />
      </div>

      <div class="form-group">
        <label for="register-password">Password</label>
        <input
          type="password"
          id="register-password"
          v-model="password"
          required
          class="form-control"
           :disabled="isLoading"
           @input="clearErrors"
        />
      </div>

       <div class="form-group">
        <label for="register-confirm-password">Confirm Password</label>
        <input
          type="password"
          id="register-confirm-password"
          v-model="confirmPassword"
          required
          class="form-control"
           :disabled="isLoading"
           @input="clearErrors"
        />
      </div>

      <button type="submit" class="btn btn-primary" :disabled="isLoading || !isFormValid">
         <span v-if="isLoading">Registering...</span>
        <span v-else>Register</span>
      </button>

      <p class="mt-3">
        Already have an account?
        <a @click.prevent="$emit('toggle')" href="#" class="toggle-link">Login</a>
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
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const validationError = ref(null) // Specific form validation error

const isLoading = computed(() => store.getters['auth/isLoading'])
const authError = computed(() => store.getters['auth/error'])

const isFormValid = computed(() => {
    return username.value.trim() && email.value.trim() && password.value && password.value === confirmPassword.value;
})

const handleRegister = async () => {
  if (isLoading.value) return;

  // Basic client-side validation
  validationError.value = null; // Clear previous validation errors
  if (password.value !== confirmPassword.value) {
    validationError.value = "Passwords do not match.";
    return;
  }
   if (password.value.length < 6) { // Example minimum length
    validationError.value = "Password must be at least 6 characters long.";
    return;
  }
  // Add more validation as needed (e.g., email format)

  try {
    await store.dispatch('auth/register', {
      username: username.value.trim(),
      email: email.value.trim(),
      password: password.value // Send only one password
    })
    // Registration successful: Router guard or App.vue watcher should handle redirection/state changes.
  } catch (err) {
     // Error is already set in the store by the action
    console.error('Register component caught error:', err.message)
     // We might want to clear passwords fields on error
     password.value = '';
     confirmPassword.value = '';
  }
}

// Clear errors when user types
const clearErrors = () => {
    validationError.value = null;
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

