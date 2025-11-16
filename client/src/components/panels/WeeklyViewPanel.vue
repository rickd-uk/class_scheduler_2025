<template>
  <div class="panel weekly-view-panel">
    <div class="panel-header week-navigation">
      <button
        @click="goToPreviousWeek"
        class="nav-button"
        title="Previous Week"
      >
        &lt;
      </button>

      <div class="week-display-container">
        <h2 class="panel-title week-title">
          {{ formattedWeekRange }}
        </h2>
      </div>

      <button @click="goToNextWeek" class="nav-button" title="Next Week">
        &gt;
      </button>
    </div>

    <hr class="header-divider" />

    <div v-if="isLoading" class="loading">Loading schedule...</div>
    <div v-else-if="error" class="error-message">{{ error }}</div>

    <div v-else class="weekly-schedule-container">
      <table class="weekly-schedule-table">
        <thead>
          <tr>
            <th class="period-header">Period</th>
            <th
              v-for="day in weekDays"
              :key="day.dateString"
              class="day-header"
              :class="{ 'is-today': day.isToday }"
            >
              <div class="day-header-content">
                <div class="day-name">{{ day.dayName }}</div>
                <div class="day-date">{{ day.dateDisplay }}</div>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="period in periods" :key="period">
            <td class="period-cell">
              <div class="period-content">
                <div class="period-number">{{ period }}</div>
                <div class="period-time">{{ periodTimes[period - 1] }}</div>
              </div>
            </td>
            <td
              v-for="day in weekDays"
              :key="`${day.dateString}-${period}`"
              class="schedule-cell"
              :class="{
                'is-today': day.isToday,
                'is-day-off': day.isDayOff,
                'is-disabled': isCellDisabled(day.dateString, period - 1),
              }"
              :style="{
                backgroundColor: getCellColor(day.dateString, period - 1),
                opacity: isCellDisabled(day.dateString, period - 1) ? 0.5 : 1,
              }"
              @mouseenter="showTooltip($event, day.dateString, period - 1)"
              @mouseleave="hideTooltip"
            >
              <div
                v-if="day.isDayOff"
                class="day-off-cell"
                :class="{
                  'has-dark-background': isDarkColor(day.dayOffColor),
                }"
              >
                <small>{{ day.dayOffReason }}</small>
              </div>
              <div
                v-else-if="getClassForCell(day.dateString, period - 1)"
                class="class-cell"
                :class="{
                  'has-dark-background': isDarkColor(
                    getCellColor(day.dateString, period - 1),
                  ),
                }"
              >
                <!-- Toggle Switch -->
                <div class="toggle-container">
                  <label
                    class="toggle-switch"
                    :title="
                      isCellDisabled(day.dateString, period - 1)
                        ? 'Enable this class'
                        : 'Disable this class'
                    "
                  >
                    <input
                      type="checkbox"
                      :checked="!isCellDisabled(day.dateString, period - 1)"
                      @change="
                        toggleClass(
                          day.dateString,
                          period - 1,
                          getClassForCell(day.dateString, period - 1),
                        )
                      "
                      :disabled="
                        togglingCell === `${day.dateString}-${period - 1}`
                      "
                    />
                    <span class="toggle-slider"></span>
                  </label>
                </div>

                <!-- Class Name -->
                <div
                  class="class-name"
                  :style="{
                    textDecoration: isCellDisabled(day.dateString, period - 1)
                      ? 'line-through'
                      : 'none',
                  }"
                >
                  {{ getClassForCell(day.dateString, period - 1).className }}
                </div>

                <!-- Note Icon -->
                <button
                  @click.stop="openNoteModal(day.dateString, period - 1)"
                  class="note-icon"
                  :class="{
                    'has-note': hasNote(day.dateString, period - 1),
                  }"
                  title="Add note"
                >
                  📝
                </button>
              </div>
              <div v-else class="empty-cell">--</div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Note Modal -->
    <ClassNoteModal
      :show="noteModal.show"
      :note="noteModal.currentNote"
      @close="closeNoteModal"
      @save="saveClassNote"
    />

    <!-- Custom Tooltip -->
    <div
      v-if="tooltip.show"
      class="custom-tooltip"
      :style="{
        left: tooltip.x + 10 + 'px',
        top: tooltip.y + 10 + 'px',
      }"
    >
      {{ tooltip.text }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";
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

const dateToWeekday = (ds) => {
  const date = new Date(ds + "T12:00:00");
  const days = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  return days[date.getDay()];
};

// State
const currentWeekStart = ref(getWeekStart(new Date()));
const togglingCell = ref(null);
const noteModal = ref({
  show: false,
  date: null,
  periodIndex: null,
  currentNote: "",
});
const tooltip = ref({
  show: false,
  x: 0,
  y: 0,
  text: "",
});

// Constants
const periods = [1, 2, 3, 4, 5, 6];
const periodTimes = ["8:40", "9:30", "10:35", "11:25", "13:05", "13:55"];

// Get the start of the week (Monday) for a given date
function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
  return new Date(d.setDate(diff));
}

// Store getters
const regularSchedule = computed(
  () => store.getters["schedule/regularSchedule"] || {},
);
const personalExceptions = computed(
  () => store.getters["schedule/appliedExceptions"] || [],
);
const globalExceptions = computed(
  () => store.getters["globalAppliedExceptions/allExceptions"] || [],
);
const personalDaysOff = computed(
  () => store.getters["daysOff/allDaysOff"] || [],
);
const globalDaysOff = computed(
  () => store.getters["globalDaysOff/allGlobalDaysOff"] || [],
);
const applyGlobalDaysOff = computed(
  () => store.getters["globalSettings/shouldApplyGlobalDaysOff"] ?? true,
);
const applyGlobalExceptions = computed(
  () => store.getters["globalSettings/shouldApplyGlobalExceptions"] ?? true,
);
const globalWeeklyDaysOff = computed(
  () => store.getters["globalSettings/getWeeklyDaysOff"] || [],
);
const classesList = computed(() => store.getters["classes/allClasses"] || []);
const isLoading = computed(
  () =>
    store.getters["schedule/isLoading"] || store.getters["classes/isLoading"],
);
const error = computed(
  () => store.getters["schedule/error"] || store.getters["classes/error"],
);

// Computed: Week days array
const weekDays = computed(() => {
  const days = [];
  const today = getTodayDateString();

  for (let i = 0; i < 6; i++) {
    // Monday to Saturday
    const date = new Date(currentWeekStart.value);
    date.setDate(date.getDate() + i);
    const dateString = toYYYYMMDD(date);
    const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
    const dateDisplay = date.toLocaleDateString("en-US", {
      month: "numeric",
      day: "numeric",
    });

    // Check if this day is off
    const allDaysOff = applyGlobalDaysOff.value
      ? [...globalDaysOff.value, ...personalDaysOff.value]
      : personalDaysOff.value;

    const dayOff = findDayOffForDate(dateString, allDaysOff);
    const isDayOff =
      !!dayOff || globalWeeklyDaysOff.value.includes(dateToWeekday(dateString));

    let dayOffReason = "";
    let dayOffColor = null;

    if (dayOff) {
      const rangeInfo = getDayRangeInfo(dateString, dayOff);
      const reason = dayOff.reason || "Day Off";
      dayOffColor = dayOff.color;
      if (rangeInfo && rangeInfo.totalDays > 1) {
        dayOffReason = `${reason} (${rangeInfo.dayNumber}/${rangeInfo.totalDays})`;
      } else {
        dayOffReason = reason;
      }
    } else if (globalWeeklyDaysOff.value.includes(dateToWeekday(dateString))) {
      dayOffReason = "Always Off";
    }

    days.push({
      dateString,
      dayName,
      dateDisplay,
      isToday: dateString === today,
      isDayOff,
      dayOffReason,
      dayOffColor,
    });
  }

  return days;
});

// Computed: Formatted week range
const formattedWeekRange = computed(() => {
  if (weekDays.value.length === 0) return "";
  const firstDay = weekDays.value[0];
  const lastDay = weekDays.value[weekDays.value.length - 1];

  const firstDate = new Date(firstDay.dateString + "T12:00:00");
  const lastDate = new Date(lastDay.dateString + "T12:00:00");

  const firstMonth = firstDate.toLocaleDateString("en-US", { month: "short" });
  const lastMonth = lastDate.toLocaleDateString("en-US", { month: "short" });
  const firstDateNum = firstDate.getDate();
  const lastDateNum = lastDate.getDate();

  if (firstMonth === lastMonth) {
    return `${firstMonth} ${firstDateNum}-${lastDateNum}, ${firstDate.getFullYear()}`;
  } else {
    return `${firstMonth} ${firstDateNum} - ${lastMonth} ${lastDateNum}, ${firstDate.getFullYear()}`;
  }
});

// Get applied exception for a date
const getAppliedExceptionForDate = (dateString) => {
  const global = globalExceptions.value || [];
  const personal = personalExceptions.value || [];

  const allExceptions = applyGlobalExceptions.value
    ? [...global, ...personal]
    : personal;

  return allExceptions.find((e) => e.date === dateString);
};

// Get schedule for a weekday from regular schedule
const getScheduleForDay = (weekday) => {
  return regularSchedule.value[weekday] || Array(6).fill(null);
};

// Get class for a specific cell
const getClassForCell = (dateString, periodIndex) => {
  const wd = dateToWeekday(dateString);
  const base = getScheduleForDay(wd);
  let slots = [...base];

  const exc = getAppliedExceptionForDate(dateString);

  if (exc) {
    if (exc.isDayOff) {
      return null;
    } else if (exc.exceptionPatternId) {
      slots = exc.ExceptionPattern.patternData.map((fromPeriod) => {
        if (fromPeriod == null) return null;
        const orig = base[fromPeriod - 1];
        return orig && orig.classId ? { classId: orig.classId } : null;
      });
    }
  }

  const slot = slots[periodIndex];
  if (!slot || !slot.classId) return null;

  const cls = classesList.value.find((c) => c.id === slot.classId);
  if (!cls) return null;

  const className =
    cls.classType === "numbered"
      ? `${cls.yearLevel <= 3 ? cls.yearLevel : cls.yearLevel - 3}${cls.yearLevel <= 3 ? "J" : "H"}-${cls.classNumber}`
      : cls.className;

  return {
    className,
    classId: cls.id,
    color: cls.color,
  };
};

// Get cell color
const getCellColor = (dateString, periodIndex) => {
  // Check if day is off first
  const day = weekDays.value.find((d) => d.dateString === dateString);
  if (day?.isDayOff) {
    return day.dayOffColor || "#F0F0F0";
  }

  // Check if cell is disabled
  if (isCellDisabled(dateString, periodIndex)) {
    return "#f5f5f5";
  }

  // Get class color
  const classData = getClassForCell(dateString, periodIndex);
  return classData?.color || "transparent";
};

// Check if cell is disabled
const isCellDisabled = (dateString, periodIndex) => {
  const exc = getAppliedExceptionForDate(dateString);
  if (!exc || exc.isDayOff || !exc.reason) return false;

  try {
    const data = JSON.parse(exc.reason);
    return (
      data.disabled &&
      Array.isArray(data.disabled) &&
      data.disabled.includes(periodIndex)
    );
  } catch (e) {
    return false;
  }
};

// Get note for a cell
const getNote = (dateString, periodIndex) => {
  const exc = getAppliedExceptionForDate(dateString);
  if (!exc || !exc.reason) return "";

  try {
    const data = JSON.parse(exc.reason);
    return data.notes?.[periodIndex] || "";
  } catch {
    return "";
  }
};

const hasNote = (dateString, periodIndex) => {
  return getNote(dateString, periodIndex).trim() !== "";
};

// Toggle class on/off
const toggleClass = async (dateString, periodIndex, classData) => {
  if (togglingCell.value !== null) return;

  togglingCell.value = `${dateString}-${periodIndex}`;

  try {
    if (isCellDisabled(dateString, periodIndex)) {
      await enablePeriod(dateString, periodIndex);
    } else {
      await disablePeriod(dateString, periodIndex);
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
    togglingCell.value = null;
  }
};

// Disable a period
const disablePeriod = async (dateString, periodIndex) => {
  const exc = getAppliedExceptionForDate(dateString);
  let disabledList = [];
  let notes = {};

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

  if (!disabledList.includes(periodIndex)) {
    disabledList.push(periodIndex);
  }

  const payload = {
    date: dateString,
    isDayOff: false,
    exceptionPatternId: exc?.exceptionPatternId || null,
    reason: JSON.stringify({ disabled: disabledList, notes }),
    color: null,
  };

  await store.dispatch("schedule/applyException", payload);
};

// Enable a period
const enablePeriod = async (dateString, periodIndex) => {
  const exc = getAppliedExceptionForDate(dateString);
  if (!exc) return;

  let disabledList = [];
  let notes = {};

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

  if (disabledList.length === 0 && Object.keys(notes).length === 0) {
    await store.dispatch("schedule/clearAppliedException", dateString);
  } else {
    const payload = {
      date: dateString,
      isDayOff: false,
      exceptionPatternId: exc?.exceptionPatternId || null,
      reason: JSON.stringify({ disabled: disabledList, notes }),
      color: null,
    };

    await store.dispatch("schedule/applyException", payload);
  }
};

// Note modal functions
const openNoteModal = (dateString, periodIndex) => {
  noteModal.value.date = dateString;
  noteModal.value.periodIndex = periodIndex;
  noteModal.value.currentNote = getNote(dateString, periodIndex);
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

    if (note.trim()) {
      notes[periodIndex] = note;
    } else {
      delete notes[periodIndex];
    }

    if (disabledList.length === 0 && Object.keys(notes).length === 0) {
      if (exc) {
        await store.dispatch("schedule/clearAppliedException", date);
      }
    } else {
      const payload = {
        date,
        isDayOff: false,
        exceptionPatternId: exc?.exceptionPatternId || null,
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

// Tooltip functions
const showTooltip = (event, dateString, periodIndex) => {
  const note = getNote(dateString, periodIndex);
  if (note) {
    tooltip.value.text = note;
    tooltip.value.x = event.pageX;
    tooltip.value.y = event.pageY;
    tooltip.value.show = true;
  }
};

const hideTooltip = () => {
  tooltip.value.show = false;
};

// Check if color is dark
const isDarkColor = (color) => {
  if (!color) return false;
  const hex = color.replace("#", "");
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness < 128;
};

// Navigation
const goToPreviousWeek = () => {
  const newDate = new Date(currentWeekStart.value);
  newDate.setDate(newDate.getDate() - 7);
  currentWeekStart.value = newDate;
};

const goToNextWeek = () => {
  const newDate = new Date(currentWeekStart.value);
  newDate.setDate(newDate.getDate() + 7);
  currentWeekStart.value = newDate;
};
</script>

<style scoped>
.panel-header.week-navigation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.week-display-container {
  flex-grow: 1;
  text-align: center;
}

.week-title {
  margin: 0;
  font-weight: 600;
  font-size: 1.1rem;
}

.nav-button {
  background: none;
  border: 1px solid transparent;
  padding: 0.3rem 0.7rem;
  font-size: 1.2rem;
  font-weight: bold;
  cursor: pointer;
  color: var(--primary);
  border-radius: 4px;
  transition: background-color 0.2s;
}

.nav-button:hover {
  background-color: #e0e0e0;
}

.header-divider {
  border: none;
  border-top: 1px solid var(--border-color);
  margin-top: 0.5rem;
  margin-bottom: 1rem;
}

.loading,
.error-message {
  padding: 1rem;
  text-align: center;
  color: var(--secondary);
}

.error-message {
  color: var(--danger);
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: var(--border-radius);
}

.weekly-schedule-container {
  overflow-x: auto;
}

.weekly-schedule-table {
  width: 100%;
  border-collapse: collapse;
  border: 1px solid var(--border-color);
  min-width: 700px;
}

.weekly-schedule-table th,
.weekly-schedule-table td {
  border: 1px solid var(--border-color);
  padding: 0.5rem;
  text-align: center;
  font-size: 0.85rem;
  vertical-align: middle;
}

.weekly-schedule-table th {
  background-color: var(--light);
  font-weight: 600;
}

.period-header {
  min-width: 70px;
  width: 70px;
}

.day-header {
  min-width: 120px;
}

.day-header.is-today {
  background-color: #fffacd;
  border: 2px solid var(--primary);
}

.day-header-content {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.day-name {
  font-weight: 600;
  font-size: 0.9rem;
}

.day-date {
  font-size: 0.75rem;
  color: var(--secondary);
  font-weight: normal;
}

.period-cell {
  background-color: var(--light);
  font-weight: 600;
}

.period-content {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.period-number {
  font-size: 0.9rem;
}

.period-time {
  font-size: 0.7rem;
  color: var(--secondary);
}

.schedule-cell {
  position: relative;
  transition: all 0.3s ease;
  min-height: 60px;
}

.schedule-cell.is-today {
  border: 2px solid var(--primary);
}

.schedule-cell.is-day-off {
  background-color: #f0f0f0;
}

.day-off-cell {
  padding: 0.5rem;
  color: #666;
  font-style: italic;
}

.day-off-cell.has-dark-background {
  color: white;
}

.class-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
  padding: 0.3rem;
  color: #333;
}

.class-cell.has-dark-background {
  color: white;
}

.class-cell.has-dark-background .toggle-slider {
  background-color: rgba(255, 255, 255, 0.3);
}

.class-cell.has-dark-background .toggle-slider::before {
  background-color: white;
}

.toggle-container {
  display: flex;
  justify-content: center;
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 32px;
  height: 18px;
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
  border-radius: 18px;
}

.toggle-slider::before {
  position: absolute;
  content: "";
  height: 14px;
  width: 14px;
  left: 2px;
  bottom: 2px;
  background-color: white;
  transition: 0.3s;
  border-radius: 50%;
}

.toggle-switch input:checked + .toggle-slider {
  background-color: var(--primary);
}

.toggle-switch input:checked + .toggle-slider::before {
  transform: translateX(14px);
}

.toggle-switch input:disabled + .toggle-slider {
  opacity: 0.5;
  cursor: not-allowed;
}

.class-name {
  font-weight: 500;
  font-size: 0.85rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.note-icon {
  background: none;
  border: none;
  font-size: 1rem;
  cursor: pointer;
  padding: 0.2rem;
  opacity: 0.3;
  transition: opacity 0.2s;
}

.note-icon:hover {
  opacity: 0.8;
}

.note-icon.has-note {
  opacity: 1;
}

.empty-cell {
  color: #ccc;
  font-style: italic;
}

.custom-tooltip {
  position: fixed;
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 0.5rem 0.75rem;
  border-radius: 4px;
  font-size: 0.85rem;
  z-index: 1000;
  max-width: 250px;
  word-wrap: break-word;
  pointer-events: none;
}
</style>
