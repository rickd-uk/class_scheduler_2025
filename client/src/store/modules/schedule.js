// import ScheduleService from '../../services/ScheduleService'; // Assuming you create this service

export default {
  namespaced: true,

  state: () => ({
    regularSchedule: {}, // e.g., { monday: [...], tuesday: [...], ... }
    dailyExceptions: [], // Array of exceptions { date: 'YYYY-MM-DD', changes: [...] }
    isLoading: false,
    error: null,
  }),

  mutations: {
    SET_REGULAR_SCHEDULE(state, schedule) {
      state.regularSchedule = schedule;
    },
    SET_DAILY_EXCEPTIONS(state, exceptions) {
      state.dailyExceptions = exceptions;
    },
    ADD_EXCEPTION(state, exception) {
        state.dailyExceptions.push(exception);
    },
    UPDATE_EXCEPTION(state, updatedException) {
       const index = state.dailyExceptions.findIndex(e => e.date === updatedException.date); // Or use an ID if available
       if (index !== -1) {
         state.dailyExceptions.splice(index, 1, updatedException);
       }
    },
     REMOVE_EXCEPTION(state, exceptionDate) { // Or ID
      state.dailyExceptions = state.dailyExceptions.filter(e => e.date !== exceptionDate);
    },
    SET_LOADING(state, isLoading) {
      state.isLoading = isLoading;
    },
    SET_ERROR(state, error) {
      state.error = error;
    },
     RESET_STATE(state) {
      state.regularSchedule = {};
      state.dailyExceptions = [];
      state.isLoading = false;
      state.error = null;
    }
  },

  actions: {
    async fetchRegularSchedule({ commit }) {
      commit('SET_LOADING', true);
      commit('SET_ERROR', null);
      try {
        // const response = await ScheduleService.getRegular(); // Replace with actual API call
        // commit('SET_REGULAR_SCHEDULE', response.data);

         // Placeholder:
        await new Promise(resolve => setTimeout(resolve, 400)); // Simulate network delay
        const placeholderData = {
            monday: [{ time: '09:00', classId: 'c1', duration: 60, notes: 'Period 1' }, { time: '10:15', classId: 'c2', duration: 60, notes: 'Period 2' }],
            tuesday: [{ time: '09:00', classId: 'c3', duration: 90, notes: 'Block 1' }],
            wednesday: [],
            thursday: [{ time: '13:00', classId: 'c1', duration: 60, notes: 'Period 5' }],
            friday: [{ time: '09:00', classId: 'c2', duration: 60, notes: 'Period 1' }],
        };
        commit('SET_REGULAR_SCHEDULE', placeholderData);
        console.log('Fetched placeholder regular schedule');

      } catch (error) {
        const message = error.response?.data?.message || error.message || 'Failed to fetch regular schedule';
        commit('SET_ERROR', message);
        console.error('Error fetching regular schedule:', message);
      } finally {
        commit('SET_LOADING', false);
      }
    },
     async fetchDailyExceptions({ commit }) {
      commit('SET_LOADING', true);
      commit('SET_ERROR', null);
      try {
        // const response = await ScheduleService.getExceptions(); // Replace with actual API call
        // commit('SET_DAILY_EXCEPTIONS', response.data);

         // Placeholder:
        await new Promise(resolve => setTimeout(resolve, 200)); // Simulate network delay
        const placeholderData = [
            { date: '2025-05-01', isDayOff: true, reason: 'Public Holiday' },
            { date: '2025-05-10', changes: [{ time: '10:15', action: 'cancel' }, { time: '14:00', classId: 'c3', duration: 45, notes: 'Special Assembly'}] }
        ];
        commit('SET_DAILY_EXCEPTIONS', placeholderData);
        console.log('Fetched placeholder daily exceptions');

      } catch (error) {
         const message = error.response?.data?.message || error.message || 'Failed to fetch daily exceptions';
        commit('SET_ERROR', message);
        console.error('Error fetching daily exceptions:', message);
      } finally {
        commit('SET_LOADING', false);
      }
    },
    // Add actions for updateRegularSchedule, saveException, deleteException
  },

  getters: {
    regularSchedule: state => state.regularSchedule,
    dailyExceptions: state => state.dailyExceptions,
    isLoading: state => state.isLoading,
    error: state => state.error,
    getScheduleForDay: (state) => (dayOfWeek) => { // dayOfWeek e.g., 'monday'
      return state.regularSchedule[dayOfWeek.toLowerCase()] || [];
    },
    getExceptionForDate: (state) => (dateString) => { // dateString e.g., 'YYYY-MM-DD'
      return state.dailyExceptions.find(e => e.date === dateString);
    }
  },
};

