// client/src/store/modules/daysOff.js
import DaysOffService from '../../services/DaysOffService'

// Helper to ensure color has default value
const ensureColor = (dayOff) => ({
  ...dayOff,
  color: dayOff.color || '#F0F0F0'
})

// Helper to expand date ranges into individual dates for quick lookup
const expandRanges = (daysOff) => {
  const expandedDates = new Set();
  const rangeMap = new Map(); // Map from date string to range record
  
  daysOff.forEach(dayOff => {
    if (dayOff.startDate && dayOff.endDate) {
      // This is a range
      const start = new Date(dayOff.startDate + 'T00:00:00');
      const end = new Date(dayOff.endDate + 'T00:00:00');
      const current = new Date(start);
      
      while (current <= end) {
        const dateStr = current.toISOString().split('T')[0];
        expandedDates.add(dateStr);
        rangeMap.set(dateStr, dayOff);
        current.setDate(current.getDate() + 1);
      }
    } else {
      // Single day
      expandedDates.add(dayOff.date);
    }
  });
  
  return { expandedDates, rangeMap };
};

export default {
  namespaced: true,

  state: () => ({
    daysOff: [], // Array of day off records (includes both single days and ranges)
    expandedDates: new Set(), // Set of all individual dates (for quick lookup)
    rangeMap: new Map(), // Map from date to parent range record
    isLoading: false,
    error: null,
  }),

  mutations: {
    SET_DAYS_OFF(state, daysOff) {
      state.daysOff = daysOff.map(ensureColor);
      const { expandedDates, rangeMap } = expandRanges(state.daysOff);
      state.expandedDates = expandedDates;
      state.rangeMap = rangeMap;
    },
    
    ADD_DAY_OFF(state, dayOff) {
      const withColor = ensureColor(dayOff);
      state.daysOff.push(withColor);
      
      // Update expanded dates
      if (dayOff.startDate && dayOff.endDate) {
        const start = new Date(dayOff.startDate + 'T00:00:00');
        const end = new Date(dayOff.endDate + 'T00:00:00');
        const current = new Date(start);
        
        while (current <= end) {
          const dateStr = current.toISOString().split('T')[0];
          state.expandedDates.add(dateStr);
          state.rangeMap.set(dateStr, withColor);
          current.setDate(current.getDate() + 1);
        }
      } else {
        state.expandedDates.add(dayOff.date);
      }
    },
    
    UPDATE_DAY_OFF(state, updatedDayOff) {
      const index = state.daysOff.findIndex(d => d.id === updatedDayOff.id);
      if (index !== -1) {
        const withColor = ensureColor(updatedDayOff);
        state.daysOff.splice(index, 1, withColor);
        
        // Rebuild expanded dates and range map
        const { expandedDates, rangeMap } = expandRanges(state.daysOff);
        state.expandedDates = expandedDates;
        state.rangeMap = rangeMap;
      }
    },
    
    REMOVE_DAY_OFF(state, id) {
      state.daysOff = state.daysOff.filter(d => d.id !== id);
      
      // Rebuild expanded dates and range map
      const { expandedDates, rangeMap } = expandRanges(state.daysOff);
      state.expandedDates = expandedDates;
      state.rangeMap = rangeMap;
    },
    
    SET_LOADING(state, isLoading) {
      state.isLoading = isLoading;
    },
    
    SET_ERROR(state, error) {
      state.error = error;
    },
    
    RESET_STATE(state) {
      state.daysOff = [];
      state.expandedDates = new Set();
      state.rangeMap = new Map();
      state.isLoading = false;
      state.error = null;
    }
  },

  actions: {
    // Action to fetch all days off for the logged-in user from the API
    async fetchDaysOff({ commit, state }) {
      if (state.isLoading) return;
      commit('SET_LOADING', true);
      commit('SET_ERROR', null);
      try {
        const response = await DaysOffService.getAll();
        commit('SET_DAYS_OFF', response.data);
        console.log('Fetched days off from API:', response.data);
      } catch (error) {
        const message = error.response?.data?.message || error.message || 'Failed to fetch days off';
        commit('SET_ERROR', message);
        console.error('Error fetching days off:', message);
      } finally {
        commit('SET_LOADING', false);
      }
    },

    // Action to add a new day off for the logged-in user (single day or range)
    async addDayOff({ commit, dispatch }, dayOffData) {
      // dayOffData should be either:
      // { date: 'YYYY-MM-DD', reason?: string, color?: '#RRGGBB' } for single day
      // { startDate: 'YYYY-MM-DD', endDate: 'YYYY-MM-DD', reason?: string, color?: '#RRGGBB' } for range
      commit('SET_ERROR', null);
      try {
        const response = await DaysOffService.add(dayOffData);
        commit('ADD_DAY_OFF', response.data);
        console.log('Added day off via API:', response.data);
        
        const isRange = response.data.startDate && response.data.endDate;
        const message = isRange 
          ? 'Date range added successfully!' 
          : 'Day off added successfully!';
        dispatch('ui/showNotification', { type: 'success', message }, { root: true });
        return response.data;
      } catch (error) {
        const message = error.response?.data?.message || error.message || 'Failed to add day off';
        console.error('Error adding day off:', message);
        dispatch('ui/showNotification', { type: 'error', message }, { root: true });
        throw new Error(message);
      }
    },

    // Action to update a day off (reason, color, or range dates)
    async updateDayOff({ commit, dispatch }, { id, data }) {
      // data should be { reason?: '...', color?: '#RRGGBB', startDate?: '...', endDate?: '...' }
      commit('SET_ERROR', null);
      try {
        const response = await DaysOffService.update(id, data);
        commit('UPDATE_DAY_OFF', response.data);
        console.log(`Updated day off ID ${id} via API:`, response.data);
        dispatch('ui/showNotification', { type: 'success', message: 'Day off updated successfully!' }, { root: true });
        return response.data;
      } catch (error) {
        const message = error.response?.data?.message || error.message || 'Failed to update day off';
        console.error(`Error updating day off ID ${id}:`, message);
        dispatch('ui/showNotification', { type: 'error', message }, { root: true });
        throw new Error(message);
      }
    },

    // Action to delete a day off for the logged-in user by ID
    async deleteDayOff({ commit, dispatch }, id) {
      commit('SET_ERROR', null);
      try {
        await DaysOffService.delete(id);
        commit('REMOVE_DAY_OFF', id);
        console.log(`Deleted day off ID ${id} via API`);
        dispatch('ui/showNotification', { type: 'success', message: 'Day off removed successfully.' }, { root: true });
      } catch (error) {
        const message = error.response?.data?.message || error.message || 'Failed to delete day off';
        console.error(`Error deleting day off ID ${id}:`, message);
        dispatch('ui/showNotification', { type: 'error', message }, { root: true });
        throw new Error(message);
      }
    },

    // Action to check if a specific date is a day off
    async checkDate({ state }, dateString) {
      // First check locally
      if (state.expandedDates.has(dateString)) {
        const rangeRecord = state.rangeMap.get(dateString);
        return { isDayOff: true, dayOff: rangeRecord };
      }
      
      // If not found locally, optionally query the API
      try {
        const response = await DaysOffService.checkDate(dateString);
        return response.data;
      } catch (error) {
        console.error(`Error checking date ${dateString}:`, error);
        return { isDayOff: false };
      }
    }
  },

  getters: {
    allDaysOff: state => state.daysOff,
    isLoading: state => state.isLoading,
    error: state => state.error,
    
    // Check if a specific date is a day off (local check only)
    isDayOff: (state) => (dateString) => {
      return state.expandedDates.has(dateString);
    },
    
    // Get the day off record for a specific date (useful for getting color/reason)
    getDayOffForDate: (state) => (dateString) => {
      // Check if it's part of a range
      if (state.rangeMap.has(dateString)) {
        return state.rangeMap.get(dateString);
      }
      
      // Check single days
      return state.daysOff.find(d => d.date === dateString && !d.startDate);
    },
    
    // Get all date ranges (for display purposes)
    dateRanges: state => state.daysOff.filter(d => d.startDate && d.endDate),
    
    // Get all single days (for display purposes)
    singleDays: state => state.daysOff.filter(d => !d.startDate),
    
    // Helper to calculate day count for a range
    getDayCount: () => (dayOff) => {
      if (!dayOff.startDate || !dayOff.endDate) return 1;
      
      const start = new Date(dayOff.startDate + 'T00:00:00');
      const end = new Date(dayOff.endDate + 'T00:00:00');
      const diffTime = Math.abs(end - start);
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    }
  },
};
