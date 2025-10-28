// client/src/store/modules/globalSettings.js
import GlobalSettingsService from "../../services/GlobalSettingsService";

export default {
  namespaced: true,

  state: () => ({
    applyGlobalDaysOff: false,
    applyGlobalExceptions: false,
    allowRegistration: false,
    weeklyDaysOff: [], // Holds the array like ["monday", "tuesday"]
    isLoading: false,
    isUpdating: false,
    error: null,
  }),

  getters: {
    shouldApplyGlobalDaysOff: (state) => state.applyGlobalDaysOff,
    shouldApplyGlobalExceptions: (state) => state.applyGlobalExceptions,
    isRegistrationAllowed: (state) => state.allowRegistration,
    getWeeklyDaysOff: (state) => state.weeklyDaysOff || [], // Ensure it returns an array
    isLoading: (state) => state.isLoading,
    isUpdating: (state) => state.isUpdating,
    error: (state) => state.error,
  },

  mutations: {
    // Mutation to update only weekly days off
    SET_WEEKLY_DAYS_OFF(state, daysOffArray) {
      // Ensure it's always an array
      state.weeklyDaysOff = Array.isArray(daysOffArray) ? daysOffArray : [];
      console.log(
        "[Vuex Mutation] SET_WEEKLY_DAYS_OFF updated:",
        state.weeklyDaysOff,
      );
    },

    // Mutation called when fetching ALL settings
    SET_ALL_GLOBAL_SETTINGS(state, settingsPayload) {
      console.log(
        "[Vuex Mutation] SET_ALL_GLOBAL_SETTINGS Payload:",
        settingsPayload,
      );
      state.applyGlobalDaysOff = !!settingsPayload.applyGlobalDaysOff;
      state.applyGlobalExceptions = !!settingsPayload.applyGlobalExceptions;
      state.allowRegistration = !!settingsPayload.allowRegistration;

      // --- FIX: Correctly set weeklyDaysOff from payload ---
      state.weeklyDaysOff = Array.isArray(settingsPayload.weekly_days_off)
        ? settingsPayload.weekly_days_off
        : [];
      console.log(
        "[Vuex Mutation] state.weeklyDaysOff AFTER:",
        state.weeklyDaysOff,
      );
      // --- END FIX ---
    },

    UPDATE_SPECIFIC_SETTING_ALLOW_REGISTRATION(state, allow) {
      console.log(
        "[Vuex Mutation] UPDATE_SPECIFIC_SETTING_ALLOW_REGISTRATION. Payload (allow):",
        allow,
      );
      state.allowRegistration = !!allow;
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
    RESET_STATE(state) {
      state.applyGlobalDaysOff = false;
      state.applyGlobalExceptions = false;
      state.allowRegistration = false;
      state.weeklyDaysOff = []; // Reset here too
      state.isLoading = false;
      state.isUpdating = false;
      state.error = null;
    },
  },

  actions: {
    // Fetches ALL settings, including weekly days off
    async fetchGlobalSettings({ commit }) {
      console.log(
        "[Vuex Action] globalSettings/fetchGlobalSettings dispatched",
      );
      commit("SET_LOADING", true);
      commit("SET_ERROR", null);
      try {
        const { data } = await GlobalSettingsService.get();
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

    // Action specifically for UPDATING weekly days off
    async updateWeeklyDaysOff({ commit, dispatch }, daysOffArray) {
      console.log(
        "[Vuex Action] globalSettings/updateWeeklyDaysOff dispatched with:",
        daysOffArray,
      );
      commit("SET_UPDATING", true);
      commit("SET_ERROR", null);
      try {
        const response =
          await GlobalSettingsService.updateWeeklyDaysOff(daysOffArray);

        commit("SET_WEEKLY_DAYS_OFF", response.data.weeklyDaysOff);
        dispatch(
          "ui/showNotification",
          { type: "success", message: "Weekly days off updated." },
          { root: true },
        ); // Notify user
      } catch (error) {
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          "Error updating weekly days off";
        commit("SET_ERROR", errorMessage);
        console.error("Error updating weekly days off:", error);
        dispatch(
          "ui/showNotification",
          { type: "error", message: errorMessage },
          { root: true },
        ); // Notify user
        throw error;
      } finally {
        commit("SET_UPDATING", false);
      }
    },

    // --- RESTORED THIS FUNCTION ---
    async updateGeneralSettings({ commit, dispatch }, payload) {
      commit("SET_UPDATING", true);
      commit("SET_ERROR", null);
      try {
        const { data } = await GlobalSettingsService.update(payload);
        commit("SET_ALL_GLOBAL_SETTINGS", data);
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

    // --- RESTORED THIS FUNCTION ---
    async updateAllowRegistration({ commit, dispatch }, newStatus) {
      commit("SET_UPDATING", true);
      commit("SET_ERROR", null);
      try {
        const { data } = await GlobalSettingsService.updateRegistrationStatus({
          allowRegistration: newStatus,
        });
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
