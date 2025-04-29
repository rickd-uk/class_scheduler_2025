import DaysOffService from '../../services/DaysOffService'; // Use the actual service

export default {
  namespaced: true, // Ensures module actions/mutations are namespaced (e.g., 'daysOff/fetchDaysOff')

  state: () => ({
    daysOff: [], // Array to hold day off objects { id, date: 'YYYY-MM-DD', reason: '...', userId }
    isLoading: false, // Loading state for async operations in this module
    error: null, // Error state for async operations in this module
  }),

  mutations: {
    // Sets the entire list of days off, usually after fetching
    SET_DAYS_OFF(state, daysOff) {
      // Sort by date when setting the state for consistent display
      state.daysOff = daysOff.sort((a, b) => a.date.localeCompare(b.date));
    },
     // Adds a single new day off to the list
     ADD_DAY_OFF(state, dayOff) {
      // Note: Backend handles uniqueness check per user. This just adds to the local state.
      state.daysOff.push(dayOff);
      // Keep the list sorted after adding
      state.daysOff.sort((a, b) => a.date.localeCompare(b.date));
    },
     // Removes a day off from the list based on its date
     REMOVE_DAY_OFF(state, date) {
      // Filter out the day off with the matching date string
      state.daysOff = state.daysOff.filter(d => d.date !== date);
    },
    // --- Add UPDATE_DAY_OFF mutation ---
    UPDATE_DAY_OFF(state, updatedDayOff) {
        const index = state.daysOff.findIndex(d => d.id === updatedDayOff.id); // Find by ID
        if (index !== -1) {
            // Replace item in array to maintain reactivity
            state.daysOff.splice(index, 1, updatedDayOff);
            // Re-sort if necessary (though usually not needed for update)
            state.daysOff.sort((a, b) => a.date.localeCompare(b.date));
        } else {
            console.warn(`Could not find day off with ID ${updatedDayOff.id} to update in state.`);
        }
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
      state.daysOff = [];
      state.isLoading = false;
      state.error = null;
    }
  },

  actions: {
    // Action to fetch all days off for the logged-in user from the API
    async fetchDaysOff({ commit, state }) {
       // Prevent multiple concurrent fetches
       if (state.isLoading) return;
      commit('SET_LOADING', true);
      commit('SET_ERROR', null); // Clear previous errors before fetching
      try {
        // Call the API service method
        const response = await DaysOffService.getAll();
        // Commit the mutation to update the state with fetched data
        commit('SET_DAYS_OFF', response.data);
        console.log('Fetched days off from API');
      } catch (error) {
         // Handle errors during fetch
         const message = error.response?.data?.message || error.message || 'Failed to fetch days off';
        commit('SET_ERROR', message); // Set error state
        console.error('Error fetching days off:', message);
        // Optionally dispatch a UI notification for the user
        // dispatch('ui/showNotification', { type: 'error', message }, { root: true });
      } finally {
         // Always reset loading state after the operation completes
        commit('SET_LOADING', false);
      }
    },

    // Action to add a new day off for the logged-in user
     async addDayOff({ commit, dispatch }, dayOffData) {
        // dayOffData should be { date: 'YYYY-MM-DD', reason?: string }
        commit('SET_ERROR', null); // Clear previous errors
        try {
            // Call the API service method
            const response = await DaysOffService.add(dayOffData);
            // Commit the mutation to add the new day off to the local state
            commit('ADD_DAY_OFF', response.data); // API returns the created object
            console.log('Added day off via API:', response.data);
            // Optionally dispatch success notification via the UI module
            dispatch('ui/showNotification', { type: 'success', message: 'Day off added successfully!' }, { root: true });
            return response.data; // Return the created object in case the caller needs it
        } catch (error) {
             // Handle errors during add (e.g., duplicate date for user)
             const message = error.response?.data?.message || error.message || 'Failed to add day off';
             console.error('Error adding day off:', message);
             // Optionally dispatch error notification via the UI module
             dispatch('ui/showNotification', { type: 'error', message }, { root: true });
             throw new Error(message); // Re-throw the error so the component can catch it if needed
        }
     },

    // --- Add updateDayOff action ---
    async updateDayOff({ commit, dispatch }, { date, data }) {
        // data should be { reason: '...' }
        commit('SET_ERROR', null);
        try {
            const response = await DaysOffService.update(date, data);
            commit('UPDATE_DAY_OFF', response.data); // Commit mutation with updated data from API
            console.log(`Updated day off for ${date} via API:`, response.data);
            dispatch('ui/showNotification', { type: 'success', message: 'Day off updated successfully!' }, { root: true });
            return response.data;
        } catch (error) {
             const message = error.response?.data?.message || error.message || 'Failed to update day off';
             console.error(`Error updating day off for ${date}:`, message);
             dispatch('ui/showNotification', { type: 'error', message }, { root: true });
             throw new Error(message);
        }
    },


     // Action to delete a day off for the logged-in user by date
     async deleteDayOff({ commit, dispatch }, date) {
        // date should be 'YYYY-MM-DD' string
        commit('SET_ERROR', null); // Clear previous errors
        try {
            // Call the API service method
            await DaysOffService.delete(date);
            // Commit the mutation to remove the day off from the local state
            commit('REMOVE_DAY_OFF', date);
            console.log(`Deleted day off for ${date} via API`);
            // Optionally dispatch success notification
            dispatch('ui/showNotification', { type: 'success', message: 'Day off removed successfully.' }, { root: true });
        } catch (error) {
             // Handle errors during delete
             const message = error.response?.data?.message || error.message || 'Failed to delete day off';
             console.error(`Error deleting day off for ${date}:`, message);
             // Optionally dispatch error notification
             dispatch('ui/showNotification', { type: 'error', message }, { root: true });
             throw new Error(message); // Re-throw for component handling
        }
     }
     // Add updateDayOff action later if needed (would require a PUT route)
  },

  getters: {
    // Get all days off currently stored in the state
    allDaysOff: state => state.daysOff,
    // Get the loading status for this module
    isLoading: state => state.isLoading,
    // Get the error message for this module
    error: state => state.error,
    // Check if a specific date string ('YYYY-MM-DD') is marked as a day off
    // Useful for components like the DailySchedulePanel
    isDayOff: (state) => (dateString) => {
        // Check if any object in the daysOff array has a matching date property
        return state.daysOff.some(d => d.date === dateString);
    }
  },
};

