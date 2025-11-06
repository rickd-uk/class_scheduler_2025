<template>
  <div class="panel monthly-schedule-panel">
    <div class="panel-header month-navigation">
      <button
        @click="goToPreviousMonth"
        class="nav-button"
        title="Previous Month"
      >
        &lt;
      </button>

      <div class="month-display-container">
        <h2 class="panel-title month-title">
          {{ formattedMonth }}
        </h2>
      </div>

      <button @click="goToNextMonth" class="nav-button" title="Next Month">
        &gt;
      </button>
    </div>

    <hr class="header-divider" />

    <div v-if="isLoading" class="loading">Loading schedule...</div>
    <div v-else-if="error" class="error-message">{{ error }}</div>

    <div v-else class="calendar-container">
      <div class="calendar-grid">
        <!-- Day headers -->
        <div v-for="day in daysOfWeek" :key="day" class="calendar-header">
          {{ day }}
        </div>

        <!-- Calendar cells -->
        <div
          v-for="(cell, index) in calendarCells"
          :key="index"
          :class="[
            'calendar-cell',
            { 'other-month': !cell.isCurrentMonth },
            { today: cell.isToday },
            { past: cell.isPast },
            { 'day-off': cell.isDayOff },
          ]"
        >
          <div class="cell-date">{{ cell.day }}</div>

          <div
            v-if="cell.isDayOff"
            class="day-off-label"
            :style="{ backgroundColor: cell.dayOffColor }"
          >
            {{ cell.dayOffReason }}
          </div>

          <div v-else class="cell-classes">
            <div
              v-for="(classItem, idx) in cell.classes"
              :key="idx"
              class="class-item"
              :style="{ backgroundColor: classItem.color }"
              :class="{ 'has-dark-background': isDarkColor(classItem.color) }"
              :title="classItem.fullName"
            >
              {{ classItem.shortName }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useStore } from "vuex";
import { findDayOffForDate, getDayRangeInfo } from "../../utils/daysOffUtils";

const store = useStore();

// Helper functions
const toYYYYMMDD = (date) => {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().split("T")[0];
};

const getTodayDateString = () => toYYYYMMDD(new Date());

const dateToWeekday = (ds) => {
  const d = new Date(ds + "T12:00:00");
  return d.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
};

const isDarkColor = (hex) => {
  if (!hex || hex.length < 7) return false;
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.5;
};

// Reactive state
const currentMonth = ref(new Date());
const isLoading = ref(false);
const error = ref(null);

// Days of week for header
const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Vuex getters
const getScheduleForDay = (day) =>
  store.getters["schedule/getScheduleForDay"](day) || [];
const getAppliedExceptionForDate = (date) =>
  store.getters["schedule/getAppliedExceptionForDate"](date);
const classesList = computed(() => store.getters["classes/allClasses"]);
const personalDaysOff = computed(() => store.getters["daysOff/allDaysOff"]);
const globalDaysOff = computed(
  () => store.getters["globalDaysOff/allGlobalDaysOff"],
);
const applyGlobalDaysOff = computed(
  () => store.getters["globalSettings/shouldApplyGlobalDaysOff"],
);

const globalWeeklyDaysOff = computed(
  () => store.getters["globalSettings/getWeeklyDaysOff"],
);

// Formatted month display
const formattedMonth = computed(() => {
  return currentMonth.value.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
});

// Navigation
const goToPreviousMonth = () => {
  const newDate = new Date(currentMonth.value);
  newDate.setMonth(newDate.getMonth() - 1);
  currentMonth.value = newDate;
};

const goToNextMonth = () => {
  const newDate = new Date(currentMonth.value);
  newDate.setMonth(newDate.getMonth() + 1);
  currentMonth.value = newDate;
};

// Get schedule for a specific date
const getScheduleForDate = (dateString) => {
  const wd = dateToWeekday(dateString);
  const base = getScheduleForDay(wd);
  let slots = [...base];

  // Apply exception for this date
  const exc = getAppliedExceptionForDate(dateString);

  const disabledPeriods = new Set();
  if (exc && !exc.isDayOff && exc.reason) {
    try {
      const data = JSON.parse(exc.reason);
      if (data.disabled && Array.isArray(data.disabled)) {
        data.disabled.forEach((idx) => disabledPeriods.add(idx));
      }
    } catch (e) {}
  }

  if (exc) {
    if (exc.isDayOff) {
      slots = Array(6).fill(null);
    } else if (exc.exceptionPatternId) {
      slots = exc.ExceptionPattern.patternData.map((fromPeriod) => {
        if (fromPeriod == null) return null;
        const orig = base[fromPeriod - 1];
        return orig && orig.classId ? { classId: orig.classId } : null;
      });
    } else if (exc.periodIndex != null) {
      slots = slots.map((s, i) =>
        i === exc.periodIndex ? { classId: exc.classId, notes: exc.reason } : s,
      );
    }
  }

  // Convert to class details
  const classDetails = [];
  const seen = new Set();

  slots.forEach((slot, idx) => {
    if (!slot || !slot.classId) return;

    // Skip disabled periods
    if (disabledPeriods.has(idx)) return;

    // Avoid duplicates in the same day
    if (seen.has(slot.classId)) return;
    seen.add(slot.classId);

    const cls = classesList.value.find((c) => c.id === slot.classId);
    if (!cls) return;

    const fullName =
      cls.classType === "numbered"
        ? `${cls.yearLevel <= 3 ? cls.yearLevel : cls.yearLevel - 3}${cls.yearLevel <= 3 ? "J" : "H"}-${cls.classNumber}`
        : cls.className;

    // Create short name (max 2 chars for compact display)
    let shortName;
    if (cls.classType === "numbered") {
      const year = cls.yearLevel <= 3 ? cls.yearLevel : cls.yearLevel - 3;
      const level = cls.yearLevel <= 3 ? "J" : "H";
      shortName = `${year}${level}-${cls.classNumber}`;
    } else {
      // Take first 2 chars or first letter + number
      shortName = cls.className.substring(0, 2).toUpperCase();
    }

    classDetails.push({
      fullName,
      shortName,
      color: cls.color || "#E0E0E0",
    });
  });

  return classDetails;
};

// Check if a date string (YYYY-MM-DD) is a day off
const isDayOffDate = (dateString) => {
  // 1. Check Global Weekly Days Off
  const currentDayName = dateToWeekday(dateString);
  if (globalWeeklyDaysOff.value.includes(currentDayName)) {
    return true;
  }

  // 2. Check Personal/Global Date-Specific Days Off
  const allDaysOff = applyGlobalDaysOff.value
    ? [...globalDaysOff.value, ...personalDaysOff.value]
    : personalDaysOff.value;
  return findDayOffForDate(dateString, allDaysOff) !== null;
};

// Replace getDayOffDetails
const getDayOffDetails = (dateString) => {
  const allDaysOff = applyGlobalDaysOff.value
    ? [...globalDaysOff.value, ...personalDaysOff.value]
    : personalDaysOff.value;

  const dayOff = findDayOffForDate(dateString, allDaysOff);
  if (!dayOff) return null;

  const rangeInfo = getDayRangeInfo(dateString, dayOff);
  const reason = dayOff.reason || "Day Off";

  // Add day indicator for ranges
  let displayReason = reason;
  if (rangeInfo && rangeInfo.totalDays > 1) {
    displayReason = `${rangeInfo.dayNumber}/${rangeInfo.totalDays}`;
  }

  return {
    color: dayOff.color || "#F0F0F0",
    reason: displayReason,
  };
};

// Generate calendar cells
const calendarCells = computed(() => {
  const year = currentMonth.value.getFullYear();
  const month = currentMonth.value.getMonth();

  // First day of the month
  const firstDay = new Date(year, month, 1);
  const firstDayOfWeek = firstDay.getDay(); // 0 = Sunday

  // Last day of the month
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();

  // Previous month days to fill
  const prevMonthLastDay = new Date(year, month, 0).getDate();

  const cells = [];
  const today = getTodayDateString();

  // Fill previous month days
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const day = prevMonthLastDay - i;
    const date = new Date(year, month - 1, day);
    const dateString = toYYYYMMDD(date);
    cells.push({
      day,
      date: toYYYYMMDD(date),
      isCurrentMonth: false,
      isToday: false,
      isPast: dateString < today,
      isDayOff: false,
      classes: [],
    });
  }

  // Fill current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dateString = toYYYYMMDD(date);
    const isDayOff = isDayOffDate(dateString);
    const dayOffDetails = isDayOff ? getDayOffDetails(dateString) : null;

    cells.push({
      day,
      date: dateString,
      isCurrentMonth: true,
      isToday: dateString === today,
      isPast: dateString < today,
      isDayOff,
      dayOffColor: dayOffDetails?.color,
      dayOffReason: dayOffDetails?.reason,
      classes: isDayOff ? [] : getScheduleForDate(dateString),
    });
  }

  // Fill next month days to complete the grid (up to 42 cells = 6 weeks)
  const remainingCells = 42 - cells.length;
  for (let day = 1; day <= remainingCells; day++) {
    const date = new Date(year, month + 1, day);
    const dateString = toYYYYMMDD(date);
    cells.push({
      day,
      date: toYYYYMMDD(date),
      isCurrentMonth: false,
      isToday: false,
      isPast: dateString < today,
      isDayOff: false,
      classes: [],
    });
  }

  return cells;
});

onMounted(() => {
  // Data should already be loaded by App.vue
});
</script>

<style scoped>
.panel-header.month-navigation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.month-display-container {
  flex-grow: 1;
  text-align: center;
}

.month-title {
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

.calendar-container {
  width: 100%;
  overflow-x: auto;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  min-width: 700px;
}

.calendar-header {
  background-color: var(--light);
  padding: 0.5rem;
  text-align: center;
  font-weight: 600;
  font-size: 0.9rem;
  border: 1px solid var(--border-color);
}

.calendar-cell {
  min-height: 80px;
  border: 1px solid var(--border-color);
  padding: 4px;
  background-color: white;
  position: relative;
  display: flex;
  flex-direction: column;
}

.calendar-cell.other-month {
  background-color: #f9f9f9;
  opacity: 0.6;
}

.calendar-cell.today {
  border: 2px solid var(--primary);
  background-color: #fffacd;
}

.calendar-cell.day-off {
  background-color: #f0f0f0;
}

.calendar-cell.past {
  opacity: 0.2;
}

.calendar-cell.past:not(.today) {
  background-color: #fafafa;
}

.cell-date {
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 2px;
  color: var(--secondary);
}

.calendar-cell.today .cell-date {
  color: var(--primary);
}

.day-off-label {
  font-size: 0.7rem;
  padding: 2px 4px;
  border-radius: 3px;
  text-align: center;
  margin-top: 4px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cell-classes {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex-grow: 1;
}

.class-item {
  font-size: 0.65rem;
  padding: 2px 4px;
  border-radius: 3px;
  text-align: center;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #333;
  line-height: 1.2;
}

.class-item.has-dark-background {
  color: white;
}

/* Responsive adjustments */
@media (max-width: 1024px) {
  .calendar-grid {
    min-width: 600px;
  }

  .calendar-cell {
    min-height: 70px;
  }

  .class-item {
    font-size: 0.6rem;
    padding: 1px 3px;
  }
}
</style>
