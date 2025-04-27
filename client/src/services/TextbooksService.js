// client/src/services/TextbooksService.js
import ApiService from './ApiService';

// Define the base endpoint for textbook API calls
const TEXTBOOKS_ENDPOINT = '/api/textbooks'; // Matches server/routes/textbookRoutes.js

/**
 * Service object for interacting with the textbook API endpoints.
 */
const TextbooksService = {
  /**
   * Fetches all textbooks from the backend.
   * @returns {Promise<AxiosResponse<any>>} Promise resolving with the API response containing the list of textbooks.
   */
  getAll() {
    console.log(`TextbooksService: Fetching textbooks from ${TEXTBOOKS_ENDPOINT}`);
    // Uses the generic ApiService GET method
    return ApiService.get(TEXTBOOKS_ENDPOINT);
  },

  /**
   * Adds a new textbook to the backend.
   * @param {object} textbookData - Object containing textbook details (e.g., { title, description }).
   * @returns {Promise<AxiosResponse<any>>} Promise resolving with the API response containing the newly created textbook.
   */
  add(textbookData) {
     console.log(`TextbooksService: Adding textbook via ${TEXTBOOKS_ENDPOINT}`);
     // Uses the generic ApiService POST method
    return ApiService.post(TEXTBOOKS_ENDPOINT, textbookData);
  },

  /**
   * Updates an existing textbook on the backend.
   * @param {number|string} id - The ID of the textbook to update.
   * @param {object} textbookData - Object containing updated details (e.g., { title, description }).
   * @returns {Promise<AxiosResponse<any>>} Promise resolving with the API response containing the updated textbook.
   */
  update(id, textbookData) {
     console.log(`TextbooksService: Updating textbook ID ${id} via ${TEXTBOOKS_ENDPOINT}/${id}`);
     // Uses the generic ApiService PUT method
     return ApiService.put(`${TEXTBOOKS_ENDPOINT}/${id}`, textbookData);
  },

  /**
   * Deletes a specific textbook from the backend.
   * @param {number|string} id - The ID of the textbook to delete.
   * @returns {Promise<AxiosResponse<any>>} Promise resolving with the API response (usually empty with status 204 on success).
   */
  delete(id) {
     console.log(`TextbooksService: Deleting textbook ID ${id} via ${TEXTBOOKS_ENDPOINT}/${id}`);
     // Uses the generic ApiService DELETE method
     return ApiService.delete(`${TEXTBOOKS_ENDPOINT}/${id}`);
  },

  // --- Placeholder for future methods ---
  // getById(id) {
  //   return ApiService.get(`${TEXTBOOKS_ENDPOINT}/${id}`);
  // },
  // linkToClass(textbookId, classId) { ... }
  // unlinkFromClass(textbookId, classId) { ... }
};

// Export the service object to be used in the Vuex store
export default TextbooksService;

