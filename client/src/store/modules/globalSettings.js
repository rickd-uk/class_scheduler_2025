// client/src/store/modules/globalSettings.js
import GlobalSettingsService from "../../services/GlobalSettingsService";

export default {
  namespaced: true,

  // --- State ---
  state: () => ({
    applyGlobalDaysOff: false,
    applyGlobalExceptions: false,
    isLoading: false,
    error: null,
  }),

  // --- Getters ---
  getters: {
    shouldApplyGlobalDaysOff: (s) => s.applyGlobalDaysOff,
    shouldApplyGlobalExceptions: (s) => s.applyGlobalExceptions,
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
  },
};
