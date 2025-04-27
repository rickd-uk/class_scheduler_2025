<template>
  <div class="modal-overlay" @click.self="closeModal">
    <div class="modal-content large"> <button @click="closeModal" class="modal-close-btn">&times;</button>
      <h3>Edit Regular Weekly Schedule</h3>
      <p class="instructions">Select a class for each period, or leave as "No Class" for empty slots.</p>
      <hr>

      <div class="modal-body">
          <div v-if="isLoadingClasses || isLoadingSchedule" class="loading">Loading data...</div>
          <div v-else-if="scheduleError || classesError" class="error-message">
              {{ scheduleError || classesError || 'Error loading data.' }}
          </div>

          <div v-else class="schedule-grid-container">
              <table class="schedule-grid-table">
                  <thead>
                      <tr>
                          <th>Period</th>
                          <th v-for="day in daysOfWeek" :key="day">{{ capitalize(day) }}</th>
                      </tr>
                  </thead>
                  <tbody>
                      <tr v-for="period in periods" :key="period">
                          <td>Period {{ period }}</td>
                          <td v-for="day in daysOfWeek" :key="`${day}-${period}`">
                              <select
                                v-model="editableSchedule[day][period - 1]"
                                class="form-control form-control-sm period-select"
                                :disabled="isSaving"
                              >
                                  <option :value="null">-- No Class --</option>
                                  <option v-for="cls in availableClasses" :key="cls.id" :value="cls.id">
                                      Yr {{ cls.yearLevel }} - Cls {{ cls.classNumber }}
                                  </option>
                              </select>
                          </td>
                      </tr>
                  </tbody>
              </table>
          </div>
      </div>

       <div class="modal-footer">
          <p v-if="saveError" class="error-message footer-error">{{ saveError }}</p>
          <button @click="closeModal" type="button" class="btn btn-secondary btn-sm" :disabled="isSaving">Cancel</button>
          <button @click="saveSchedule" class="btn btn-primary btn-sm" :disabled="isSaving">
             {{ isSaving ? 'Saving...' : 'Save Schedule' }}
          </button>
      </div>
    </div>
  </div>
</template>

<script setup>
// Import nextTick
import { ref, reactive, computed, watch, onMounted, nextTick } from 'vue';
import { useStore } from 'vuex';

const store = useStore();
const modalName = 'weeklySchedule';

// --- Component State ---
const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
const periods = [1, 2, 3, 4, 5, 6];
const isSaving = ref(false);
const saveError = ref(null);

// Reactive object to hold the schedule being edited
const editableSchedule = reactive({});

// Initialize the reactive object structure
const initializeSchedule = () => {
    daysOfWeek.forEach(day => {
        editableSchedule[day] = Array(periods.length).fill(null);
    });
     console.log("Initialized editableSchedule:", JSON.parse(JSON.stringify(editableSchedule)));
};
initializeSchedule(); // Call on setup

// --- Store State ---
const modalData = computed(() => store.getters['ui/getModalData'](modalName));
const availableClasses = computed(() => store.getters['classes/allClasses']);
const isLoadingClasses = computed(() => store.getters['classes/isLoading']);
const classesError = computed(() => store.getters['classes/error']);
const isLoadingSchedule = computed(() => store.getters['schedule/isLoading']);
const scheduleError = computed(() => store.getters['schedule/error']);

// --- Watchers ---
watch(modalData, (currentSchedule) => {
    console.log("Weekly Schedule Modal received data:", currentSchedule);
    saveError.value = null;
    initializeSchedule(); // Ensure structure is ready

    if (currentSchedule && typeof currentSchedule === 'object') {
        daysOfWeek.forEach(day => {
            if (currentSchedule[day] && Array.isArray(currentSchedule[day])) {
                 const daySchedule = currentSchedule[day].map(item => item ? item.classId : null);
                 while (daySchedule.length < periods.length) { daySchedule.push(null); }
                 editableSchedule[day] = daySchedule.slice(0, periods.length);
            } else {
                 editableSchedule[day] = Array(periods.length).fill(null);
            }
        });
         console.log("Populated editableSchedule:", JSON.parse(JSON.stringify(editableSchedule)));
    } else {
        console.log("No schedule data passed, using initialized empty schedule.");
    }

    if (availableClasses.value.length === 0 && !isLoadingClasses.value) {
        store.dispatch('classes/fetchClasses');
    }
}, { immediate: true, deep: true });


// --- Methods ---
const closeModal = () => {
  if (isSaving.value) return;
  store.dispatch('ui/closeModal', modalName);
};

const saveSchedule = async () => {
    console.log("Attempting to save weekly schedule:", JSON.parse(JSON.stringify(editableSchedule)));
    isSaving.value = true;
    saveError.value = null;

    const scheduleToSave = {};
    daysOfWeek.forEach(day => {
        scheduleToSave[day] = editableSchedule[day].map(classId => {
            return classId ? { classId: classId } : null;
        });
    });
    console.log("Formatted schedule for saving:", scheduleToSave);

    try {
        await store.dispatch('schedule/updateRegularSchedule', scheduleToSave);
        console.log("Schedule save dispatch successful. Calling closeModal via nextTick..."); // Updated Log
        // Wrap closeModal in nextTick
        nextTick(() => {
            closeModal(); // Close modal after the next DOM update cycle
        });
    } catch (error) {
        console.error("Error saving weekly schedule:", error);
        saveError.value = error.message || "Failed to save schedule.";
    } finally {
        // Reset saving state slightly later if needed, but usually okay here
        isSaving.value = false;
    }
};

// Helper to capitalize day names
const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

</script>

<style scoped>
/* Styles remain the same */
.modal-content.large { min-width: 80vw; max-width: 1200px; }
.modal-body { margin-top: 1rem; margin-bottom: 1.5rem; }
.instructions { font-size: 0.9rem; color: var(--secondary); margin-top: -0.5rem; margin-bottom: 1rem; }
h3 { margin: 0; padding-bottom: 1rem; border-bottom: 1px solid var(--border-color); }
hr { border: none; border-top: 1px solid var(--border-color); margin: 1rem 0; }
.modal-footer { display: flex; justify-content: flex-end; align-items: center; gap: 0.75rem; padding-top: 1rem; border-top: 1px solid var(--border-color); }
.footer-error { margin-right: auto; margin-bottom: 0; padding: 0.3rem 0.6rem; font-size: 0.8rem; }
.schedule-grid-container { overflow-x: auto; }
.schedule-grid-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
.schedule-grid-table th, .schedule-grid-table td { border: 1px solid var(--border-color); padding: 0.3rem; text-align: center; vertical-align: middle; font-size: 0.85rem; min-width: 100px; }
.schedule-grid-table th { background-color: var(--light); font-weight: 600; padding: 0.5rem 0.3rem; }
.schedule-grid-table td { height: 55px; }
.period-select { width: 100%; padding: 0.2rem; font-size: 0.8rem; border: 1px solid #ccc; border-radius: 4px; background-color: #fff; }
.period-select:disabled { background-color: #eee; cursor: not-allowed; }
.loading, .error-message { padding: 1rem; text-align: center; color: var(--secondary); }
.error-message { color: var(--danger); background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: var(--border-radius); }
.btn-primary:disabled { cursor: not-allowed; opacity: 0.65; }
</style>

