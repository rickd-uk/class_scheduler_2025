import ApiService from "./ApiService";

// Base endpoint for GLOBAL Applied Exception API calls
const GLOBAL_APPLIED_EXCEPTIONS_ENDPOINT = "/api/global-applied-exceptions";

/**
 * Service object for interacting with the GLOBAL Applied Exception API endpoints.
 * Assumes authentication and admin authorization are handled by ApiService/backend.
 */
const GlobalAppliedExceptionsService = {
  /**
   * Fetches all globally applied exceptions.
   * @returns {Promise<AxiosResponse<any>>} Promise resolving with the list of applied exceptions.
   */
  getAll() {
    console.log(
      `GlobalAppliedExceptionsService: Fetching all from ${GLOBAL_APPLIED_EXCEPTIONS_ENDPOINT}`,
    );
    return ApiService.get(GLOBAL_APPLIED_EXCEPTIONS_ENDPOINT);
  },

  /**
   * Applies or updates a global exception pattern for a specific date. (Admin only)
   * @param {object} exceptionData - { date, exceptionPatternId, reason? }
   * @returns {Promise<AxiosResponse<any>>} Promise resolving with the created/updated applied exception object.
   */
  apply(exceptionData) {
    console.log(
      `GlobalAppliedExceptionsService: Applying global exception via POST ${GLOBAL_APPLIED_EXCEPTIONS_ENDPOINT}`,
    );
    return ApiService.post(GLOBAL_APPLIED_EXCEPTIONS_ENDPOINT, exceptionData);
  },

  /**
   * Clears (deletes) the globally applied exception for a specific date. (Admin only)
   * @param {string} date - Date in 'YYYY-MM-DD' format.
   * @returns {Promise<AxiosResponse<any>>} Promise resolving (usually empty with status 204 on success).
   */
  clear(date) {
    const url = `${GLOBAL_APPLIED_EXCEPTIONS_ENDPOINT}/${date}`;
    console.log(
      `GlobalAppliedExceptionsService: Clearing global exception for date ${date} via DELETE ${url}`,
    );
    return ApiService.delete(url);
  },
};

export default GlobalAppliedExceptionsService;
