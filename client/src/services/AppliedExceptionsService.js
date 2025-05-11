import ApiService from "./ApiService";

const APPLIED_EXCEPTIONS_ENDPOINT = "/applied-exceptions";

/**
 * Service object for interacting with the Applied Exception API endpoints.
 */
const AppliedExceptionsService = {
  /**
   * Fetches all applied exceptions for the authenticated user.
   * @returns {Promise<AxiosResponse<any>>} Promise resolving with the list of applied exceptions.
   */
  getAll() {
    console.log(
      `AppliedExceptionsService: Fetching all from ${APPLIED_EXCEPTIONS_ENDPOINT}`,
    );
    // Uses the generic ApiService GET method to call the base endpoint
    return ApiService.get(APPLIED_EXCEPTIONS_ENDPOINT);
  },

  /**
   * Fetches the applied exception for a specific date.
   * @param {string} date - Date in 'YYYY-MM-DD' format.
   * @returns {Promise<AxiosResponse<any>>} Promise resolving with the specific applied exception or null.
   */
  getForDate(date) {
    const url = `${APPLIED_EXCEPTIONS_ENDPOINT}/${date}`;
    console.log(
      `AppliedExceptionsService: Fetching for date ${date} via GET ${url}`,
    );
    return ApiService.get(url);
  },

  /**
   * Applies or updates an exception for a specific date.
   * Backend handles create vs update logic (findOrCreate).
   * @param {object} exceptionData - { date, isDayOff, exceptionPatternId, reason, color }
   * @returns {Promise<AxiosResponse<any>>} Promise resolving with the created/updated applied exception object.
   */
  apply(exceptionData) {
    console.log(
      `AppliedExceptionsService: Applying exception via POST ${APPLIED_EXCEPTIONS_ENDPOINT}`,
    );
    // Uses the generic ApiService POST method
    return ApiService.post(APPLIED_EXCEPTIONS_ENDPOINT, exceptionData);
  },

  /**
   * Clears (deletes) the applied exception for a specific date.
   * @param {string} date - Date in 'YYYY-MM-DD' format.
   * @returns {Promise<AxiosResponse<any>>} Promise resolving (usually empty with status 204 on success).
   */
  clear(date) {
    const url = `${APPLIED_EXCEPTIONS_ENDPOINT}/${date}`;
    console.log(
      `AppliedExceptionsService: Clearing exception for date ${date} via DELETE ${url}`,
    );
    // Uses the generic ApiService DELETE method
    return ApiService.delete(url);
  },
};

// Export the service object for use in the Vuex store
export default AppliedExceptionsService;
