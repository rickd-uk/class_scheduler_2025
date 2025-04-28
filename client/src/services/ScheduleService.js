import ApiService from './ApiService';

const SCHEDULE_ENDPOINT = '/api/schedule'; // Base endpoint

/**
 * Service object for interacting with the schedule API endpoints.
 */
const ScheduleService = {
  /**
   * Fetches the regular weekly schedule for the authenticated user.
   * @returns {Promise<AxiosResponse<any>>} Promise resolving with the schedule data.
   */
  getRegular() {
    const url = `${SCHEDULE_ENDPOINT}/regular`;
    console.log(`ScheduleService: Fetching regular schedule via GET ${url}`);
    // Uses the generic ApiService GET method
    return ApiService.get(url);
  },

  /**
   * Updates the regular weekly schedule for the authenticated user.
   * @param {object} scheduleData - The schedule object (e.g., { monday: [...], ... }).
   * @returns {Promise<AxiosResponse<any>>} Promise resolving with the updated schedule data.
   */
  updateRegular(scheduleData) {
    const url = `${SCHEDULE_ENDPOINT}/regular`;
    console.log(`ScheduleService: Updating regular schedule via PUT ${url}`);
    // Uses the generic ApiService PUT method
    return ApiService.put(url, scheduleData);
  },

  // --- Add methods for managing exceptions later ---
  // getExceptions() { ... }
  // addException() { ... }
};

// Export the service object
export default ScheduleService;

