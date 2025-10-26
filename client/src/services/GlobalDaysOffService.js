import ApiService from "./ApiService";

// Base endpoint for GLOBAL Days Off API calls
const GLOBAL_DAYS_OFF_ENDPOINT = "/global-days-off";

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
   * @param {object} dayOffData - Object containing:
   *   - For single day: { startDate: 'YYYY-MM-DD', reason?: string, color?: string }
   *   - For range: { startDate: 'YYYY-MM-DD', endDate: 'YYYY-MM-DD', reason?: string, color?: string }
   * @returns {Promise<AxiosResponse<any>>}
   */
  add(dayOffData) {
    console.log(
      `GlobalDaysOffService: Adding global day off via POST ${GLOBAL_DAYS_OFF_ENDPOINT}`,
      dayOffData,
    );
    return ApiService.post(GLOBAL_DAYS_OFF_ENDPOINT, dayOffData);
  },

  /**
   * Updates the reason/color for an existing global day off. (Admin only)
   * @param {number} id - The ID of the day off to update.
   * @param {object} data - Object containing updated fields (e.g., { reason: '...', color: '...', startDate?: '...', endDate?: '...' }).
   * @returns {Promise<AxiosResponse<any>>}
   */
  update(id, data) {
    const url = `${GLOBAL_DAYS_OFF_ENDPOINT}/${id}`;
    console.log(
      `GlobalDaysOffService: Updating global day off ID ${id} via PUT ${url}`,
      data,
    );
    return ApiService.put(url, data);
  },

  /**
   * Deletes a specific global day off by ID. (Admin only)
   * @param {number} id - The ID of the day off to delete.
   * @returns {Promise<AxiosResponse<any>>}
   */
  delete(id) {
    const url = `${GLOBAL_DAYS_OFF_ENDPOINT}/${id}`;
    console.log(
      `GlobalDaysOffService: Deleting global day off ID ${id} via DELETE ${url}`,
    );
    return ApiService.delete(url);
  },
};

export default GlobalDaysOffService;
