// client/src/store/modules/classes.js
import ClassesService from '../../services/ClassesService'; // Use the actual service

export default {
  namespaced: true,

  state: () => ({
    classes: [],
    isLoading: false,
    error: null,
  }),

  mutations: {
    SET_CLASSES(state, classes) {
      state.classes = classes;
    },
    ADD_CLASS(state, newClass) {
      // Add to the beginning or end, and potentially sort
      state.classes.unshift(newClass);
    },
    // UPDATE_CLASS(state, updatedClass) { ... } // Implement later
    // REMOVE_CLASS(state, classId) { ... } // Implement later
    SET_LOADING(state, isLoading) {
      state.isLoading = isLoading;
    },
    SET_ERROR(state, error) {
      state.error = error;
       state.isLoading = false; // Ensure loading is false on error
    },
     RESET_STATE(state) {
      state.classes = [];
      state.isLoading = false;
      state.error = null;
    }
  },

  actions: {
    async fetchClasses({ commit, state }) {
       // Avoid fetching if already loading
       if (state.isLoading) return;

      commit('SET_LOADING', true);
      commit('SET_ERROR', null); // Clear previous errors
      try {
        const response = await ClassesService.getAll();
        commit('SET_CLASSES', response.data); // Assuming API returns an array of classes
        console.log('Fetched classes from API');
      } catch (error) {
        const message = error.response?.data?.message || error.message || 'Failed to fetch classes';
        commit('SET_ERROR', message);
        console.error('Error fetching classes:', message);
         // Optionally dispatch UI notification
        // dispatch('ui/showNotification', { type: 'error', message }, { root: true });
      } finally {
        // Ensure loading is set to false even if commit('SET_ERROR') was called
         commit('SET_LOADING', false);
      }
    },

    async addClass({ commit, dispatch }, classData) {
        // No need for explicit loading state here usually, handled globally or via component
        commit('SET_ERROR', null); // Clear previous errors
        try {
            const response = await ClassesService.add(classData);
            commit('ADD_CLASS', response.data); // Add the newly created class (returned by API) to state
            console.log('Added class via API:', response.data);
             // Optionally dispatch success notification
            // dispatch('ui/showNotification', { type: 'success', message: 'Class added successfully!' }, { root: true });
            return response.data; // Return the new class data
        } catch (error) {
             const message = error.response?.data?.message || error.message || 'Failed to add class';
             // Don't use SET_ERROR here as it might clear list on unrelated error
             console.error('Error adding class:', message);
              // Optionally dispatch UI notification
             // dispatch('ui/showNotification', { type: 'error', message }, { root: true });
             throw new Error(message); // Re-throw for component handling
        }
    }
    // Add actions for updateClass, deleteClass later
  },

  getters: {
    allClasses: state => state.classes,
    isLoading: state => state.isLoading,
    error: state => state.error,
    // getClassById: (state) => (id) => { ... } // Implement later
  },
};

