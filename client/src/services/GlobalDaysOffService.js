import ApiService from "./ApiService";

// Base endpoint for GLOBAL Days Off API calls
const GLOBAL_DAYS_OFF_ENDPOINT = "/api/global-days-off";

/**
 * Service object for interacting with the GLOBAL Days Off API endpoints.
 * Assumes authentication and admin authorization are handled by ApiService/backend.
 */
const GlobalDaysOffService = {
  /**
   * Fetches all global days off.
   * @returns {Promise<AxiosResponse<any>>}
   */
  getAll() {
    console.log(
      `GlobalDaysOffService: Fetching global days off from ${GLOBAL_DAYS_OFF_ENDPOINT}`,
    );
    return ApiService.get(GLOBAL_DAYS_OFF_ENDPOINT);
  },

  /**
   * Adds a new global day off. (Admin only)
   * @param {object} dayOffData - Object containing { date: 'YYYY-MM-DD', reason?: string, color?: string }.
   * @returns {Promise<AxiosResponse<any>>}
   */
  add(dayOffData) {
    console.log(
      `GlobalDaysOffService: Adding global day off via POST ${GLOBAL_DAYS_OFF_ENDPOINT}`,
    );
    return ApiService.post(GLOBAL_DAYS_OFF_ENDPOINT, dayOffData);
  },

  /**
   * Updates the reason/color for an existing global day off. (Admin only)
   * @param {string} date - The date of the day off to update ('YYYY-MM-DD').
   * @param {object} data - Object containing updated fields (e.g., { reason: '...', color: '...' }).
   * @returns {Promise<AxiosResponse<any>>}
   */
  update(date, data) {
    const url = `${GLOBAL_DAYS_OFF_ENDPOINT}/${date}`;
    console.log(
      `GlobalDaysOffService: Updating global day off for date ${date} via PUT ${url}`,
    );
    return ApiService.put(url, data);
  },

  /**
   * Deletes a specific global day off by date. (Admin only)
   * @param {string} date - The date to delete ('YYYY-MM-DD').
   * @returns {Promise<AxiosResponse<any>>}
   */
  delete(date) {
    const url = `${GLOBAL_DAYS_OFF_ENDPOINT}/${date}`;
    console.log(
      `GlobalDaysOffService: Deleting global day off for date ${date} via DELETE ${url}`,
    );
    return ApiService.delete(url);
  },
};

export default GlobalDaysOffService;
