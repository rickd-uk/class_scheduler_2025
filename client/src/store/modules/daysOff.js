import DaysOffService from '../../services/DaysOffService'; // Use the actual service

export default {
  namespaced: true,

  state: () => ({
    daysOff: [], // Array of { id, date: 'YYYY-MM-DD', reason: '...', userId, color: '#RRGGBB' }
    isLoading: false,
    error: null,
  }),

  mutations: {
    SET_DAYS_OFF(state, daysOff) {
      // Ensure color exists with a default, then sort
      state.daysOff = daysOff.map(d => ({
          ...d,
          color: d.color || '#F0F0F0' // Default light grey if missing
      })).sort((a, b) => a.date.localeCompare(b.date));
    },
     ADD_DAY_OFF(state, dayOff) {
      // Ensure color exists with a default when adding
      const dayOffWithColor = {
          ...dayOff,
          color: dayOff.color || '#F0F0F0' // Default light grey if missing
      };
      state.daysOff.push(dayOffWithColor);
      // Keep the list sorted after adding
      state.daysOff.sort((a, b) => a.date.localeCompare(b.date));
    },
     REMOVE_DAY_OFF(state, date) {
      // Filter out the day off based on the date string
      state.daysOff = state.daysOff.filter(d => d.date !== date);
    },
    // --- Add UPDATE_DAY_OFF mutation ---
    UPDATE_DAY_OFF(state, updatedDayOff) {
        // Find by ID (assuming API returns object with ID)
        const index = state.daysOff.findIndex(d => d.id === updatedDayOff.id);
        if (index !== -1) {
            // Replace item in array, ensuring color default
            state.daysOff.splice(index, 1, {
                ...updatedDayOff,
                color: updatedDayOff.color || '#F0F0F0' // Ensure default
            });
            // Re-sort might be needed if date could change (though unlikely for update)
            state.daysOff.sort((a, b) => a.date.localeCompare(b.date));
        } else {
            console.warn(`Could not find day off with ID ${updatedDayOff.id} to update in state.`);
        }
    },
    SET_LOADING(state, isLoading) { state.isLoading = isLoading; },
    SET_ERROR(state, error) { state.error = error; state.isLoading = false; },
     RESET_STATE(state) { state.daysOff = []; state.isLoading = false; state.error = null; }
  },

  actions: {
    // Action to fetch all days off for the logged-in user from the API
    async fetchDaysOff({ commit, state }) {
       if (state.isLoading) return;
      commit('SET_LOADING', true);
      commit('SET_ERROR', null);
      try {
        const response = await DaysOffService.getAll();
        // SET_DAYS_OFF mutation now handles default color
        commit('SET_DAYS_OFF', response.data);
        console.log('Fetched days off from API');
      } catch (error) {
         const message = error.response?.data?.message || error.message || 'Failed to fetch days off';
        commit('SET_ERROR', message);
        console.error('Error fetching days off:', message);
      } finally {
        commit('SET_LOADING', false);
      }
    },

    // Action to add a new day off for the logged-in user
     async addDayOff({ commit, dispatch }, dayOffData) {
        // dayOffData should be { date: 'YYYY-MM-DD', reason?: string, color?: '#RRGGBB' }
        commit('SET_ERROR', null);
        try {
            const response = await DaysOffService.add(dayOffData);
            // ADD_DAY_OFF mutation now handles default color
            commit('ADD_DAY_OFF', response.data);
            console.log('Added day off via API:', response.data);
            dispatch('ui/showNotification', { type: 'success', message: 'Day off added successfully!' }, { root: true });
            return response.data;
        } catch (error) {
             const message = error.response?.data?.message || error.message || 'Failed to add day off';
             console.error('Error adding day off:', message);
             dispatch('ui/showNotification', { type: 'error', message }, { root: true });
             throw new Error(message);
        }
     },

     // Action to update a day off (reason and/or color)
    async updateDayOff({ commit, dispatch }, { date, data }) {
        // data should be { reason?: '...', color?: '#RRGGBB' }
        commit('SET_ERROR', null);
        try {
            // Call the service method to update
            const response = await DaysOffService.update(date, data);
            // Commit mutation with updated data returned from API
            commit('UPDATE_DAY_OFF', response.data);
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
        commit('SET_ERROR', null);
        try {
            await DaysOffService.delete(date);
            commit('REMOVE_DAY_OFF', date);
            console.log(`Deleted day off for ${date} via API`);
            dispatch('ui/showNotification', { type: 'success', message: 'Day off removed successfully.' }, { root: true });
        } catch (error) {
             const message = error.response?.data?.message || error.message || 'Failed to delete day off';
             console.error(`Error deleting day off for ${date}:`, message);
             dispatch('ui/showNotification', { type: 'error', message }, { root: true });
             throw new Error(message);
        }
     }
  },

  getters: {
    allDaysOff: state => state.daysOff,
    isLoading: state => state.isLoading,
    error: state => state.error,
    isDayOff: (state) => (dateString) => {
        return state.daysOff.some(d => d.date === dateString);
    }
  },
};
