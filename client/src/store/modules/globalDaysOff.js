import GlobalDaysOffService from "../../services/GlobalDaysOffService";

export default {
  namespaced: true,
  state: () => ({
    globalDaysOff: [], // Array of { id, date, reason, color }
    isLoading: false,
    error: null,
  }),
  mutations: {
    SET_GLOBAL_DAYS_OFF(state, daysOff) {
      state.globalDaysOff = daysOff
        .map((d) => {
          // d.date might be "2025-05-20T00:00:00.000Z"
          const raw = d.date;
          const dateOnly =
            typeof raw === "string" && raw.length >= 10
              ? raw.slice(0, 10)
              : new Date(raw).toISOString().split("T")[0];
          return {
            id: d.id,
            date: dateOnly,
            reason: d.reason,
            color: d.color || "#E0E0E0",
          };
        })
        .sort((a, b) => a.date.localeCompare(b.date));
    },
    ADD_GLOBAL_DAY_OFF(state, dayOff) {
      state.globalDaysOff.push({ ...dayOff, color: dayOff.color || "#E0E0E0" });
      state.globalDaysOff.sort((a, b) => a.date.localeCompare(b.date));
    },
    UPDATE_GLOBAL_DAY_OFF(state, updatedDayOff) {
      const index = state.globalDaysOff.findIndex(
        (d) => d.id === updatedDayOff.id,
      );
      if (index !== -1) {
        state.globalDaysOff.splice(index, 1, {
          ...updatedDayOff,
          color: updatedDayOff.color || "#E0E0E0",
        });
        state.globalDaysOff.sort((a, b) => a.date.localeCompare(b.date));
      }
    },
    REMOVE_GLOBAL_DAY_OFF(state, date) {
      state.globalDaysOff = state.globalDaysOff.filter((d) => d.date !== date);
    },
    SET_LOADING(state, isLoading) {
      state.isLoading = isLoading;
    },
    SET_ERROR(state, error) {
      state.error = error;
      state.isLoading = false;
    },
    RESET_STATE(state) {
      state.globalDaysOff = [];
      state.isLoading = false;
      state.error = null;
    },
  },
  actions: {
    async fetchGlobalDaysOff({ commit, state }) {
      if (state.isLoading) return;
      commit("SET_LOADING", true);
      commit("SET_ERROR", null);
      try {
        const response = await GlobalDaysOffService.getAll();
        commit("SET_GLOBAL_DAYS_OFF", response.data);
        console.log("Fetched global days off from API");
      } catch (error) {
        const msg =
          error.response?.data?.message ||
          error.message ||
          "Failed to fetch global days off";
        commit("SET_ERROR", msg);
        console.error("Error fetching global days off:", msg);
      } finally {
        commit("SET_LOADING", false);
      }
    },
    async addGlobalDayOff({ commit, dispatch }, dayOffData) {
      commit("SET_ERROR", null);
      try {
        const response = await GlobalDaysOffService.add(dayOffData);
        commit("ADD_GLOBAL_DAY_OFF", response.data);
        dispatch(
          "ui/showNotification",
          { type: "success", message: "Global day off added!" },
          { root: true },
        );
        return response.data;
      } catch (error) {
        const msg =
          error.response?.data?.message ||
          error.message ||
          "Failed to add global day off";
        dispatch(
          "ui/showNotification",
          { type: "error", message: msg },
          { root: true },
        );
        throw new Error(msg);
      }
    },
    async updateGlobalDayOff({ commit, dispatch }, { date, data }) {
      commit("SET_ERROR", null);
      try {
        const response = await GlobalDaysOffService.update(date, data);
        commit("UPDATE_GLOBAL_DAY_OFF", response.data);
        dispatch(
          "ui/showNotification",
          { type: "success", message: "Global day off updated!" },
          { root: true },
        );
        return response.data;
      } catch (error) {
        const msg =
          error.response?.data?.message ||
          error.message ||
          "Failed to update global day off";
        dispatch(
          "ui/showNotification",
          { type: "error", message: msg },
          { root: true },
        );
        throw new Error(msg);
      }
    },
    async deleteGlobalDayOff({ commit, dispatch }, date) {
      commit("SET_ERROR", null);
      try {
        await GlobalDaysOffService.delete(date);
        commit("REMOVE_GLOBAL_DAY_OFF", date);
        dispatch(
          "ui/showNotification",
          { type: "success", message: "Global day off removed." },
          { root: true },
        );
      } catch (error) {
        const msg =
          error.response?.data?.message ||
          error.message ||
          "Failed to delete global day off";
        dispatch(
          "ui/showNotification",
          { type: "error", message: msg },
          { root: true },
        );
        throw new Error(msg);
      }
    },
  },
  getters: {
    allGlobalDaysOff: (state) => state.globalDaysOff,
    isLoading: (state) => state.isLoading,
    error: (state) => state.error,
    isGlobalDayOff: (state) => (dateString) =>
      state.globalDaysOff.some((d) => d.date === dateString),
  },
};
