import ApiService from './ApiService';

// Define the base endpoint for Days Off API calls
const DAYS_OFF_ENDPOINT = '/api/days-off'; // Matches server route mount point

/**
 * Service object for interacting with the Days Off API endpoints.
 */
const DaysOffService = {
  /**
   * Fetches all days off for the authenticated user.
   * Assumes the backend route '/api/days-off' uses authentication middleware.
   * @returns {Promise<AxiosResponse<any>>} Promise resolving with the API response containing the list of days off.
   */
  getAll() {
    console.log(`DaysOffService: Fetching days off from ${DAYS_OFF_ENDPOINT}`);
    // Uses the generic ApiService GET method
    return ApiService.get(DAYS_OFF_ENDPOINT);
  },

  /**
   * Adds a new day off for the authenticated user.
   * @param {object} dayOffData - Object containing { date: 'YYYY-MM-DD', reason?: string }.
   * @returns {Promise<AxiosResponse<any>>} Promise resolving with the API response containing the newly created day off object.
   */
  add(dayOffData) {
     console.log(`DaysOffService: Adding day off via POST ${DAYS_OFF_ENDPOINT}`);
     // Uses the generic ApiService POST method
    return ApiService.post(DAYS_OFF_ENDPOINT, dayOffData);
  },

  /**
   * Deletes a specific day off by date for the authenticated user.
   * @param {string} date - The date to delete ('YYYY-MM-DD').
   * @returns {Promise<AxiosResponse<any>>} Promise resolving with the API response (usually empty with status 204 on success).
   */
  delete(date) {
     // Construct the URL for the specific date to delete
     const url = `${DAYS_OFF_ENDPOINT}/${date}`;
     console.log(`DaysOffService: Deleting day off for date ${date} via DELETE ${url}`);
     // Uses the generic ApiService DELETE method
     return ApiService.delete(url);
  },

  // --- Placeholder for future methods (e.g., update) ---
  // update(date, dayOffData) {
  //   const url = `${DAYS_OFF_ENDPOINT}/${date}`;
  //   return ApiService.put(url, dayOffData);
  // }
};

// Export the service object for use in the Vuex store
export default DaysOffService;

