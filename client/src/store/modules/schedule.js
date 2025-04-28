// Import the actual service
import ScheduleService from '../../services/ScheduleService';

// --- Add Log 1 ---
console.log("--- Executing schedule.js store module ---");

export default {
  namespaced: true,

  state: () => ({
    regularSchedule: {}, // Initialize as empty object
    dailyExceptions: [],
    isLoading: false,
    error: null,
  }),

  mutations: {
    SET_REGULAR_SCHEDULE(state, schedule) {
      // Ensure structure is correct when setting
      const formattedSchedule = {};
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
      const periods = 6;

      days.forEach(day => {
          formattedSchedule[day] = Array(periods).fill(null);
          // Use the schedule passed to the mutation (could be empty object {} or null)
          const scheduleForDay = schedule ? schedule[day] : null;
          if (scheduleForDay && Array.isArray(scheduleForDay)) {
              for (let i = 0; i < Math.min(scheduleForDay.length, periods); i++) {
                  formattedSchedule[day][i] = scheduleForDay[i];
              }
          }
      });
      state.regularSchedule = formattedSchedule;
      console.log("[Mutation SET_REGULAR_SCHEDULE] State updated:", JSON.parse(JSON.stringify(state.regularSchedule)));
    },
    // Other mutations...
    SET_DAILY_EXCEPTIONS(state, exceptions) { state.dailyExceptions = exceptions; },
    ADD_EXCEPTION(state, exception) { /* ... */ },
    UPDATE_EXCEPTION(state, updatedException) { /* ... */ },
    REMOVE_EXCEPTION(state, exceptionDate) { /* ... */ },
    SET_LOADING(state, isLoading) { state.isLoading = isLoading; },
    SET_ERROR(state, error) { state.error = error; state.isLoading = false; },
     RESET_STATE(state) { /* ... */ }
  },

  actions: { // <-- Check this object

    async fetchRegularSchedule({ commit, state }) {
      // Avoid refetch if already loading
      if (state.isLoading) {
          console.log("[Action fetchRegularSchedule] Already loading, skipping fetch.");
          return;
      }
      // Optionally avoid refetch if data already exists (can be useful)
      // if (Object.keys(state.regularSchedule).length > 0) {
      //     console.log("[Action fetchRegularSchedule] Data exists, skipping fetch.");
      //     return;
      // }

      commit('SET_LOADING', true);
      commit('SET_ERROR', null);
      try {
        // --- Use the actual API Service ---
        console.log("[Action fetchRegularSchedule] Calling ScheduleService.getRegular...");
        const response = await ScheduleService.getRegular();
        // The backend returns the schedule object or {} if none exists
        // Pass the received data (or an empty object) to the mutation
        commit('SET_REGULAR_SCHEDULE', response.data || {});
        console.log('[Action fetchRegularSchedule] Successfully fetched schedule from API:', response.data);
        // --- End API Call ---

      } catch (error) {
        const message = error.response?.data?.message || error.message || 'Failed to fetch regular schedule';
        commit('SET_ERROR', message);
        console.error('Error fetching regular schedule:', message);
        // Also set schedule to empty on error to avoid showing stale data
        commit('SET_REGULAR_SCHEDULE', {});
      } finally {
        commit('SET_LOADING', false);
      }
    },
     async fetchDailyExceptions({ commit }) {
        // Placeholder fetch
       commit('SET_LOADING', true);
       commit('SET_ERROR', null);
       try {
           await new Promise(resolve => setTimeout(resolve, 200));
           const placeholderData = [ /* ... placeholder data ... */ ];
           commit('SET_DAILY_EXCEPTIONS', placeholderData);
           console.log('Fetched placeholder daily exceptions');
       } catch (error) { /* ... error handling ... */ }
       finally { commit('SET_LOADING', false); }
     },

     // --- Action to save the updated schedule ---
     async updateRegularSchedule({ commit, dispatch }, newScheduleData) {
         console.log("[Action schedule/updateRegularSchedule] Action started.");
         commit('SET_LOADING', true);
         commit('SET_ERROR', null);
         try {
             const response = await ScheduleService.updateRegular(newScheduleData);
             commit('SET_REGULAR_SCHEDULE', response.data);
             console.log("Updated regular schedule via API");
             dispatch('ui/showNotification', { type: 'success', message: 'Schedule updated successfully!' }, { root: true });
             return response.data; // Return data
         } catch(error) {
            const message = error.response?.data?.message || error.message || 'Failed to update schedule';
            commit('SET_ERROR', message);
            console.error('Error updating regular schedule:', message);
            dispatch('ui/showNotification', { type: 'error', message }, { root: true });
            throw new Error(message);
         } finally {
             commit('SET_LOADING', false);
         }
     }
    // Add actions for saveException, deleteException later
  },

  getters: {
    // Getters remain the same...
    regularSchedule: state => state.regularSchedule,
    dailyExceptions: state => state.dailyExceptions,
    isLoading: state => state.isLoading,
    error: state => state.error,
    getScheduleForDay: (state) => (dayOfWeek) => { /* ... */ },
    getExceptionForDate: (state) => (dateString) => { /* ... */ }
  },
};

