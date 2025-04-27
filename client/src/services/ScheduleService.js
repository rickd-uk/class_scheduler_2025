import ApiService from './ApiService';

const SCHEDULE_ENDPOINT = '/api/schedule'; // Base endpoint

const ScheduleService = {
  /**
   * Updates the regular weekly schedule for the authenticated user.
   * @param {object} scheduleData - The schedule object (e.g., { monday: [...], ... }).
   * @returns {Promise<AxiosResponse<any>>} Promise resolving with the updated schedule data.
   */
  updateRegular(scheduleData) {
    const url = `${SCHEDULE_ENDPOINT}/regular`;
    console.log(`ScheduleService: Updating regular schedule via PUT ${url}`);
    return ApiService.put(url, scheduleData);
  },

  // --- Add methods for fetching schedule, managing exceptions later ---
  // getRegular() {
  //   const url = `${SCHEDULE_ENDPOINT}/regular`;
  //   return ApiService.get(url);
  // },
  // getExceptions() { ... }
  // addException() { ... }
};

export default ScheduleService;

