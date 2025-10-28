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

  /**
   * Fetch the current registration status.
   * Assumes a dedicated endpoint like GET /api/global-settings/registration-status
   * @returns {Promise<AxiosResponse<{ allowRegistration: boolean }>>}
   */
  getRegistrationStatus() {
    const registrationStatusEndpoint = `${ENDPOINT}/registration-status`;
    console.log(`GlobalSettingsService: GET ${registrationStatusEndpoint}`);
    return ApiService.get(registrationStatusEndpoint);
  },

  /**
   * Update the registration status (admin only).
   * Assumes a dedicated endpoint like PUT /api/global-settings/registration-status
   * @param {{ allowRegistration: boolean }} payload
   * @returns {Promise<AxiosResponse<{ message: string, allowRegistration: boolean }>>}
   */
  updateRegistrationStatus(payload) {
    const registrationStatusEndpoint = `${ENDPOINT}/registration-status`;
    console.log(
      `GlobalSettingsService: PUT ${registrationStatusEndpoint} with payload:`,
      payload,
    );
    return ApiService.put(registrationStatusEndpoint, payload);
  },

  updateWeeklyDaysOff(daysOff) {
    console.log(
      "GlobalSettingsService: PUT /global-settings/weekly-days-off",
      daysOff,
    );
    return ApiService.put("/global-settings/weekly-days-off", { daysOff });
  },
};

export default GlobalSettingsService;
