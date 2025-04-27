import ClassesService from '../../services/ClassesService'; // Use the actual service

export default {
  namespaced: true,

  state: () => ({
    classes: [], // Will now contain class objects, potentially with a 'textbooks' array
    isLoading: false,
    error: null,
  }),

  mutations: {
    SET_CLASSES(state, classes) {
      // Ensure textbooks array exists, even if empty
      state.classes = classes.map(cls => ({
          ...cls,
          textbooks: cls.textbooks || []
      }));
    },
    ADD_CLASS(state, newClass) {
      // Ensure textbooks array exists
      const classToAdd = { ...newClass, textbooks: newClass.textbooks || [] };
      state.classes.unshift(classToAdd);
    },
    // --- Add REMOVE_CLASS mutation ---
    REMOVE_CLASS(state, classId) {
        // Filter out the deleted class from the state array
        state.classes = state.classes.filter(cls => cls.id !== classId);
    },
    // Mutation to update a single class (e.g., after linking/unlinking)
    UPDATE_CLASS_TEXTBOOKS(state, { classId, textbooks }) {
        const index = state.classes.findIndex(cls => cls.id === classId);
        if (index !== -1) {
            // Create a new object to ensure reactivity
            state.classes[index] = {
                ...state.classes[index],
                textbooks: textbooks || [] // Update the textbooks array
            };
        }
    },
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
       if (state.isLoading) return;
      commit('SET_LOADING', true);
      commit('SET_ERROR', null); // Clear previous errors
      try {
        const response = await ClassesService.getAll();
        commit('SET_CLASSES', response.data); // Assuming API returns an array of classes
        console.log('Fetched classes from API (with textbooks)');
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
    },

    // --- Add deleteClass action ---
    async deleteClass({ commit, dispatch }, classId) {
        commit('SET_ERROR', null); // Clear previous errors related to fetching/adding
        try {
            await ClassesService.delete(classId); // Call the API service
            commit('REMOVE_CLASS', classId); // Remove the class from the local state
            console.log(`Deleted class ID ${classId} via API`);
            // Optionally dispatch success notification
            // dispatch('ui/showNotification', { type: 'success', message: 'Class deleted successfully!' }, { root: true });
        } catch (error) {
            const message = error.response?.data?.message || error.message || 'Failed to delete class';
            console.error(`Error deleting class ID ${classId}:`, message);
            // Optionally dispatch UI notification
            // dispatch('ui/showNotification', { type: 'error', message }, { root: true });
            // Re-throw error for component handling
            throw new Error(message);
        }
    },

    // --- Actions for Linking/Unlinking ---
    async linkTextbook({ commit, dispatch }, { classId, textbookId }) {
        commit('SET_ERROR', null); // Clear general errors
        try {
            // Call the API, which returns the updated class with its textbooks
            const response = await ClassesService.linkTextbook(classId, textbookId);
            // Update the specific class in the state with the new textbook list
            commit('UPDATE_CLASS_TEXTBOOKS', { classId: classId, textbooks: response.data.textbooks });
            console.log(`Linked textbook ${textbookId} to class ${classId}`);
            // Optionally show success notification
            // dispatch('ui/showNotification', { type: 'success', message: 'Textbook linked!' }, { root: true });
        } catch (error) {
            const message = error.response?.data?.message || error.message || 'Failed to link textbook.';
            console.error(`Error linking textbook ${textbookId} to class ${classId}:`, message);
             // Optionally show error notification
            // dispatch('ui/showNotification', { type: 'error', message }, { root: true });
            throw new Error(message); // Re-throw for component handling
        }
    },

    async unlinkTextbook({ commit, dispatch, rootState }, { classId, textbookId }) {
         commit('SET_ERROR', null);
         try {
            await ClassesService.unlinkTextbook(classId, textbookId);
            // To update the state, we need to refetch the class or manually remove the textbook
            // Manual removal is more efficient if the API doesn't return the updated list
            // Access state correctly within the action
            const currentClass = rootState.classes.classes.find(c => c.id === classId);
            if (currentClass) {
                const updatedTextbooks = currentClass.textbooks.filter(tb => tb.id !== textbookId);
                 commit('UPDATE_CLASS_TEXTBOOKS', { classId: classId, textbooks: updatedTextbooks });
            } else {
                // If class not found locally, maybe refetch? Less ideal.
                console.warn("Could not find class locally to update after unlinking textbook.");
            }

            console.log(`Unlinked textbook ${textbookId} from class ${classId}`);
             // Optionally show success notification
            // dispatch('ui/showNotification', { type: 'success', message: 'Textbook unlinked.' }, { root: true });
        } catch (error) {
             const message = error.response?.data?.message || error.message || 'Failed to unlink textbook.';
            console.error(`Error unlinking textbook ${textbookId} from class ${classId}:`, message);
             // Optionally show error notification
            // dispatch('ui/showNotification', { type: 'error', message }, { root: true });
            throw new Error(message);
        }
    }
    // Add actions for updateClass later
  },

  getters: {
    allClasses: state => state.classes,
    isLoading: state => state.isLoading,
    error: state => state.error,
    // Getter to find a specific class by ID
    getClassById: (state) => (id) => {
        // Ensure IDs are compared correctly (e.g., both as numbers or strings)
        const classId = typeof id === 'string' ? parseInt(id, 10) : id;
        return state.classes.find(c => c.id === classId);
    }
  },
};

