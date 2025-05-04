// client/src/services/ClassesService.js
import ApiService from './ApiService';

// Define the base endpoint for class API calls
const CLASSES_ENDPOINT = '/api/classes'; // Matches server/routes/classRoutes.js

/**
 * Service object for interacting with the class API endpoints.
 */
const ClassesService = {
  /**
   * Fetches all classes for the authenticated user, including linked textbooks.
   * @returns {Promise<AxiosResponse<any>>} Promise resolving with API response.
   */
  getAll() {
    console.log(`ClassesService: Fetching classes from ${CLASSES_ENDPOINT}`);
    return ApiService.get(CLASSES_ENDPOINT);
  },

  /**
   * Adds a new class for the authenticated user.
   * @param {object} classData - Object containing class details (e.g., { classNumber, yearLevel }).
   * @returns {Promise<AxiosResponse<any>>} Promise resolving with API response.
   */
  add(classData) {
     console.log(`ClassesService: Adding class via ${CLASSES_ENDPOINT}`);
    return ApiService.post(CLASSES_ENDPOINT, classData);
  },

  update(id, classData) {
     const url = `${CLASSES_ENDPOINT}/${id}`;
     console.log(`ClassesService: Updating class ID ${id} via PUT ${url}`);
     // Uses the generic ApiService PUT method
     return ApiService.put(url, classData);
  },


  /**
   * Deletes a specific class for the authenticated user.
   * @param {number|string} id - The ID of the class to delete.
   * @returns {Promise<AxiosResponse<any>>} Promise resolving with API response (usually empty on success).
   */
  delete(id) {
     console.log(`ClassesService: Deleting class ID ${id} via ${CLASSES_ENDPOINT}/${id}`);
     // Uses the generic ApiService DELETE method
     return ApiService.delete(`${CLASSES_ENDPOINT}/${id}`);
  },

  /**
   * Links a textbook to a specific class.
   * @param {number|string} classId - The ID of the class.
   * @param {number|string} textbookId - The ID of the textbook to link.
   * @returns {Promise<AxiosResponse<any>>} Promise resolving with the updated class data.
   */
  linkTextbook(classId, textbookId) {
      const url = `${CLASSES_ENDPOINT}/${classId}/textbooks/${textbookId}`;
      console.log(`ClassesService: Linking textbook via POST ${url}`);
      return ApiService.post(url); // POST request to create the link
  },

  /**
   * Unlinks a textbook from a specific class.
   * @param {number|string} classId - The ID of the class.
   * @param {number|string} textbookId - The ID of the textbook to unlink.
   * @returns {Promise<AxiosResponse<any>>} Promise resolving (usually empty on success).
   */
  unlinkTextbook(classId, textbookId) {
      const url = `${CLASSES_ENDPOINT}/${classId}/textbooks/${textbookId}`;
      console.log(`ClassesService: Unlinking textbook via DELETE ${url}`);
      return ApiService.delete(url); // DELETE request to remove the link
  },

  // --- Add getById, update methods later ---
  // getById(id) {
  //   return ApiService.get(`${CLASSES_ENDPOINT}/${id}`);
  // },
  // update(id, classData) {
  //   return ApiService.put(`${CLASSES_ENDPOINT}/${id}`, classData);
  // }
};

// Export the service object
export default ClassesService;

