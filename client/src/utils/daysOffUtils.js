// client/src/utils/daysOffUtils.js

/**
 * Check if a date falls within a day off range
 * @param {string} dateString - Date to check in YYYY-MM-DD format
 * @param {object} dayOff - Day off object with either date or startDate/endDate
 * @returns {boolean}
 */
export const isDateInDayOff = (dateString, dayOff) => {
  if (!dayOff) return false;

  // Single day
  if (dayOff.date) {
    return dayOff.date === dateString;
  }

  // Date range
  if (dayOff.startDate && dayOff.endDate) {
    return dateString >= dayOff.startDate && dateString <= dayOff.endDate;
  }

  return false;
};

/**
 * Get day number and total days for a date within a range
 * @param {string} dateString - Date to check in YYYY-MM-DD format
 * @param {object} dayOff - Day off object
 * @returns {object|null} - { dayNumber, totalDays } or null if not in range
 */
export const getDayRangeInfo = (dateString, dayOff) => {
  if (!dayOff || !isDateInDayOff(dateString, dayOff)) {
    return null;
  }

  // Single day
  if (dayOff.date) {
    return { dayNumber: 1, totalDays: 1 };
  }

  // Date range
  if (dayOff.startDate && dayOff.endDate) {
    const start = new Date(dayOff.startDate + "T00:00:00");
    const end = new Date(dayOff.endDate + "T00:00:00");
    const current = new Date(dateString + "T00:00:00");

    // Calculate total days
    const diffTime = Math.abs(end - start);
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    // Calculate current day number
    const diffFromStart = Math.abs(current - start);
    const dayNumber = Math.ceil(diffFromStart / (1000 * 60 * 60 * 24)) + 1;

    return { dayNumber, totalDays };
  }

  return null;
};

/**
 * Find which day off (if any) contains the given date
 * @param {string} dateString - Date to check in YYYY-MM-DD format
 * @param {array} daysOffList - Array of day off objects
 * @returns {object|null} - The day off object or null
 */
export const findDayOffForDate = (dateString, daysOffList) => {
  if (!daysOffList || daysOffList.length === 0) return null;

  return (
    daysOffList.find((dayOff) => isDateInDayOff(dateString, dayOff)) || null
  );
};

/**
 * Get complete day off details for a date, including range info
 * @param {string} dateString - Date to check in YYYY-MM-DD format
 * @param {array} daysOffList - Array of day off objects
 * @returns {object|null} - Details object or null
 */
export const getDayOffDetails = (dateString, daysOffList) => {
  const dayOff = findDayOffForDate(dateString, daysOffList);
  if (!dayOff) return null;

  const rangeInfo = getDayRangeInfo(dateString, dayOff);

  return {
    ...dayOff,
    color: dayOff.color || "#F0F0F0",
    reason: dayOff.reason || "Day Off",
    rangeInfo, // { dayNumber, totalDays } or null for single days
  };
};
