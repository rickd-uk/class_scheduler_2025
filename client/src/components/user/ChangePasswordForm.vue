<template>
  <div class="change-password-form">
    <h3>Change Password</h3>

    <div v-if="passwordChangeSuccess" class="success-message">
      <p>✓ Password changed successfully!</p>
    </div>

    <form @submit.prevent="handlePasswordChange" v-if="!passwordChangeSuccess">
      <p v-if="passwordChangeError" class="error-message">
        {{ passwordChangeError }}
      </p>
      <p v-if="validationError" class="error-message">{{ validationError }}</p>

      <div class="form-group">
        <label for="current-password">Current Password</label>
        <input
          type="password"
          id="current-password"
          v-model="currentPassword"
          required
          class="form-control"
          :disabled="isChangingPassword"
          @input="clearErrors"
        />
      </div>

      <div class="form-group">
        <label for="new-password">New Password</label>
        <input
          type="password"
          id="new-password"
          v-model="newPassword"
          required
          class="form-control"
          :disabled="isChangingPassword"
          @input="clearErrors"
        />
      </div>

      <div class="form-group">
        <label for="confirm-password">Confirm New Password</label>
        <input
          type="password"
          id="confirm-password"
          v-model="confirmPassword"
          required
          class="form-control"
          :disabled="isChangingPassword"
          @input="clearErrors"
        />
      </div>

      <div class="button-group">
        <button
          type="submit"
          class="btn btn-primary"
          :disabled="isChangingPassword || !isFormValid"
        >
          <span v-if="isChangingPassword">Changing Password...</span>
          <span v-else>Change Password</span>
        </button>
        <button
          type="button"
          class="btn btn-secondary"
          @click="cancelChange"
          :disabled="isChangingPassword"
        >
          Cancel
        </button>
      </div>
    </form>

    <button
      v-if="passwordChangeSuccess"
      class="btn btn-primary"
      @click="resetForm"
    >
      Close
    </button>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useStore } from "vuex";

const emit = defineEmits(["close"]);

const store = useStore();

const currentPassword = ref("");
const newPassword = ref("");
const confirmPassword = ref("");
const validationError = ref(null);

const isChangingPassword = computed(
  () => store.getters["user/isChangingPassword"],
);
const passwordChangeError = computed(
  () => store.getters["user/passwordChangeError"],
);
const passwordChangeSuccess = computed(
  () => store.getters["user/passwordChangeSuccess"],
);

const isFormValid = computed(() => {
  return (
    currentPassword.value &&
    newPassword.value &&
    confirmPassword.value &&
    newPassword.value === confirmPassword.value &&
    newPassword.value.length >= 6
  );
});

const handlePasswordChange = async () => {
  if (isChangingPassword.value) return;

  // Client-side validation
  validationError.value = null;

  if (newPassword.value !== confirmPassword.value) {
    validationError.value = "New passwords do not match.";
    return;
  }

  if (newPassword.value.length < 6) {
    validationError.value = "New password must be at least 6 characters long.";
    return;
  }

  if (currentPassword.value === newPassword.value) {
    validationError.value =
      "New password must be different from current password.";
    return;
  }

  try {
    await store.dispatch("user/changePassword", {
      currentPassword: currentPassword.value,
      newPassword: newPassword.value,
    });

    // Clear form on success
    currentPassword.value = "";
    newPassword.value = "";
    confirmPassword.value = "";
  } catch (err) {
    console.error("Password change component caught error:", err.message);
  }
};

const clearErrors = () => {
  validationError.value = null;
  if (passwordChangeError.value) {
    store.dispatch("user/clearPasswordChangeStatus");
  }
};

const cancelChange = () => {
  currentPassword.value = "";
  newPassword.value = "";
  confirmPassword.value = "";
  validationError.value = null;
  store.dispatch("user/clearPasswordChangeStatus");
  emit("close");
};

const resetForm = () => {
  currentPassword.value = "";
  newPassword.value = "";
  confirmPassword.value = "";
  validationError.value = null;
  store.dispatch("user/clearPasswordChangeStatus");
  emit("close");
};
</script>

<style scoped>
.change-password-form {
  max-width: 400px;
  margin: 0 auto;
  padding: 1.5rem;
  background-color: white;
  border-radius: var(--border-radius);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

h3 {
  margin-top: 0;
  margin-bottom: 1.5rem;
  text-align: center;
  font-weight: 600;
  color: var(--primary);
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: var(--secondary);
}

.form-control {
  width: 100%;
  padding: 0.75rem;
  font-size: 1rem;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  box-sizing: border-box;
}

.form-control:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.1);
}

.form-control:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.button-group {
  display: flex;
  gap: 0.5rem;
  margin-top: 1.5rem;
}

.btn {
  flex: 1;
  padding: 0.75rem 1rem;
  font-size: 1rem;
  border: none;
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background-color: var(--primary);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: var(--primary-dark);
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #5a6268;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  padding: 0.75rem;
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
  border-radius: var(--border-radius);
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.success-message {
  padding: 1rem;
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
  border-radius: var(--border-radius);
  margin-bottom: 1rem;
  text-align: center;
}

.success-message p {
  margin: 0;
  font-weight: 500;
  font-size: 1rem;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .change-password-form {
    max-width: 100%;
    padding: 1rem;
  }

  .button-group {
    flex-direction: column;
  }

  .btn {
    width: 100%;
  }
}
</style>
