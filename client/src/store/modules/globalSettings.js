// client/src/store/modules/globalSettings.js
import GlobalSettingsService from "../../services/GlobalSettingsService";

export default {
  namespaced: true,

  state: () => ({
    applyGlobalDaysOff: false,
    applyGlobalExceptions: false,
    allowRegistration: false, // This will be populated by fetchGlobalSettings

    isLoading: false, // Unified: true when fetching initial settings
    isUpdating: false, // Unified: true during any update operation
    error: null, // Unified: stores any error message
  }),

  getters: {
    shouldApplyGlobalDaysOff: (state) => state.applyGlobalDaysOff,
    shouldApplyGlobalExceptions: (state) => state.applyGlobalExceptions,
    isRegistrationAllowed: (state) => {
      // Log when this getter is accessed and what it returns
      console.log(
        "[Vuex Getter] globalSettings/isRegistrationAllowed accessed. Current state.allowRegistration:",
        state.allowRegistration,
      );
      return state.allowRegistration; // Only one return statement needed
    },
    isLoading: (state) => state.isLoading, // For GlobalSettingsPanel initial load
    isUpdating: (state) => state.isUpdating, // For GlobalSettingsPanel to disable toggles
    error: (state) => state.error, // For GlobalSettingsPanel to display errors
  },

  mutations: {
    SET_ALL_GLOBAL_SETTINGS(state, settingsPayload) {
      // settingsPayload is the object from GET /api/global-settings
      console.log(
        "[Vuex Mutation] SET_ALL_GLOBAL_SETTINGS. Payload:",
        settingsPayload,
      );
      console.log(
        "[Vuex Mutation] state.allowRegistration BEFORE:",
        state.allowRegistration,
      );
      state.applyGlobalDaysOff = !!settingsPayload.applyGlobalDaysOff;
      state.applyGlobalExceptions = !!settingsPayload.applyGlobalExceptions;
      state.allowRegistration = !!settingsPayload.allowRegistration; // Important: ensure this is set
      console.log(
        "[Vuex Mutation] state.allowRegistration AFTER:",
        state.allowRegistration,
      );
    },
    // Use this if an update operation (like for registration) returns only a partial update
    UPDATE_SPECIFIC_SETTING_ALLOW_REGISTRATION(state, allow) {
      console.log(
        "[Vuex Mutation] UPDATE_SPECIFIC_SETTING_ALLOW_REGISTRATION. Payload (allow):",
        allow,
      );
      console.log(
        "[Vuex Mutation] state.allowRegistration BEFORE:",
        state.allowRegistration,
      );
      state.allowRegistration = !!allow;
      console.log(
        "[Vuex Mutation] state.allowRegistration AFTER:",
        state.allowRegistration,
      );
    },
    SET_LOADING(state, val) {
      state.isLoading = val;
    },
    SET_UPDATING(state, val) {
      state.isUpdating = val;
    },
    SET_ERROR(state, err) {
      state.error = err;
    },
  },

  actions: {
    // This action should be called by GlobalSettingsPanel.vue onMounted
    async fetchGlobalSettings({ commit }) {
      // Added console.log from your version
      console.log(
        "[Vuex Action] globalSettings/fetchGlobalSettings dispatched",
      );
      commit("SET_LOADING", true);
      commit("SET_ERROR", null);
      try {
        // Ensure GlobalSettingsService.get() hits GET /api/global-settings
        // and returns { applyGlobalDaysOff, applyGlobalExceptions, allowRegistration, ... }
        const { data } = await GlobalSettingsService.get(); // Corrected to .get()
        // Added console.log from your version
        console.log(
          "[Vuex Action] fetchGlobalSettings - API response data:",
          data,
        );
        commit("SET_ALL_GLOBAL_SETTINGS", data);
      } catch (err) {
        const errorMessage =
          err.response?.data?.message ||
          err.message ||
          "Failed to fetch global settings";
        commit("SET_ERROR", errorMessage);
        console.error("Error fetching global settings:", err);
      } finally {
        commit("SET_LOADING", false);
      }
    },

    // For updating applyGlobalDaysOff and applyGlobalExceptions
    // payload: { applyGlobalDaysOff, applyGlobalExceptions }
    async updateGeneralSettings({ commit, dispatch }, payload) {
      // Added console.log for consistency if desired
      // console.log('[Vuex Action] globalSettings/updateGeneralSettings dispatched with payload:', payload);
      commit("SET_UPDATING", true);
      commit("SET_ERROR", null);
      try {
        // Assumes GlobalSettingsService.update() hits PUT /api/global-settings
        // and the backend returns the full updated global settings object.
        const { data } = await GlobalSettingsService.update(payload); // Corrected to .update()
        // console.log('[Vuex Action] updateGeneralSettings - API response data:', data);
        commit("SET_ALL_GLOBAL_SETTINGS", data); // Update the entire state from response
      } catch (err) {
        const errorMessage =
          err.response?.data?.message ||
          err.message ||
          "Failed to update general settings";
        commit("SET_ERROR", errorMessage);
        await dispatch("fetchGlobalSettings");
        throw err;
      } finally {
        commit("SET_UPDATING", false);
      }
    },

    // For updating allowRegistration
    // newStatus is a boolean
    async updateAllowRegistration({ commit, dispatch }, newStatus) {
      // Added console.log from your version
      console.log(
        "[Vuex Action] globalSettings/updateAllowRegistration dispatched with newStatus:",
        newStatus,
      );
      commit("SET_UPDATING", true);
      commit("SET_ERROR", null);
      try {
        const { data } = await GlobalSettingsService.updateRegistrationStatus({
          allowRegistration: newStatus,
        });
        // Added console.log from your version
        console.log(
          "[Vuex Action] updateAllowRegistration - API response data:",
          data,
        );
        commit(
          "UPDATE_SPECIFIC_SETTING_ALLOW_REGISTRATION",
          data.allowRegistration,
        );
      } catch (error) {
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          "Error updating registration status";
        commit("SET_ERROR", errorMessage);
        await dispatch("fetchGlobalSettings");
        throw error;
      } finally {
        commit("SET_UPDATING", false);
      }
    },
  },
};
