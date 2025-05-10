<template>
  <div class="panel daily-schedule-panel">
    <div class="panel-header date-navigation">
      <button @click="goToPreviousMonth" class="nav-button month-nav" title="Previous Month">&lt;&lt;</button>
      <button @click="goToPreviousDay" class="nav-button day-nav" title="Previous Day">&lt;</button>

      <div class="date-display-container">
        <h2 class="panel-title date-title" @click="showDatePicker = !showDatePicker" title="Click to select date">
          {{ formattedDate || 'Select Date' }}
        </h2>
        <span v-if="relativeDateString" class="relative-date-indicator">
          ({{ relativeDateString }})
        </span>
      </div>

      <input v-if="showDatePicker" type="date" v-model="selectedDate" @change="onDatePicked"
        class="form-control date-picker-overlay" @blur="showDatePicker = false" ref="datePickerInput" />

      <button @click="goToNextDay" class="nav-button day-nav" title="Next Day">&gt;</button>
      <button @click="goToNextMonth" class="nav-button month-nav" title="Next Month">&gt;&gt;</button>
    </div>

    <hr class="header-divider" />

    <div v-if="isLoading" class="loading">Loading schedule...</div>
    <div v-else-if="error" class="error-message">{{ error }}</div>

    <div v-else>
      <!-- Day Off Notice -->
      <div v-if="isDayOff" class="day-off-notice" :style="{ backgroundColor: dayOffColor || '#F0F0F0' }"
        :class="{ 'has-dark-background': isDarkColor(dayOffColor) }">
        <h3>Day Off</h3>
        <p>{{ dayOffReason }}</p>
      </div>

      <!-- Otherwise show schedule or placeholder -->
      <template v-else>
        <ul v-if="dailySchedule.length" class="daily-schedule-list">
          <li v-for="(item, idx) in dailySchedule" :key="idx" class="schedule-list-item"
            :style="{ backgroundColor: item.color || 'transparent' }"
            :class="{ 'has-dark-background': isDarkColor(item.color) }">
            <span class="item-text">
              {{ item.time }} – {{ item.className || item.notes || 'Scheduled Item' }}
              <span v-if="item.duration">({{ item.duration }} min)</span>
              <span v-if="item.isException" class="exception-tag">(Modified)</span>
            </span>
          </li>
        </ul>
        <p v-else class="placeholder-content">
          No schedule for {{ formattedDate || 'selected date' }}.
        </p>
        <div class="exception-controls mt-3">
          <button class="btn btn-secondary btn-sm" @click="openExceptionModal">
            Edit Exceptions for {{ formattedDate }}
          </button>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { useStore } from 'vuex';

const store = useStore();

// Helpers for dates
const toYYYYMMDD = date => {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().split('T')[0];
};
const getTodayDateString = () => toYYYYMMDD(new Date());
const formatDate = ds => {
  if (!ds.match(/^\d{4}-\d{2}-\d{2}$/)) return 'Invalid Date';
  const [y, m, d] = ds.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
};
const dateToWeekday = ds => {
  const d = new Date(ds + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
};
const periodTimes = ['09:00', '10:00', '11:00', '12:00', '13:30', '14:00'];
const isDarkColor = hex => {
  if (!hex || hex.length < 7) return false;
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.5;
};

// Reactive state
const saved = store.getters['ui/lastDailySelectedDate'];
const isLoading = ref(false);
const error = ref(null);
const showDatePicker = ref(false);
const datePickerInput = ref(null);

// Vuex getters
const getScheduleForDay = day => store.getters['schedule/getScheduleForDay'](day) || [];
const getAppliedExceptionForDate = date => store.getters['schedule/getAppliedExceptionForDate'](date)

const personalDaysOff = computed(() => store.getters['daysOff/allDaysOff']);
const personalExceptions = computed(() => store.getters['schedule/appliedExceptions']);
const classesList = computed(() => store.getters['classes/allClasses']);
const globalDaysOff = computed(() => store.getters['globalDaysOff/allGlobalDaysOff']);
const applyGlobalDaysOff = computed(() => store.getters['globalSettings/shouldApplyGlobalDaysOff']);

// Computed for date display
const formattedDate = computed(() => formatDate(selectedDate.value));
const relativeDateString = computed(() => {
  const today = getTodayDateString();
  if (selectedDate.value === today) return 'Today';
  const diff = (new Date(selectedDate.value) - new Date(today)) / 86400000;
  if (diff === -1) return 'Yesterday';
  if (diff === 1) return 'Tomorrow';
  return '';
});

const selectedDate = computed({
  get() {
    // pull store or default to today if unset 
    return store.getters['ui/lastDailySelectedDate'] || getTodayDateString();
  },
  set(newDate) {
    // keep Vuex in sync whenever you change days 
    store.dispatch('ui/setLastDailyDate', newDate);
  }
});
// Day off logic
const isDayOff = computed(() => {
  if (applyGlobalDaysOff.value && globalDaysOff.value.some(d => d.date === selectedDate.value)) return true;
  return personalDaysOff.value.some(d => d.date === selectedDate.value);
});
const dayOffColor = computed(() => {
  const g = applyGlobalDaysOff.value && globalDaysOff.value.find(d => d.date === selectedDate.value);
  if (g) return g.color;
  const p = personalDaysOff.value.find(d => d.date === selectedDate.value);
  return p?.color || '#F0F0F0';
});
const dayOffReason = computed(() => {
  const g = applyGlobalDaysOff.value && globalDaysOff.value.find(d => d.date === selectedDate.value);
  if (g) return g.reason || 'Day Off';
  const p = personalDaysOff.value.find(d => d.date === selectedDate.value);
  return p?.reason || 'Day Off';
});


const dailySchedule = computed(() => {
  const wd = dateToWeekday(selectedDate.value)
  let slots = getScheduleForDay(wd)

  // --- apply only the single exception for this exact date ---
  const exc = getAppliedExceptionForDate(selectedDate.value)
  if (exc) {
    if (exc.isDayOff) {
      slots = Array(6).fill(null)
    } else if (exc.exceptionPatternId) {
      slots = exc.ExceptionPattern.patternData.map(pid =>
        pid != null ? { classId: pid } : null
      )
    } else if (exc.periodIndex != null) {
      slots = slots.map((s, i) =>
        i === exc.periodIndex
          ? { classId: exc.classId, notes: exc.reason }
          : s
      )
    }
  }

  return slots
    .map((slot, idx) => {
      if (!slot || !slot.classId) return null
      const cls = classesList.value.find(c => c.id === slot.classId)
      const className = cls
        ? cls.classType === 'numbered'
          ? `${(cls.yearLevel <= 3 ? cls.yearLevel : cls.yearLevel - 3)}${(cls.yearLevel <= 3 ? 'J' : 'H')}-${cls.classNumber}`
          : cls.className
        : slot.notes
      return {
        time: periodTimes[idx] || `P${idx + 1}`,
        className,
        color: cls?.color,
        isException: !!exc && exc.periodIndex === idx,
        notes: slot.notes
      }
    })
    .filter(x => x)
})


// Navigation
const changeDay = n => { const d = new Date(selectedDate.value); d.setDate(d.getDate() + n); selectedDate.value = toYYYYMMDD(d); };
const changeMonth = n => { const d = new Date(selectedDate.value); d.setDate(1); d.setMonth(d.getMonth() + n); selectedDate.value = toYYYYMMDD(d); };
const goToPreviousDay = () => changeDay(-1);
const goToNextDay = () => changeDay(1);
const goToPreviousMonth = () => changeMonth(-1);
const goToNextMonth = () => changeMonth(1);

// Open exception modal
const openExceptionModal = () => {
  store.dispatch('ui/openModal', {
    modalName: 'dailyException',
    data: { date: selectedDate.value, exception: personalExceptions.value.find(e => e.date === selectedDate.value) || null }
  });
};

// DatePicker focus
const onDatePicked = () => showDatePicker.value = false;
onMounted(() => {/* no actual load needed */ });
watch(showDatePicker, async val => { if (val) { await nextTick(); datePickerInput.value?.focus(); try { datePickerInput.value.showPicker() } catch { } } });
</script>

<style scoped>
/* Styles for the panel */
.panel-body {
  max-height: 400px;
  overflow-y: auto;
  padding-top: 0;
}

/* Styles for the list display */
.daily-schedule-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.schedule-list-item {
  padding: 0.6rem 0.8rem;
  border-bottom: 1px solid var(--border-color);
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.5em;
  transition: background-color 0.3s ease;
  color: #333;
  border-radius: 4px;
  margin-bottom: 2px;
}

.schedule-list-item:last-child {
  border-bottom: none;
}

.schedule-list-item.has-dark-background {
  color: #f8f9fa;
}

.schedule-list-item.has-dark-background .exception-tag {
  color: #333;
  background-color: rgba(255, 255, 255, 0.8);
}

.exception-tag {
  font-size: 0.8em;
  color: var(--warning);
  font-weight: bold;
  margin-left: 0.5em;
  background-color: #fff3cd;
  padding: 0.1em 0.4em;
  border-radius: 3px;
}

/* Styles for the Day Off notice */
.day-off-notice {
  border-left: 5px solid var(--border-color);
  transition: background-color 0.3s ease, border-left-color 0.3s ease;
  color: #333;
  padding: 1.5rem;
  background-color: var(--light);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  text-align: center;
  margin-top: 1rem;
}

.day-off-notice.has-dark-background {
  color: #f8f9fa;
}

.day-off-notice.has-dark-background h3 {
  color: #f8f9fa;
}

.day-off-notice h3 {
  margin-top: 0;
  margin-bottom: 0.5rem;
  color: var(--secondary);
}

/* Styles for the exception edit button area */
.exception-controls {
  text-align: center;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
}

/* Styles for loading/error/placeholder messages */
.loading,
.error-message,
.placeholder-content {
  padding: 1rem;
  text-align: center;
  color: var(--secondary);
  font-size: 0.9rem;
}

.error-message {
  color: var(--danger);
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: var(--border-radius);
}

/* Updated Header Styles */
.panel-header.date-navigation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: nowrap;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  position: relative;
}

.date-display-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-grow: 1;
}

.date-title {
  margin: 0;
  font-weight: 600;
  font-size: 1.1rem;
  text-align: center;
  cursor: pointer;
  padding: 0.2rem 0.5rem;
  border-radius: var(--border-radius);
  transition: background-color 0.2s;
}

.date-title:hover {
  background-color: #eee;
}

.relative-date-indicator {
  font-size: 0.8rem;
  color: var(--secondary);
  font-weight: normal;
  margin-top: -2px;
}

.nav-button {
  background: none;
  border: 1px solid transparent;
  padding: 0.1rem 0.5rem;
  font-size: 1.2rem;
  font-weight: bold;
  line-height: 1;
  cursor: pointer;
  color: var(--primary);
  border-radius: 4px;
  transition: background-color 0.2s;
}

.nav-button:hover {
  background-color: #e0e0e0;
}

.nav-button.month-nav {
  font-size: 1rem;
}

.date-picker-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 10;
  padding: 0.3rem 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: 0.9rem;
  max-width: 180px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}

.header-divider {
  border: none;
  border-top: 1px solid var(--border-color);
  margin-top: 0.5rem;
  margin-bottom: 1rem;
}

.item-text {
  flex-grow: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
