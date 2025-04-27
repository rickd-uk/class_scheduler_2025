// Import the actual service
import ScheduleService from '../../services/ScheduleService';

export default {
  namespaced: true,

  state: () => ({
    regularSchedule: {}, // e.g., { monday: [{classId: 'c1'}, null, ...], tuesday: [...], ... }
    dailyExceptions: [], // Array of exceptions { date: 'YYYY-MM-DD', changes: [...] }
    isLoading: false, // Loading state specific to schedule data
    error: null, // Error state specific to schedule data
  }),

  mutations: {
    SET_REGULAR_SCHEDULE(state, schedule) {
      // Ensure structure is correct when setting
      const formattedSchedule = {};
      // Define expected days and periods
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
      const periods = 6; // Assuming 6 periods per day

      days.forEach(day => {
          // Initialize day with an array of nulls
          formattedSchedule[day] = Array(periods).fill(null);
          // If data exists for the day, populate the array
          if (schedule && schedule[day] && Array.isArray(schedule[day])) {
              for (let i = 0; i < Math.min(schedule[day].length, periods); i++) {
                  // Assign the item (which could be {classId: id} or null)
                  formattedSchedule[day][i] = schedule[day][i];
              }
          }
      });
      state.regularSchedule = formattedSchedule;
    },
    SET_DAILY_EXCEPTIONS(state, exceptions) {
      state.dailyExceptions = exceptions;
    },
    ADD_EXCEPTION(state, exception) {
        // Add or update exception for a specific date
        const index = state.dailyExceptions.findIndex(ex => ex.date === exception.date);
        if (index !== -1) {
            state.dailyExceptions.splice(index, 1, exception); // Replace existing
        } else {
            state.dailyExceptions.push(exception); // Add new
            // Optional: sort exceptions by date
            state.dailyExceptions.sort((a, b) => a.date.localeCompare(b.date));
        }
    },
    UPDATE_EXCEPTION(state, updatedException) {
        // Similar to ADD_EXCEPTION, find and replace
        const index = state.dailyExceptions.findIndex(ex => ex.date === updatedException.date);
        if (index !== -1) {
            state.dailyExceptions.splice(index, 1, updatedException);
        }
    },
    REMOVE_EXCEPTION(state, exceptionDate) {
        // Filter out the exception for the given date
        state.dailyExceptions = state.dailyExceptions.filter(ex => ex.date !== exceptionDate);
    },
    SET_LOADING(state, isLoading) {
      state.isLoading = isLoading;
    },
    SET_ERROR(state, error) {
      state.error = error;
      state.isLoading = false; // Ensure loading is false on error
    },
     RESET_STATE(state) {
      // Reset schedule-specific state
      state.regularSchedule = {};
      state.dailyExceptions = [];
      state.isLoading = false;
      state.error = null;
    }
  },

  actions: {
    async fetchRegularSchedule({ commit, state }) {
      // Avoid refetch if already loaded unless forced
      if (Object.keys(state.regularSchedule).length > 0 && !state.isLoading) {
          // return; // Or add a force flag parameter
      }
      commit('SET_LOADING', true);
      commit('SET_ERROR', null);
      try {
        // TODO: Replace placeholder with actual API call using ScheduleService.getRegular()
        // const response = await ScheduleService.getRegular();
        // commit('SET_REGULAR_SCHEDULE', response.data);

         // Placeholder:
        await new Promise(resolve => setTimeout(resolve, 400));
        const placeholderData = {
            monday: [{ classId: '1' }, null, { classId: '2' }, null, null, null ], // Use example IDs
            tuesday: [ null, { classId: '3' }, null, null, { classId: '1' }, null ],
            wednesday: Array(6).fill(null),
            thursday: [null, null, null, { classId: '1' }, { classId: '2' }, null ],
            friday: [{ classId: '2' }, null, null, null, null, null ],
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
            // TODO: Replace with actual API call: const response = await ScheduleService.getExceptions();
            await new Promise(resolve => setTimeout(resolve, 200)); // Simulate network delay
            const placeholderData = [
                { date: '2025-05-01', isDayOff: true, reason: 'Public Holiday' },
                { date: '2025-05-10', changes: [{ time: '10:15', action: 'cancel' }, { time: '14:00', classId: '3', duration: 45, notes: 'Special Assembly'}] }
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

     // --- Action to save the updated schedule ---
     async updateRegularSchedule({ commit, dispatch }, newScheduleData) {
         commit('SET_LOADING', true); // Indicate loading/saving
         commit('SET_ERROR', null);
         try {
             // --- Use the actual API Service ---
             const response = await ScheduleService.updateRegular(newScheduleData);
             commit('SET_REGULAR_SCHEDULE', response.data); // Update state with the schedule returned by API
             console.log("Updated regular schedule via API");
             // --- End API Call ---

             // Optionally show success notification
             dispatch('ui/showNotification', { type: 'success', message: 'Schedule updated successfully!' }, { root: true });

         } catch(error) {
            const message = error.response?.data?.message || error.message || 'Failed to update schedule';
            commit('SET_ERROR', message);
            console.error('Error updating regular schedule:', message);
             // Optionally show error notification
            dispatch('ui/showNotification', { type: 'error', message }, { root: true });
            throw new Error(message); // Re-throw for component handling
         } finally {
             commit('SET_LOADING', false);
         }
     }
    // Add actions for saveException, deleteException later
  },

  getters: {
    regularSchedule: state => state.regularSchedule,
    dailyExceptions: state => state.dailyExceptions,
    isLoading: state => state.isLoading,
    error: state => state.error,
    // Get schedule for a specific day, ensuring 6 periods
    getScheduleForDay: (state) => (dayOfWeek) => {
      const day = dayOfWeek.toLowerCase();
      const schedule = state.regularSchedule[day] || [];
      // Ensure it has 6 elements, padding with null if necessary
      return [...schedule, ...Array(Math.max(0, 6 - schedule.length)).fill(null)].slice(0, 6);
    },
    // Get exception data for a specific date
    getExceptionForDate: (state) => (dateString) => {
        return state.dailyExceptions.find(e => e.date === dateString);
    }
  },
};

