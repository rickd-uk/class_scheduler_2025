// client/src/store/modules/globalSettings.js
import GlobalSettingsService from "../../services/GlobalSettingsService";

export default {
  namespaced: true,

  // --- State ---
  state: () => ({
    applyGlobalDaysOff: false,
    applyGlobalExceptions: false,
    isLoading: false,
    allowRegistration: false, // Default initial state
    isLoadingRegistrationStatus: false,
    error: null,
  }),

  // --- Getters ---
  getters: {
    shouldApplyGlobalDaysOff: (s) => s.applyGlobalDaysOff,
    shouldApplyGlobalExceptions: (s) => s.applyGlobalExceptions,
    isRegistrationAllowed: (state) => state.allowRegistration,
    isLoadingRegistrationStatus: (s) => s.isLoadingRegistrationStatus, // Specific loading
    isLoading: (s) => s.isLoading,
    error: (s) => s.error,
  },

  // --- Mutations ---
  mutations: {
    SET_SETTINGS(state, settings) {
      state.applyGlobalDaysOff = !!settings.applyGlobalDaysOff;
      state.applyGlobalExceptions = !!settings.applyGlobalExceptions;
    },
    SET_LOADING(state, val) {
      state.isLoading = val;
    },
    SET_ERROR(state, err) {
      state.error = err;
    },

    // --- Mutations for registration status ---
    SET_REGISTRATION_STATUS(state, status) {
      state.allowRegistration = !!status; // Ensure it's a boolean
    },
    SET_LOADING_REGISTRATION_STATUS(state, isLoading) {
      state.isLoadingRegistrationStatus = isLoading;
    },
  },

  // --- Actions ---
  actions: {
    async fetchSettings({ commit }) {
      commit("SET_LOADING", true);
      try {
        const { data } = await GlobalSettingsService.get();
        commit("SET_SETTINGS", data);
        commit("SET_ERROR", null);
      } catch (err) {
        commit("SET_ERROR", err);
        throw err;
      } finally {
        commit("SET_LOADING", false);
      }
    },
    async updateSettings({ commit }, payload) {
      commit("SET_LOADING", true);
      try {
        const { data } = await GlobalSettingsService.update(payload);
        commit("SET_SETTINGS", data);
        commit("SET_ERROR", null);
      } catch (err) {
        commit("SET_ERROR", err);
        throw err;
      } finally {
        commit("SET_LOADING", false);
      }
    },
    async fetchRegistrationStatus({ commit }) {
      commit("setLoadingRegistrationStatus", true);
      try {
        const response = await GlobalSettingsService.getRegistrationStatus();
        commit("setRegistrationStatus", response.data.allowRegistration);
      } catch (error) {
        console.error("Error fetching registration status:", error);
        // Handle error appropriately, maybe commit an error state
      } finally {
        commit("setLoadingRegistrationStatus", false);
      }
    },
    async updateRegistrationStatus({ commit }, newStatus) {
      // newStatus is a boolean
      try {
        const response = await GlobalSettingsService.updateRegistrationStatus({
          allowRegistration: newStatus,
        });
        commit("setRegistrationStatus", response.data.allowRegistration);
      } catch (error) {
        console.error("Error updating registration status:", error);
        // Handle error appropriately
        throw error; // Re-throw for component to handle
      }
    },
  },
};
