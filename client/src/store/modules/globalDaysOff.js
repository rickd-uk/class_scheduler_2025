import GlobalDaysOffService from "../../services/GlobalDaysOffService";

export default {
  namespaced: true,
  state: () => ({
    globalDaysOff: [], // Array of { id, startDate, endDate, reason, color }
    expandedDates: new Set(), // Set of all individual dates (for quick lookup)
    rangeMap: new Map(), // Map from date to parent range record
    isLoading: false,
    error: null,
  }),

  mutations: {
    SET_GLOBAL_DAYS_OFF(state, daysOff) {
      // Process the data to normalize date formats and expand ranges
      state.globalDaysOff = daysOff
        .map((d) => {
          // Normalize startDate
          const startDate =
            typeof d.startDate === "string" && d.startDate.length >= 10
              ? d.startDate.slice(0, 10)
              : d.startDate;

          // Normalize endDate (may be null for single days)
          const endDate = d.endDate
            ? typeof d.endDate === "string" && d.endDate.length >= 10
              ? d.endDate.slice(0, 10)
              : d.endDate
            : null;

          return {
            id: d.id,
            startDate,
            endDate,
            reason: d.reason,
            color: d.color || "#E0E0E0",
          };
        })
        .sort((a, b) => a.startDate.localeCompare(b.startDate));

      // Build expanded dates set and range map
      const expandedDates = new Set();
      const rangeMap = new Map();

      state.globalDaysOff.forEach((dayOff) => {
        if (dayOff.endDate) {
          // This is a range
          const start = new Date(dayOff.startDate + "T00:00:00");
          const end = new Date(dayOff.endDate + "T00:00:00");
          const current = new Date(start);

          while (current <= end) {
            const dateStr = current.toISOString().split("T")[0];
            expandedDates.add(dateStr);
            rangeMap.set(dateStr, dayOff);
            current.setDate(current.getDate() + 1);
          }
        } else {
          // Single day
          expandedDates.add(dayOff.startDate);
          rangeMap.set(dayOff.startDate, dayOff);
        }
      });

      state.expandedDates = expandedDates;
      state.rangeMap = rangeMap;
    },

    ADD_GLOBAL_DAY_OFF(state, dayOff) {
      const normalized = {
        ...dayOff,
        color: dayOff.color || "#E0E0E0",
      };
      state.globalDaysOff.push(normalized);
      state.globalDaysOff.sort((a, b) =>
        a.startDate.localeCompare(b.startDate),
      );

      // Update expanded dates
      if (dayOff.endDate) {
        const start = new Date(dayOff.startDate + "T00:00:00");
        const end = new Date(dayOff.endDate + "T00:00:00");
        const current = new Date(start);

        while (current <= end) {
          const dateStr = current.toISOString().split("T")[0];
          state.expandedDates.add(dateStr);
          state.rangeMap.set(dateStr, normalized);
          current.setDate(current.getDate() + 1);
        }
      } else {
        state.expandedDates.add(dayOff.startDate);
        state.rangeMap.set(dayOff.startDate, normalized);
      }
    },

    UPDATE_GLOBAL_DAY_OFF(state, updatedDayOff) {
      const index = state.globalDaysOff.findIndex(
        (d) => d.id === updatedDayOff.id,
      );
      if (index !== -1) {
        const normalized = {
          ...updatedDayOff,
          color: updatedDayOff.color || "#E0E0E0",
        };
        state.globalDaysOff.splice(index, 1, normalized);
        state.globalDaysOff.sort((a, b) =>
          a.startDate.localeCompare(b.startDate),
        );

        // Rebuild expanded dates and range map
        const expandedDates = new Set();
        const rangeMap = new Map();

        state.globalDaysOff.forEach((dayOff) => {
          if (dayOff.endDate) {
            const start = new Date(dayOff.startDate + "T00:00:00");
            const end = new Date(dayOff.endDate + "T00:00:00");
            const current = new Date(start);

            while (current <= end) {
              const dateStr = current.toISOString().split("T")[0];
              expandedDates.add(dateStr);
              rangeMap.set(dateStr, dayOff);
              current.setDate(current.getDate() + 1);
            }
          } else {
            expandedDates.add(dayOff.startDate);
            rangeMap.set(dayOff.startDate, dayOff);
          }
        });

        state.expandedDates = expandedDates;
        state.rangeMap = rangeMap;
      }
    },

    REMOVE_GLOBAL_DAY_OFF(state, id) {
      state.globalDaysOff = state.globalDaysOff.filter((d) => d.id !== id);

      // Rebuild expanded dates and range map
      const expandedDates = new Set();
      const rangeMap = new Map();

      state.globalDaysOff.forEach((dayOff) => {
        if (dayOff.endDate) {
          const start = new Date(dayOff.startDate + "T00:00:00");
          const end = new Date(dayOff.endDate + "T00:00:00");
          const current = new Date(start);

          while (current <= end) {
            const dateStr = current.toISOString().split("T")[0];
            expandedDates.add(dateStr);
            rangeMap.set(dateStr, dayOff);
            current.setDate(current.getDate() + 1);
          }
        } else {
          expandedDates.add(dayOff.startDate);
          rangeMap.set(dayOff.startDate, dayOff);
        }
      });

      state.expandedDates = expandedDates;
      state.rangeMap = rangeMap;
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
      state.expandedDates = new Set();
      state.rangeMap = new Map();
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

    async updateGlobalDayOff({ commit, dispatch }, { id, data }) {
      commit("SET_ERROR", null);
      try {
        const response = await GlobalDaysOffService.update(id, data);
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

    async deleteGlobalDayOff({ commit, dispatch }, id) {
      commit("SET_ERROR", null);
      try {
        await GlobalDaysOffService.delete(id);
        commit("REMOVE_GLOBAL_DAY_OFF", id);
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

    // Check if a specific date is a global day off
    isGlobalDayOff: (state) => (dateString) =>
      state.expandedDates.has(dateString),

    // Get the global day off record for a specific date
    getGlobalDayOffForDate: (state) => (dateString) =>
      state.rangeMap.get(dateString),
  },
};
