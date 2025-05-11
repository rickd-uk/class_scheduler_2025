import ApiService from './ApiService';

// Base endpoint for exception pattern API calls
const EXCEPTION_PATTERNS_ENDPOINT = '/exception-patterns';

/**
 * Service object for interacting with the Exception Pattern API endpoints.
 * Assumes authentication token is handled by ApiService interceptor.
 */
const ExceptionPatternsService = {
  /**
   * Fetches all exception patterns for the authenticated user.
   * @returns {Promise<AxiosResponse<any>>}
   */
  getAll() {
    console.log(`ExceptionPatternsService: Fetching patterns from ${EXCEPTION_PATTERNS_ENDPOINT}`);
    return ApiService.get(EXCEPTION_PATTERNS_ENDPOINT);
  },

  /**
   * Adds a new exception pattern.
   * @param {object} patternData - Object containing { name: string, patternData: object | array }.
   * @returns {Promise<AxiosResponse<any>>}
   */
  add(patternData) {
     console.log(`ExceptionPatternsService: Adding pattern via POST ${EXCEPTION_PATTERNS_ENDPOINT}`);
    return ApiService.post(EXCEPTION_PATTERNS_ENDPOINT, patternData);
  },

  /**
   * Updates an existing exception pattern.
   * @param {number|string} id - The ID of the pattern to update.
   * @param {object} patternData - Object containing updated { name: string, patternData: object | array }.
   * @returns {Promise<AxiosResponse<any>>}
   */
  update(id, patternData) {
     const url = `${EXCEPTION_PATTERNS_ENDPOINT}/${id}`;
     console.log(`ExceptionPatternsService: Updating pattern ID ${id} via PUT ${url}`);
     return ApiService.put(url, patternData);
  },

  /**
   * Deletes a specific exception pattern.
   * @param {number|string} id - The ID of the pattern to delete.
   * @returns {Promise<AxiosResponse<any>>}
   */
  delete(id) {
     const url = `${EXCEPTION_PATTERNS_ENDPOINT}/${id}`;
     console.log(`ExceptionPatternsService: Deleting pattern ID ${id} via DELETE ${url}`);
     return ApiService.delete(url);
  },
};

export default ExceptionPatternsService;

