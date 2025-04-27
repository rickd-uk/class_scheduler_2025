// client/src/utils/dateHelpers.js
/**
 * Format a Date object to YYYY-MM-DD string
 * @param {Date} date - The date object to format
 * @returns {string} The formatted date string
 */
export function formatDate(date) {
  if (!date) return '';
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Parse a YYYY-MM-DD string to a Date object
 * @param {string} dateString - The date string to parse
 * @returns {Date|null} The parsed Date object or null if invalid
 */
export function parseDate(dateString) {
  if (!dateString) return null;
  
  // Split the date string and create a new Date object
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Get the next day from a given date
 * @param {Date} date - The starting date
 * @returns {Date} The next day
 */
export function getNextDay(date) {
  const nextDay = new Date(date);
  nextDay.setDate(nextDay.getDate() + 1);
  return nextDay;
}

/**
 * Get the previous day from a given date
 * @param {Date} date - The starting date
 * @returns {Date} The previous day
 */
export function getPrevDay(date) {
  const prevDay = new Date(date);
  prevDay.setDate(prevDay.getDate() - 1);
  return prevDay;
}

/**
 * Get the name of the day of the week
 * @param {Date} date - The date
 * @returns {string} The day name
 */
export function getDayName(date) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()];
}

/**
 * Check if a date is a weekend (Saturday or Sunday)
 * @param {Date} date - The date to check
 * @returns {boolean} True if weekend, false otherwise
 */
export function isWeekend(date) {
  const day = date.getDay();
  return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
}
