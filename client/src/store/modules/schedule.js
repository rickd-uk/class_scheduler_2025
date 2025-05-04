// Import the actual services
import ScheduleService from '../../services/ScheduleService';
import AppliedExceptionsService from '../../services/AppliedExceptionsService'; // <-- Import AppliedExceptionsService

// --- Add Log 1 ---
console.log("--- Executing schedule.js store module ---");

export default {
  namespaced: true,

  state: () => ({
    regularSchedule: {}, // Object: { monday: [{classId: id}, null], ... }
    // This state property will hold applied exceptions fetched from the backend
    dailyExceptions: [], // Array: [{ id, userId, date, exceptionPatternId?, isDayOff, reason?, color?, ExceptionPattern? }]
    isLoading: false, // Loading state specific to this module
    error: null, // Error state specific to this module
  }),

  mutations: {
    SET_REGULAR_SCHEDULE(state, schedule) {
      // Ensure structure is correct when setting
      const formattedSchedule = {};
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
      const periods = 6; // Assuming 6 periods per day

      days.forEach(day => {
          // Initialize day with an array of nulls
          formattedSchedule[day] = Array(periods).fill(null);
          // Use the schedule passed to the mutation (could be empty object {} or null)
          const scheduleForDay = schedule ? schedule[day] : null;
          if (scheduleForDay && Array.isArray(scheduleForDay)) {
              for (let i = 0; i < Math.min(scheduleForDay.length, periods); i++) {
                  // Assign the item (which could be {classId: id} or null)
                  formattedSchedule[day][i] = scheduleForDay[i];
              }
          }
      });
      state.regularSchedule = formattedSchedule;
      console.log("[Mutation SET_REGULAR_SCHEDULE] State updated:", JSON.parse(JSON.stringify(state.regularSchedule)));
    },
    // Renamed from SET_DAILY_EXCEPTIONS to SET_APPLIED_EXCEPTIONS for clarity
    SET_APPLIED_EXCEPTIONS(state, exceptions) {
      state.dailyExceptions = exceptions.sort((a, b) => a.date.localeCompare(b.date)); // Keep sorted
      console.log("[Mutation SET_APPLIED_EXCEPTIONS] State updated:", JSON.parse(JSON.stringify(state.dailyExceptions)));
    },
    // Mutation to add or update a single applied exception in the state
    SET_APPLIED_EXCEPTION(state, appliedException) {
        const index = state.dailyExceptions.findIndex(ex => ex.date === appliedException.date);
        if (index !== -1) {
            // Replace existing entry
            state.dailyExceptions.splice(index, 1, appliedException);
        } else {
            // Add new entry and re-sort
            state.dailyExceptions.push(appliedException);
            state.dailyExceptions.sort((a, b) => a.date.localeCompare(b.date));
        }
         console.log("[Mutation SET_APPLIED_EXCEPTION] State updated:", JSON.parse(JSON.stringify(state.dailyExceptions)));
    },
    // Mutation to remove an applied exception for a specific date
    CLEAR_APPLIED_EXCEPTION(state, date) {
         state.dailyExceptions = state.dailyExceptions.filter(ex => ex.date !== date);
         console.log(`[Mutation CLEAR_APPLIED_EXCEPTION] Exception for ${date} removed. State:`, JSON.parse(JSON.stringify(state.dailyExceptions)));
    },
    // Removed ADD_EXCEPTION, UPDATE_EXCEPTION, REMOVE_EXCEPTION as they are replaced by SET_APPLIED_EXCEPTION and CLEAR_APPLIED_EXCEPTION

    SET_LOADING(state, isLoading) { state.isLoading = isLoading; },
    SET_ERROR(state, error) { state.error = error; state.isLoading = false; },
    RESET_STATE(state) {
        state.regularSchedule = {};
        state.dailyExceptions = [];
        state.isLoading = false;
        state.error = null;
     }
  },

  actions: { // <-- Check this object
    // --- Removed the invalid _logDefinition ---

    async fetchRegularSchedule({ commit, state }) {
      // Avoid refetch if already loading
      if (state.isLoading) {
          console.log("[Action fetchRegularSchedule] Already loading, skipping fetch.");
          return;
      }
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
    // --- Renamed and updated action ---
     async fetchAppliedExceptions({ commit, state }) {
         // Prevent multiple concurrent fetches
         if (state.isLoading) return;
         commit('SET_LOADING', true);
         commit('SET_ERROR', null);
         try {
            console.log("[Action fetchAppliedExceptions] Calling AppliedExceptionsService.getAll...");
            // --- Use the actual API Service ---
            // TODO: Ensure AppliedExceptionsService.getAll() exists and works
            const response = await AppliedExceptionsService.getAll(); // Call the service
            commit('SET_APPLIED_EXCEPTIONS', response.data); // Use the correct mutation
            console.log('[Action fetchAppliedExceptions] Successfully fetched exceptions:', response.data);
            // --- End API Call ---
         } catch (error) {
             const message = error.response?.data?.message || error.message || 'Failed to fetch applied exceptions';
            commit('SET_ERROR', message);
            console.error('Error fetching applied exceptions:', message);
            commit('SET_APPLIED_EXCEPTIONS', []); // Clear exceptions on error
         } finally {
             commit('SET_LOADING', false);
         }
     },
     // --- End Renamed Action ---

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
     },

     // --- Action to apply/update an exception for a date ---
     async applyException({ commit, dispatch }, exceptionData) {
         // exceptionData: { date, isDayOff, exceptionPatternId, reason, color }
         // No need for SET_LOADING here as modal handles its own loading state
         commit('SET_ERROR', null); // Clear specific errors for this action
         try {
             console.log("[Action applyException] Dispatching applyException:", exceptionData);
             // Call the service to POST the data (backend handles create/update)
             const response = await AppliedExceptionsService.apply(exceptionData);
             // Update the local state with the result from the backend
             // Backend should return the full AppliedException object, potentially including the joined ExceptionPattern data
             commit('SET_APPLIED_EXCEPTION', response.data);
             dispatch('ui/showNotification', { type: 'success', message: 'Exception applied successfully!' }, { root: true });
             return response.data;
         } catch (error) {
             const message = error.response?.data?.message || error.message || 'Failed to apply exception';
             console.error('Error applying exception:', message);
             dispatch('ui/showNotification', { type: 'error', message }, { root: true });
             throw new Error(message); // Re-throw for component handling
         }
     },

     // --- Action to clear an applied exception for a date ---
      async clearAppliedException({ commit, dispatch }, date) {
         commit('SET_ERROR', null);
         try {
             console.log("[Action clearAppliedException] Dispatching clearAppliedException for date:", date);
             await AppliedExceptionsService.clear(date); // Call DELETE endpoint
             commit('CLEAR_APPLIED_EXCEPTION', date); // Remove from local state
             dispatch('ui/showNotification', { type: 'success', message: 'Exception cleared successfully.' }, { root: true });
         } catch (error) {
             const message = error.response?.data?.message || error.message || 'Failed to clear exception';
             console.error('Error clearing exception:', message);
             dispatch('ui/showNotification', { type: 'error', message }, { root: true });
             throw new Error(message);
         }
     }
    // Add actions for saveException, deleteException later (old names)
  },

  getters: {
    regularSchedule: state => state.regularSchedule,
    // Rename getter to match state/action
    appliedExceptions: state => state.dailyExceptions, // Keep state name dailyExceptions for now
    isLoading: state => state.isLoading,
    error: state => state.error,
    getScheduleForDay: (state) => (dayOfWeek) => {
        const day = dayOfWeek.toLowerCase();
        const schedule = state.regularSchedule[day] || [];
        return [...schedule, ...Array(Math.max(0, 6 - schedule.length)).fill(null)].slice(0, 6);
     },
    // Rename getter to match state/action
    getAppliedExceptionForDate: (state) => (dateString) => {
        // Use dailyExceptions state name here
        return state.dailyExceptions.find(e => e.date === dateString);
    }
  },
};

