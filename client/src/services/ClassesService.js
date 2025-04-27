import ApiService from './ApiService';

const CLASSES_ENDPOINT = '/api/classes'; // Matches server/routes/classRoutes.js

const ClassesService = {
  /**
   * Fetches all classes for the authenticated user.
   * @returns {Promise<AxiosResponse<any>>} Promise resolving with API response.
   */
  getAll() {
    console.log(`ClassesService: Fetching classes from ${CLASSES_ENDPOINT}`);
    return ApiService.get(CLASSES_ENDPOINT);
  },

  /**
   * Adds a new class for the authenticated user.
   * @param {object} classData - Object containing class details (e.g., { name, subject, gradeLevel }).
   * @returns {Promise<AxiosResponse<any>>} Promise resolving with API response.
   */
  add(classData) {
     console.log(`ClassesService: Adding class via ${CLASSES_ENDPOINT}`);
    return ApiService.post(CLASSES_ENDPOINT, classData);
  },

  // --- Add getById, update, delete methods later ---
  // getById(id) {
  //   return ApiService.get(`${CLASSES_ENDPOINT}/${id}`);
  // },
  // update(id, classData) {
  //   return ApiService.put(`${CLASSES_ENDPOINT}/${id}`, classData);
  // },
  // delete(id) {
  //   return ApiService.delete(`${CLASSES_ENDPOINT}/${id}`);
  // }
};

export default ClassesService;

