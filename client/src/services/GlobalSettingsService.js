import ApiService from "./ApiService";

const ENDPOINT = "/global-settings";

/**
 * Service for interacting with /api/global-settings.
 * GET requires a valid JWT (authenticateToken middleware).
 * PUT requires both JWT and admin role (isAdmin middleware).
 */
const GlobalSettingsService = {
  /**
   * Fetch the current global settings.
   * @returns {Promise<AxiosResponse<{ applyGlobalDaysOff: boolean,
   *                                   applyGlobalExceptions: boolean }>>}
   */
  get() {
    console.log(`GlobalSettingsService: GET ${ENDPOINT}`);
    return ApiService.get(ENDPOINT);
  },

  /**
   * Update global settings (admin only).
   * @param {{ applyGlobalDaysOff: boolean,
   *           applyGlobalExceptions: boolean }} payload
   * @returns {Promise<AxiosResponse<any>>}
   */
  update(payload) {
    console.log(`GlobalSettingsService: PUT ${ENDPOINT}`);
    return ApiService.put(ENDPOINT, payload);
  },
};

export default GlobalSettingsService;
