// import DaysOffService from '../../services/DaysOffService'; // Assuming you create this service

export default {
  namespaced: true,

  state: () => ({
    daysOff: [], // Array of { date: 'YYYY-MM-DD', reason: 'Holiday' }
    isLoading: false,
    error: null,
  }),

  mutations: {
    SET_DAYS_OFF(state, daysOff) {
      state.daysOff = daysOff;
    },
     ADD_DAY_OFF(state, dayOff) {
      // Avoid duplicates
      if (!state.daysOff.some(d => d.date === dayOff.date)) {
         state.daysOff.push(dayOff);
         // Keep sorted (optional)
         state.daysOff.sort((a, b) => a.date.localeCompare(b.date));
      }
    },
     REMOVE_DAY_OFF(state, date) {
      state.daysOff = state.daysOff.filter(d => d.date !== date);
    },
    SET_LOADING(state, isLoading) {
      state.isLoading = isLoading;
    },
    SET_ERROR(state, error) {
      state.error = error;
    },
     RESET_STATE(state) {
      state.daysOff = [];
      state.isLoading = false;
      state.error = null;
    }
  },

  actions: {
    async fetchDaysOff({ commit }) {
      commit('SET_LOADING', true);
      commit('SET_ERROR', null);
      try {
        // const response = await DaysOffService.getAll(); // Replace with actual API call
        // commit('SET_DAYS_OFF', response.data);

         // Placeholder:
        await new Promise(resolve => setTimeout(resolve, 150)); // Simulate network delay
        const placeholderData = [
           { date: '2025-01-01', reason: 'New Year\'s Day' },
           { date: '2025-05-01', reason: 'Public Holiday' },
           { date: '2025-12-25', reason: 'Christmas Day' },
        ];
        commit('SET_DAYS_OFF', placeholderData);
        console.log('Fetched placeholder days off');

      } catch (error) {
         const message = error.response?.data?.message || error.message || 'Failed to fetch days off';
        commit('SET_ERROR', message);
        console.error('Error fetching days off:', message);
      } finally {
        commit('SET_LOADING', false);
      }
    },
     // Add actions for addDayOff, deleteDayOff
  },

  getters: {
    allDaysOff: state => state.daysOff,
    isLoading: state => state.isLoading,
    error: state => state.error,
    isDayOff: (state) => (dateString) => { // dateString 'YYYY-MM-DD'
        return state.daysOff.some(d => d.date === dateString);
    }
  },
};

