import ExceptionPatternsService from "../../services/ExceptionPatternsService"; // Use the actual service

export default {
  namespaced: true, // Important for namespacing actions/mutations/getters

  state: () => ({
    patterns: [], // Array to hold exception pattern objects { id, name, patternData, userId, ... }
    isLoading: false, // Loading state for async operations in this module
    error: null, // Error state for async operations in this module
  }),

  mutations: {
    // Sets the entire list of patterns, usually after fetching
    SET_PATTERNS(state, patterns) {
      // Sort patterns alphabetically by name when setting
      state.patterns = patterns.sort((a, b) => a.name.localeCompare(b.name));
    },
    // Adds a single new pattern to the list
    ADD_PATTERN(state, pattern) {
      state.patterns.push(pattern);
      // Keep the list sorted after adding
      state.patterns.sort((a, b) => a.name.localeCompare(b.name));
    },
    // Updates an existing pattern in the list
    UPDATE_PATTERN(state, updatedPattern) {
      const index = state.patterns.findIndex((p) => p.id === updatedPattern.id);
      if (index !== -1) {
        // Replace the item at the found index with the updated one
        state.patterns.splice(index, 1, updatedPattern);
        // Re-sort the list after updating
        state.patterns.sort((a, b) => a.name.localeCompare(b.name));
      } else {
        // Log a warning if the pattern to update wasn't found in the state
        console.warn(
          `Could not find pattern with ID ${updatedPattern.id} to update in state.`,
        );
      }
    },
    // Removes a pattern from the list by its ID
    REMOVE_PATTERN(state, patternId) {
      state.patterns = state.patterns.filter((p) => p.id !== patternId);
    },
    // Sets the loading state for this module
    SET_LOADING(state, isLoading) {
      state.isLoading = isLoading;
    },
    // Sets the error state for this module
    SET_ERROR(state, error) {
      state.error = error;
      state.isLoading = false; // Ensure loading is turned off when an error occurs
    },
    // Resets the module's state to initial values (e.g., on logout)
    RESET_STATE(state) {
      state.patterns = [];
      state.isLoading = false;
      state.error = null;
    },
  },

  actions: {
    // Action to fetch all exception patterns for the user
    async fetchPatterns({ commit, state }) {
      // Prevent multiple concurrent fetches
      if (state.isLoading) return;
      commit("SET_LOADING", true);
      commit("SET_ERROR", null); // Clear previous errors
      try {
        // Call the API service method
        const response = await ExceptionPatternsService.getAll();
        // Commit the mutation to update the state
        commit("SET_PATTERNS", response.data);
        console.log("Fetched exception patterns from API");
      } catch (error) {
        // Handle errors during fetch
        const message =
          error.response?.data?.message ||
          error.message ||
          "Failed to fetch exception patterns";
        commit("SET_ERROR", message); // Set error state
        console.error("Error fetching exception patterns:", message);
        // Optionally dispatch UI notification
        // dispatch('ui/showNotification', { type: 'error', message }, { root: true });
      } finally {
        // Always reset loading state
        commit("SET_LOADING", false);
      }
    },

    // Action to add a new exception pattern
    async addPattern({ commit, dispatch }, patternData) {
      // patternData: { name, patternData }
      commit("SET_ERROR", null); // Clear previous errors
      try {
        // Call the API service method
        const response = await ExceptionPatternsService.add(patternData);
        // Commit mutation to add the new pattern to state
        commit("ADD_PATTERN", response.data);
        // Dispatch success notification via UI module
        dispatch(
          "ui/showNotification",
          { type: "success", message: "Exception pattern created!" },
          { root: true },
        );
        return response.data; // Return created pattern data
      } catch (error) {
        // Handle errors during add
        const message =
          error.response?.data?.message ||
          error.message ||
          "Failed to create pattern";
        // Dispatch error notification via UI module
        dispatch(
          "ui/showNotification",
          { type: "error", message },
          { root: true },
        );
        throw new Error(message); // Re-throw error for component handling
      }
    },

    // Action to update an existing exception pattern
    async updatePattern({ commit, dispatch }, { id, data }) {
      // data: { name, patternData }
      commit("SET_ERROR", null); // Clear previous errors
      try {
        // Call the API service method
        const response = await ExceptionPatternsService.update(id, data);
        // Commit mutation to update the pattern in state
        commit("UPDATE_PATTERN", response.data);
        // Dispatch success notification
        dispatch(
          "ui/showNotification",
          { type: "success", message: "Exception pattern updated!" },
          { root: true },
        );
        return response.data; // Return updated pattern data
      } catch (error) {
        // Handle errors during update
        const message =
          error.response?.data?.message ||
          error.message ||
          "Failed to update pattern";
        // Dispatch error notification
        dispatch(
          "ui/showNotification",
          { type: "error", message },
          { root: true },
        );
        throw new Error(message); // Re-throw error
      }
    },

    // Action to delete an exception pattern
    async deletePattern({ commit, dispatch }, patternId) {
      commit("SET_ERROR", null); // Clear previous errors
      try {
        // Call the API service method
        await ExceptionPatternsService.delete(patternId);
        // Commit mutation to remove the pattern from state
        commit("REMOVE_PATTERN", patternId);
        // Dispatch success notification
        dispatch(
          "ui/showNotification",
          { type: "success", message: "Exception pattern deleted." },
          { root: true },
        );
      } catch (error) {
        // Handle errors during delete
        const message =
          error.response?.data?.message ||
          error.message ||
          "Failed to delete pattern";
        // Dispatch error notification
        dispatch(
          "ui/showNotification",
          { type: "error", message },
          { root: true },
        );
        throw new Error(message); // Re-throw error
      }
    },
  },

  getters: {
    // Get all patterns currently in the state
    allPatterns: (state) => state.patterns,

    personalPatterns: (state, _getters, _rootState, rootGetters) => {
      const me = rootGetters["auth/currentUser"].id;
      return state.patterns.filter((p) => p.userId === me && !p.isGlobal);
    },
    // Get loading status for this module
    isLoading: (state) => state.isLoading,
    // Get error message for this module
    error: (state) => state.error,
    // Get a specific pattern by its ID
    getPatternById: (state) => (id) => state.patterns.find((p) => p.id === id),
  },
};
