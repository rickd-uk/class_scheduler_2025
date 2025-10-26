<template>
  <div class="panel daily-schedule-panel">
    <div class="panel-header date-navigation">
      <button
        @click="goToPreviousMonth"
        class="nav-button month-nav"
        title="Previous Month"
      >
        &lt;&lt;
      </button>
      <button
        @click="goToPreviousDay"
        class="nav-button day-nav"
        title="Previous Day"
      >
        &lt;
      </button>

      <div class="date-display-container">
        <h2
          class="panel-title date-title"
          @click="showDatePicker = !showDatePicker"
          title="Click to select date"
        >
          {{ formattedDate || "Select Date" }}
        </h2>
        <span v-if="relativeDateString" class="relative-date-indicator">
          ({{ relativeDateString }})
        </span>
      </div>

      <input
        v-if="showDatePicker"
        type="date"
        v-model="selectedDate"
        @change="onDatePicked"
        class="form-control date-picker-overlay"
        @blur="showDatePicker = false"
        ref="datePickerInput"
      />

      <button @click="goToNextDay" class="nav-button day-nav" title="Next Day">
        &gt;
      </button>
      <button
        @click="goToNextMonth"
        class="nav-button month-nav"
        title="Next Month"
      >
        &gt;&gt;
      </button>
    </div>

    <hr class="header-divider" />

    <div v-if="isLoading" class="loading">Loading schedule...</div>
    <div v-else-if="error" class="error-message">{{ error }}</div>

    <div v-else>
      <!-- Day Off Notice -->
      <div
        v-if="isDayOff"
        class="day-off-notice"
        :style="{ backgroundColor: dayOffColor || '#F0F0F0' }"
        :class="{ 'has-dark-background': isDarkColor(dayOffColor) }"
      >
        <h3>Day Off</h3>
        <p>{{ dayOffReason }}</p>
      </div>

      <!-- Otherwise show schedule or placeholder -->
      <template v-else>
        <ul v-if="dailySchedule.length" class="daily-schedule-list">
          <li
            v-for="(item, idx) in dailySchedule"
            :key="idx"
            class="schedule-list-item"
            :style="{
              backgroundColor: item.isDisabled
                ? '#f5f5f5'
                : item.color || 'transparent',
              opacity: item.isDisabled ? 0.5 : 1,
            }"
            :class="{
              'schedule-list-item': true,
              'exception-item': item.isException,
              'disabled-item': item.isDisabled,
              'has-dark-background':
                !item.isDisabled && isDarkColor(item.color),
            }"
          >
            <!-- Toggle Switch -->
            <div class="toggle-container">
              <label
                class="toggle-switch"
                :title="
                  item.isDisabled ? 'Enable this class' : 'Disable this class'
                "
              >
                <input
                  type="checkbox"
                  :checked="!item.isDisabled"
                  @change="toggleClass(item.periodIndex, item)"
                  :disabled="togglingPeriod === item.periodIndex"
                />
                <span class="toggle-slider"></span>
              </label>
            </div>

            <span
              class="item-text"
              :style="{
                textDecoration: item.isDisabled ? 'line-through' : 'none',
              }"
            >
              {{ item.time }} –
              {{ item.className || item.notes || "Scheduled Item" }}
              <span v-if="item.duration">({{ item.duration }} min)</span>
              <span
                v-if="item.isException && !item.isDisabled"
                class="exception-badge"
                >Exception</span
              >
              <!-- <span v-if="item.isDisabled" class="disabled-badge"
                >Disabled</span
              > -->
            </span>

            <!-- Note Icon -->
            <button
              @click.stop="openNoteModal(selectedDate, item.periodIndex)"
              class="note-icon"
              :class="{ 'has-note': hasNote(selectedDate, item.periodIndex) }"
              title="Add note"
            >
              📝
            </button>
          </li>
        </ul>
        <p v-else class="placeholder-content">
          No schedule for {{ formattedDate || "selected date" }}.
        </p>
        <div v-if="dailySchedule.length" class="exception-controls mt-3">
          <button class="btn btn-secondary btn-sm" @click="openExceptionModal">
            Edit Exceptions
          </button>
        </div>
      </template>
    </div>

    <!-- Note Modal -->
    <ClassNoteModal
      :show="noteModal.show"
      :note="noteModal.currentNote"
      @close="closeNoteModal"
      @save="saveClassNote"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from "vue";
import { useStore } from "vuex";
import { findDayOffForDate, getDayRangeInfo } from "../../utils/daysOffUtils";
import ClassNoteModal from "./ClassNoteModal.vue";

const store = useStore();

// Helpers for dates
const toYYYYMMDD = (date) => {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().split("T")[0];
};
const getTodayDateString = () => toYYYYMMDD(new Date());
const formatDate = (ds) => {
  if (!ds.match(/^\d{4}-\d{2}-\d{2}$/)) return "Invalid Date";
  const [y, m, d] = ds.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};
const dateToWeekday = (ds) => {
  const d = new Date(ds + "T12:00:00");
  return d.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
};
const periodTimes = ["09:00", "10:00", "11:00", "12:00", "13:30", "14:30"];
const isDarkColor = (hex) => {
  if (!hex || hex.length < 7) return false;
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.5;
};

// Reactive state
const isLoading = ref(false);
const error = ref(null);
const showDatePicker = ref(false);
const datePickerInput = ref(null);
const togglingPeriod = ref(null);
const noteModal = ref({
  show: false,
  date: null,
  periodIndex: null,
  currentNote: "",
});

// Vuex getters
const getScheduleForDay = (day) =>
  store.getters["schedule/getScheduleForDay"](day) || [];
const getAppliedExceptionForDate = (date) =>
  store.getters["schedule/getAppliedExceptionForDate"](date);

const personalDaysOff = computed(() => store.getters["daysOff/allDaysOff"]);
const personalExceptions = computed(
  () => store.getters["schedule/appliedExceptions"],
);
const classesList = computed(() => store.getters["classes/allClasses"]);
const globalDaysOff = computed(
  () => store.getters["globalDaysOff/allGlobalDaysOff"],
);
const applyGlobalDaysOff = computed(
  () => store.getters["globalSettings/shouldApplyGlobalDaysOff"],
);

// Computed for date display
const formattedDate = computed(() => formatDate(selectedDate.value));
const relativeDateString = computed(() => {
  const today = getTodayDateString();
  if (selectedDate.value === today) return "Today";
  const diff = (new Date(selectedDate.value) - new Date(today)) / 86400000;
  if (diff === -1) return "Yesterday";
  if (diff === 1) return "Tomorrow";
  return "";
});

const selectedDate = computed({
  get() {
    return store.getters["ui/lastDailySelectedDate"] || getTodayDateString();
  },
  set(newDate) {
    store.dispatch("ui/setLastDailyDate", newDate);
  },
});

// Day off logic
const isDayOff = computed(() => {
  const allDaysOff = applyGlobalDaysOff.value
    ? [...globalDaysOff.value, ...personalDaysOff.value]
    : personalDaysOff.value;

  return findDayOffForDate(selectedDate.value, allDaysOff) !== null;
});

// Replace dayOffColor
const dayOffColor = computed(() => {
  const allDaysOff = applyGlobalDaysOff.value
    ? [...globalDaysOff.value, ...personalDaysOff.value]
    : personalDaysOff.value;

  const dayOff = findDayOffForDate(selectedDate.value, allDaysOff);
  return dayOff?.color || "#F0F0F0";
});

// Replace dayOffReason
const dayOffReason = computed(() => {
  const allDaysOff = applyGlobalDaysOff.value
    ? [...globalDaysOff.value, ...personalDaysOff.value]
    : personalDaysOff.value;

  const dayOff = findDayOffForDate(selectedDate.value, allDaysOff);
  if (!dayOff) return "Day Off";

  const rangeInfo = getDayRangeInfo(selectedDate.value, dayOff);
  const reason = dayOff.reason || "Day Off";

  // Add day indicator for ranges
  if (rangeInfo && rangeInfo.totalDays > 1) {
    return `${reason} (Day ${rangeInfo.dayNumber}/${rangeInfo.totalDays})`;
  }

  return reason;
});

// Get all disabled periods for this date
const disabledPeriods = computed(() => {
  const exc = getAppliedExceptionForDate(selectedDate.value);
  const disabled = new Set();

  // Only check for disabled periods if there's an exception that's not a pattern or day-off
  if (exc && !exc.isDayOff && !exc.exceptionPatternId && exc.reason) {
    try {
      const data = JSON.parse(exc.reason);
      if (data.disabled && Array.isArray(data.disabled)) {
        data.disabled.forEach((idx) => disabled.add(idx));
      }
    } catch (e) {
      // If reason is not JSON, ignore
    }
  }

  return disabled;
});

const dailySchedule = computed(() => {
  const wd = dateToWeekday(selectedDate.value);
  const base = getScheduleForDay(wd);
  let slots = [...base];

  // Apply pattern or day-off exceptions (but not single-period disables)
  const exc = getAppliedExceptionForDate(selectedDate.value);
  if (exc) {
    if (exc.isDayOff) {
      slots = Array(6).fill(null);
    } else if (exc.exceptionPatternId) {
      slots = exc.ExceptionPattern.patternData.map((fromPeriod) => {
        if (fromPeriod == null) return null;
        const orig = base[fromPeriod - 1];
        return orig && orig.classId ? { classId: orig.classId } : null;
      });
    }
    // Note: We don't apply single-period exceptions here since we handle them separately
  }

  return slots
    .map((slot, idx) => {
      if (!slot || !slot.classId) return null;
      const cls = classesList.value.find((c) => c.id === slot.classId);
      const className = cls
        ? cls.classType === "numbered"
          ? `${cls.yearLevel <= 3 ? cls.yearLevel : cls.yearLevel - 3}${cls.yearLevel <= 3 ? "J" : "H"}-${cls.classNumber}`
          : cls.className
        : slot.notes;

      return {
        time: periodTimes[idx] || `P${idx + 1}`,
        className,
        color: cls?.color,
        classId: slot.classId,
        periodIndex: idx,
        isDisabled: disabledPeriods.value.has(idx),
        isException: !!exc && exc.exceptionPatternId != null,
        notes: slot.notes,
      };
    })
    .filter((x) => x);
});

// Toggle a class on/off for this specific day
const toggleClass = async (periodIndex, item) => {
  if (togglingPeriod.value !== null) return; // Prevent multiple toggles at once

  togglingPeriod.value = periodIndex;

  try {
    if (item.isDisabled) {
      // Re-enable: Remove from disabled list
      await enablePeriod(periodIndex);
    } else {
      // Disable: Add to disabled list
      await disablePeriod(periodIndex);
    }
  } catch (err) {
    console.error("Failed to toggle class:", err);
    store.dispatch(
      "ui/showNotification",
      {
        type: "error",
        message: "Failed to toggle class",
      },
      { root: true },
    );
  } finally {
    togglingPeriod.value = null;
  }
};

// Disable a period by adding it to the disabled list in exception
const disablePeriod = async (periodIndex) => {
  const exc = getAppliedExceptionForDate(selectedDate.value);
  let disabledList = [];
  let notes = {};

  // Get existing disabled list and notes if any
  if (exc && exc.reason) {
    try {
      const data = JSON.parse(exc.reason);
      if (data.disabled && Array.isArray(data.disabled)) {
        disabledList = [...data.disabled];
      }
      if (data.notes) {
        notes = { ...data.notes };
      }
    } catch (e) {
      // Ignore parse errors
    }
  }

  // Add this period if not already disabled
  if (!disabledList.includes(periodIndex)) {
    disabledList.push(periodIndex);
  }

  // Save exception with updated disabled list and preserve notes
  const payload = {
    date: selectedDate.value,
    isDayOff: false,
    exceptionPatternId: null,
    reason: JSON.stringify({ disabled: disabledList, notes }),
    color: null,
  };

  await store.dispatch("schedule/applyException", payload);
};

// Enable a period by removing it from the disabled list
const enablePeriod = async (periodIndex) => {
  const exc = getAppliedExceptionForDate(selectedDate.value);
  if (!exc) return;

  let disabledList = [];
  let notes = {};

  // Get existing disabled list and notes
  if (exc.reason) {
    try {
      const data = JSON.parse(exc.reason);
      if (data.disabled && Array.isArray(data.disabled)) {
        disabledList = data.disabled.filter((idx) => idx !== periodIndex);
      }
      if (data.notes) {
        notes = { ...data.notes };
      }
    } catch (e) {
      // Ignore parse errors
    }
  }

  // If no periods are disabled anymore and no notes, clear the exception
  if (disabledList.length === 0 && Object.keys(notes).length === 0) {
    await store.dispatch("schedule/clearAppliedException", selectedDate.value);
  } else {
    // Otherwise update with new list and preserve notes
    const payload = {
      date: selectedDate.value,
      isDayOff: false,
      exceptionPatternId: null,
      reason: JSON.stringify({ disabled: disabledList, notes }),
      color: null,
    };

    await store.dispatch("schedule/applyException", payload);
  }
};

// Note modal functions
const openNoteModal = (date, periodIndex) => {
  noteModal.value.date = date;
  noteModal.value.periodIndex = periodIndex;
  noteModal.value.currentNote = getNote(date, periodIndex);
  noteModal.value.show = true;
};

const closeNoteModal = () => {
  noteModal.value.show = false;
  noteModal.value.date = null;
  noteModal.value.periodIndex = null;
  noteModal.value.currentNote = "";
};

const saveClassNote = async (note) => {
  const { date, periodIndex } = noteModal.value;

  try {
    const exc = getAppliedExceptionForDate(date);
    let disabledList = [];
    let notes = {};

    // Get existing data
    if (exc && exc.reason) {
      try {
        const data = JSON.parse(exc.reason);
        if (data.disabled && Array.isArray(data.disabled)) {
          disabledList = [...data.disabled];
        }
        if (data.notes) {
          notes = { ...data.notes };
        }
      } catch (e) {
        // Ignore parse errors
      }
    }

    // Update notes
    if (note.trim()) {
      notes[periodIndex] = note;
    } else {
      delete notes[periodIndex];
    }

    // If no disabled periods and no notes, clear the exception
    if (disabledList.length === 0 && Object.keys(notes).length === 0) {
      if (exc) {
        await store.dispatch("schedule/clearAppliedException", date);
      }
    } else {
      // Save exception with updated notes
      const payload = {
        date,
        isDayOff: false,
        exceptionPatternId: null,
        reason: JSON.stringify({ disabled: disabledList, notes }),
        color: null,
      };

      await store.dispatch("schedule/applyException", payload);
    }

    closeNoteModal();
  } catch (error) {
    console.error("Error saving note:", error);
    store.dispatch(
      "ui/showNotification",
      {
        type: "error",
        message: "Failed to save note",
      },
      { root: true },
    );
  }
};

const getNote = (date, periodIndex) => {
  const exc = getAppliedExceptionForDate(date);

  if (!exc || !exc.reason) return "";

  try {
    const data = JSON.parse(exc.reason);
    return data.notes?.[periodIndex] || "";
  } catch {
    return "";
  }
};

const hasNote = (date, periodIndex) => {
  return getNote(date, periodIndex).trim() !== "";
};

// Navigation
const changeDay = (days) => {
  const d = new Date(selectedDate.value + "T12:00:00");
  d.setDate(d.getDate() + days);
  selectedDate.value = toYYYYMMDD(d);
};
const changeMonth = (months) => {
  const d = new Date(selectedDate.value + "T12:00:00");
  d.setMonth(d.getMonth() + months);
  selectedDate.value = toYYYYMMDD(d);
};
const goToPreviousDay = () => changeDay(-1);
const goToNextDay = () => changeDay(1);
const goToPreviousMonth = () => changeMonth(-1);
const goToNextMonth = () => changeMonth(1);

// Open exception modal
const openExceptionModal = () => {
  store.dispatch("ui/openModal", {
    modalName: "dailyException",
    data: {
      date: selectedDate.value,
      exception:
        personalExceptions.value.find((e) => e.date === selectedDate.value) ||
        null,
    },
  });
};

// DatePicker focus
const onDatePicked = () => (showDatePicker.value = false);
onMounted(() => {});
watch(showDatePicker, async (val) => {
  if (val) {
    await nextTick();
    datePickerInput.value?.focus();
    try {
      datePickerInput.value.showPicker();
    } catch {}
  }
});
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
  gap: 0.8em;
  transition: all 0.3s ease;
  color: #333;
  border-radius: 4px;
  margin-bottom: 2px;
}

.schedule-list-item:last-child {
  border-bottom: none;
}

.schedule-list-item.disabled-item {
  background-color: #f5f5f5 !important;
  border-left: 4px solid #999;
}

.schedule-list-item.has-dark-background {
  color: #f8f9fa;
}

.schedule-list-item.has-dark-background .exception-badge {
  color: #333;
  background-color: rgba(255, 255, 255, 0.8);
}

.exception-badge,
.disabled-badge {
  display: inline-block;
  margin-left: 0.5em;
  padding: 0.1em 0.4em;
  font-size: 0.75em;
  font-weight: bold;
  color: #fff;
  border-radius: 3px;
}

.exception-badge {
  background-color: var(--warning);
}

.disabled-badge {
  background-color: #999;
}

/* Toggle Switch Styles */
.toggle-container {
  flex-shrink: 0;
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
  margin: 0;
  cursor: pointer;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: 0.3s;
  border-radius: 24px;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.3s;
  border-radius: 50%;
}

.toggle-switch input:checked + .toggle-slider {
  background-color: #4caf50;
}

.toggle-switch input:checked + .toggle-slider:before {
  transform: translateX(20px);
}

.toggle-switch input:disabled + .toggle-slider {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Note Icon Styles */
.note-icon {
  padding: 2px 6px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  opacity: 0.4;
  transition: opacity 0.2s;
  flex-shrink: 0;
}

.note-icon:hover {
  opacity: 1;
}

.note-icon.has-note {
  opacity: 1;
  color: #3b82f6;
}

/* Styles for the Day Off notice */
.day-off-notice {
  border-left: 5px solid var(--border-color);
  transition:
    background-color 0.3s ease,
    border-left-color 0.3s ease;
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

.exception-item {
  border-left: 4px solid var(--warning);
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

.mt-3 {
  margin-top: 1rem;
}
</style>
