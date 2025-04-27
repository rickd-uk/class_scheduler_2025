import ApiService from './ApiService';

const TEXTBOOKS_ENDPOINT = '/api/textbooks'; // Matches server/routes/textbookRoutes.js

const TextbooksService = {
  /**
   * Fetches all textbooks.
   * @returns {Promise<AxiosResponse<any>>} Promise resolving with API response.
   */
  getAll() {
    console.log(`TextbooksService: Fetching textbooks from ${TEXTBOOKS_ENDPOINT}`);
    return ApiService.get(TEXTBOOKS_ENDPOINT);
  },

  /**
   * Adds a new textbook.
   * @param {object} textbookData - Object containing textbook details (e.g., { title, description }).
   * @returns {Promise<AxiosResponse<any>>} Promise resolving with API response.
   */
  add(textbookData) {
     console.log(`TextbooksService: Adding textbook via ${TEXTBOOKS_ENDPOINT}`);
    return ApiService.post(TEXTBOOKS_ENDPOINT, textbookData);
  },

  /**
   * Updates an existing textbook.
   * @param {number|string} id - The ID of the textbook to update.
   * @param {object} textbookData - Object containing updated details (e.g., { title, description }).
   * @returns {Promise<AxiosResponse<any>>} Promise resolving with API response.
   */
  update(id, textbookData) {
     console.log(`TextbooksService: Updating textbook ID ${id} via ${TEXTBOOKS_ENDPOINT}/${id}`);
     return ApiService.put(`${TEXTBOOKS_ENDPOINT}/${id}`, textbookData);
  },

  /**
   * Deletes a specific textbook.
   * @param {number|string} id - The ID of the textbook to delete.
   * @returns {Promise<AxiosResponse<any>>} Promise resolving with API response (usually empty on success).
   */
  delete(id) {
     console.log(`TextbooksService: Deleting textbook ID ${id} via ${TEXTBOOKS_ENDPOINT}/${id}`);
     return ApiService.delete(`${TEXTBOOKS_ENDPOINT}/${id}`);
  },

  // --- Add getById method later ---
  // --- Add methods for linking/unlinking later ---
};

export default TextbooksService;
