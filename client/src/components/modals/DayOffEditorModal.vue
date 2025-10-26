<template>
  <div class="modal-overlay" @click.self="closeModal">
    <div class="modal-content">
      <button @click="closeModal" class="modal-close-btn">&times;</button>

      <h3>{{ isEditing ? "Edit Day Off" : "Add Day Off" }}</h3>
      <p v-if="isEditing && currentDayOff">
        <strong>{{ isRange ? "Date Range" : "Date" }}:</strong>
        {{ formattedDateDisplay }}
      </p>
      <hr />

      <div v-if="saveError" class="error-message">{{ saveError }}</div>

      <form @submit.prevent="handleSubmit" class="modal-form">
        <!-- Type Toggle (only shown when adding new) -->
        <div v-if="!isEditing" class="form-group">
          <label class="toggle-label">Type:</label>
          <div class="type-toggle">
            <button
              type="button"
              class="toggle-btn"
              :class="{ active: !isRangeMode }"
              @click="isRangeMode = false"
            >
              Single Day
            </button>
            <button
              type="button"
              class="toggle-btn"
              :class="{ active: isRangeMode }"
              @click="isRangeMode = true"
            >
              Date Range
            </button>
          </div>
        </div>

        <!-- Single Day Input -->
        <div v-if="!isRangeMode" class="form-group">
          <label for="day-off-date">Date <span class="required">*</span></label>
          <input
            type="date"
            id="day-off-date"
            v-model="formData.date"
            class="form-control form-control-sm"
            required
            :disabled="isLoading || isEditing"
          />
        </div>

        <!-- Date Range Inputs -->
        <div v-else>
          <div class="form-group">
            <label for="day-off-start-date"
              >Start Date <span class="required">*</span></label
            >
            <input
              type="date"
              id="day-off-start-date"
              v-model="formData.startDate"
              class="form-control form-control-sm"
              required
              :disabled="isLoading || isEditing"
            />
          </div>
          <div class="form-group">
            <label for="day-off-end-date"
              >End Date <span class="required">*</span></label
            >
            <input
              type="date"
              id="day-off-end-date"
              v-model="formData.endDate"
              class="form-control form-control-sm"
              required
              :disabled="isLoading || isEditing"
              :min="formData.startDate"
            />
          </div>
          <div
            v-if="formData.startDate && formData.endDate"
            class="day-count-hint"
          >
            {{ calculateDayCount() }} day{{
              calculateDayCount() !== 1 ? "s" : ""
            }}
          </div>
        </div>

        <!-- Common Fields -->
        <div class="form-group">
          <label for="day-off-reason">Reason (Optional)</label>
          <input
            type="text"
            id="day-off-reason"
            v-model="formData.reason"
            class="form-control form-control-sm"
            placeholder="e.g., Vacation, Holiday, Personal"
            :disabled="isLoading"
            maxlength="255"
          />
        </div>

        <div class="form-group">
          <label for="day-off-color">Color</label>
          <input
            type="color"
            id="day-off-color"
            v-model="formData.color"
            class="form-control form-control-sm form-control-color"
            :disabled="isLoading"
          />
        </div>

        <div class="modal-footer">
          <button
            type="button"
            class="btn btn-sm btn-secondary"
            @click="closeModal"
            :disabled="isLoading"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="btn btn-sm btn-primary"
            :disabled="isLoading"
          >
            {{ isLoading ? "Saving..." : isEditing ? "Update" : "Add" }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useStore } from "vuex";

const store = useStore();

// --- Props from modal data ---
// 🔧 FIX: Changed from store.state.ui.modals.dayOffEditor to using the getter
const modalData = computed(() =>
  store.getters["ui/getModalData"]("dayOffEditor"),
);
const currentDayOff = computed(() => modalData.value || null);
const isEditing = computed(() => !!currentDayOff.value);
const isRange = computed(() => {
  return (
    currentDayOff.value &&
    currentDayOff.value.startDate &&
    currentDayOff.value.endDate
  );
});

// --- Component State ---
const isLoading = ref(false);
const saveError = ref(null);
const isRangeMode = ref(false); // Toggle between single day and range (for new entries)

// --- Form Data ---
const formData = ref({
  date: "",
  startDate: "",
  endDate: "",
  reason: "",
  color: "#F0F0F0",
});

// --- Initialize Form ---
const initializeForm = () => {
  if (isEditing.value) {
    const dayOff = currentDayOff.value;
    formData.value = {
      date: dayOff.date || "",
      startDate: dayOff.startDate || "",
      endDate: dayOff.endDate || "",
      reason: dayOff.reason || "",
      color: dayOff.color || "#F0F0F0",
    };
    isRangeMode.value = isRange.value;
  } else {
    // Reset form for adding new
    formData.value = {
      date: "",
      startDate: "",
      endDate: "",
      reason: "",
      color: "#F0F0F0",
    };
    isRangeMode.value = false;
  }
  saveError.value = null;
};

// --- Computed Display Values ---
const formattedDateDisplay = computed(() => {
  if (isRange.value && currentDayOff.value) {
    return `${formatDate(currentDayOff.value.startDate)} - ${formatDate(currentDayOff.value.endDate)}`;
  } else if (currentDayOff.value) {
    return formatDate(currentDayOff.value.date);
  }
  return "";
});

// --- Methods ---
const closeModal = () => {
  console.log("Closing day off editor modal");
  store.dispatch("ui/closeModal", "dayOffEditor");
};

const handleSubmit = async () => {
  saveError.value = null;
  isLoading.value = true;

  try {
    if (isEditing.value) {
      // Update existing day off
      const updateData = {
        reason: formData.value.reason,
        color: formData.value.color,
      };

      // Note: We don't allow changing the date/range when editing
      // If you want to allow that, add startDate/endDate to updateData

      await store.dispatch("daysOff/updateDayOff", {
        id: currentDayOff.value.id,
        data: updateData,
      });
      console.log("Day off updated successfully");
    } else {
      // Add new day off
      const newDayOffData = {
        reason: formData.value.reason,
        color: formData.value.color,
      };

      if (isRangeMode.value) {
        // Validate range
        if (!formData.value.startDate || !formData.value.endDate) {
          saveError.value = "Both start and end dates are required for a range";
          isLoading.value = false;
          return;
        }
        if (formData.value.startDate > formData.value.endDate) {
          saveError.value = "Start date must be on or before end date";
          isLoading.value = false;
          return;
        }
        newDayOffData.startDate = formData.value.startDate;
        newDayOffData.endDate = formData.value.endDate;
      } else {
        // Single day
        if (!formData.value.date) {
          saveError.value = "Date is required";
          isLoading.value = false;
          return;
        }
        newDayOffData.date = formData.value.date;
      }

      await store.dispatch("daysOff/addDayOff", newDayOffData);
      console.log("Day off added successfully");
    }

    closeModal();
  } catch (error) {
    saveError.value =
      error.message ||
      `Failed to ${isEditing.value ? "update" : "add"} day off.`;
    console.error(
      `Error ${isEditing.value ? "updating" : "adding"} day off:`,
      error,
    );
  } finally {
    isLoading.value = false;
  }
};

const formatDate = (dateString) => {
  if (!dateString) return "";
  try {
    const date = new Date(dateString + "T00:00:00");
    if (isNaN(date.getTime())) return "Invalid Date";
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      weekday: "short",
    });
  } catch (e) {
    return "Invalid Date";
  }
};

const calculateDayCount = () => {
  if (!formData.value.startDate || !formData.value.endDate) return 0;

  const start = new Date(formData.value.startDate + "T00:00:00");
  const end = new Date(formData.value.endDate + "T00:00:00");
  const diffTime = Math.abs(end - start);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
};

// --- Lifecycle Hooks ---
const handleEscapeKey = (event) => {
  if (event.key === "Escape") {
    closeModal();
  }
};

onMounted(() => {
  initializeForm();
  document.addEventListener("keydown", handleEscapeKey);
});

onUnmounted(() => {
  document.removeEventListener("keydown", handleEscapeKey);
});
</script>

<style scoped>
/* Uses global modal styles */
.modal-content {
  min-width: 350px;
  max-width: 500px;
}

.modal-form {
  margin-top: 1rem;
}

h3 {
  margin: 0;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-color);
  font-weight: 600;
  font-size: 1.2rem;
}

p strong {
  font-weight: 600;
  color: var(--primary);
}

hr {
  border: none;
  border-top: 1px solid var(--border-color);
  margin: 1rem 0;
}

.required {
  color: var(--danger);
}

/* Type Toggle Styles */
.type-toggle {
  display: flex;
  gap: 0;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  overflow: hidden;
}

.toggle-btn {
  flex: 1;
  padding: 0.5rem 1rem;
  border: none;
  background-color: var(--background);
  color: var(--text);
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.toggle-btn:not(:last-child) {
  border-right: 1px solid var(--border-color);
}

.toggle-btn:hover {
  background-color: var(--hover-bg, #f0f0f0);
}

.toggle-btn.active {
  background-color: var(--primary);
  color: white;
  font-weight: 600;
}

.toggle-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

/* Day Count Hint */
.day-count-hint {
  font-size: 0.85rem;
  color: var(--secondary);
  margin-top: -0.5rem;
  margin-bottom: 1rem;
  font-style: italic;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border-color);
  margin-top: 1.5rem;
}

.form-control-sm {
  font-size: 0.9rem;
}

input[type="date"].form-control-sm {
  height: calc(1.5em + 0.6rem + 2px);
  line-height: 1.5;
  cursor: pointer;
}

textarea.form-control-sm {
  line-height: 1.5;
}

.error-message {
  color: var(--danger);
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: var(--border-radius);
  padding: 0.5rem 0.8rem;
  margin-bottom: 1rem;
  font-size: 0.875rem;
}

.btn-primary:disabled,
.btn-secondary:disabled,
.toggle-btn:disabled {
  cursor: not-allowed;
  opacity: 0.65;
}

.modal-footer .btn-sm {
  padding: 0.35rem 0.8rem;
  font-size: 0.875rem;
}

.form-control-color {
  width: 100px;
  height: 30px;
  padding: 0.1rem 0.2rem;
  cursor: pointer;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
}
</style>
