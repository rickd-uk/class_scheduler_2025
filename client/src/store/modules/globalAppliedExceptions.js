import GlobalAppliedExceptionsService from "../../services/GlobalAppliedExceptionsService";

export default {
  namespaced: true,
  state: () => ({
    globalExceptions: [], // Array of { id, date, exceptionPatternId, reason, ExceptionPattern }
    isLoading: false,
    error: null,
  }),
  mutations: {
    SET_GLOBAL_EXCEPTIONS(state, exceptions) {
      state.globalExceptions = exceptions.sort((a, b) =>
        a.date.localeCompare(b.date),
      );
    },
    ADD_GLOBAL_EXCEPTION(state, exception) {
      // Replace if date exists, otherwise add
      const index = state.globalExceptions.findIndex(
        (ex) => ex.date === exception.date,
      );
      if (index !== -1) {
        state.globalExceptions.splice(index, 1, exception);
      } else {
        state.globalExceptions.push(exception);
      }
      state.globalExceptions.sort((a, b) => a.date.localeCompare(b.date));
    },
    REMOVE_GLOBAL_EXCEPTION(state, date) {
      state.globalExceptions = state.globalExceptions.filter(
        (ex) => ex.date !== date,
      );
    },
    SET_LOADING(state, isLoading) {
      state.isLoading = isLoading;
    },
    SET_ERROR(state, error) {
      state.error = error;
      state.isLoading = false;
    },
    RESET_STATE(state) {
      state.globalExceptions = [];
      state.isLoading = false;
      state.error = null;
    },
  },
  actions: {
    async fetchGlobalExceptions({ commit, state }) {
      if (state.isLoading) return;
      commit("SET_LOADING", true);
      commit("SET_ERROR", null);
      try {
        const response = await GlobalAppliedExceptionsService.getAll();
        commit("SET_GLOBAL_EXCEPTIONS", response.data);
        console.log("Fetched global applied exceptions from API");
      } catch (error) {
        const msg =
          error.response?.data?.message ||
          error.message ||
          "Failed to fetch global exceptions";
        commit("SET_ERROR", msg);
        console.error("Error fetching global exceptions:", msg);
      } finally {
        commit("SET_LOADING", false);
      }
    },
    async applyGlobalException({ commit, dispatch }, exceptionData) {
      // exceptionData: { date, exceptionPatternId, reason? }
      commit("SET_ERROR", null);
      try {
        const response =
          await GlobalAppliedExceptionsService.apply(exceptionData);
        commit("ADD_GLOBAL_EXCEPTION", response.data); // Use ADD mutation (handles update/insert)
        dispatch(
          "ui/showNotification",
          { type: "success", message: "Global exception applied!" },
          { root: true },
        );
        return response.data;
      } catch (error) {
        const msg =
          error.response?.data?.message ||
          error.message ||
          "Failed to apply global exception";
        dispatch(
          "ui/showNotification",
          { type: "error", message: msg },
          { root: true },
        );
        throw new Error(msg);
      }
    },
    async clearGlobalException({ commit, dispatch }, date) {
      commit("SET_ERROR", null);
      try {
        await GlobalAppliedExceptionsService.clear(date);
        commit("REMOVE_GLOBAL_EXCEPTION", date);
        dispatch(
          "ui/showNotification",
          { type: "success", message: "Global exception cleared." },
          { root: true },
        );
      } catch (error) {
        const msg =
          error.response?.data?.message ||
          error.message ||
          "Failed to clear global exception";
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
    allGlobalExceptions: (state) => state.globalExceptions,
    isLoading: (state) => state.isLoading,
    error: (state) => state.error,
    getGlobalExceptionForDate: (state) => (dateString) =>
      state.globalExceptions.find((e) => e.date === dateString),
  },
};
