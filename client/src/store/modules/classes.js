import ClassesService from '../../services/ClassesService'; // Use the actual service

export default {
  namespaced: true, // Important for module namespacing
  state: () => ({
    classes: [], // Array to hold class objects { id, classType, ..., color, textbooks? }
    isLoading: false, // Loading state for this module
    error: null, // Error state for this module
  }),
  mutations: {
    // Sets the entire list of classes, ensuring defaults and sorting
    SET_CLASSES(state, classes) {
      state.classes = classes.map(cls => ({
          ...cls,
          textbooks: cls.textbooks || [], // Ensure textbooks array exists
          color: cls.color || '#FFFFFF' // Default color if missing
      })).sort((a, b) => { // Sort logic matching backend order
            if (a.classType !== b.classType) return a.classType.localeCompare(b.classType); // numbered before special
            if (a.classType === 'numbered') {
                const yearCompare = String(a.yearLevel).localeCompare(String(b.yearLevel));
                if (yearCompare !== 0) return yearCompare;
                return String(a.classNumber).localeCompare(String(b.classNumber));
            } else { // special
                return String(a.className).localeCompare(String(b.className));
            }
        });
    },
    // Adds a single class, ensuring defaults and sorting
    ADD_CLASS(state, newClass) {
      const classToAdd = {
          ...newClass,
          textbooks: newClass.textbooks || [],
          color: newClass.color || '#FFFFFF' // Default color if missing
      };
      state.classes.push(classToAdd); // Add to end
      // Re-sort after adding
      state.classes.sort((a, b) => { // Sort logic matching backend order
            if (a.classType !== b.classType) return a.classType.localeCompare(b.classType);
            if (a.classType === 'numbered') {
                const yearCompare = String(a.yearLevel).localeCompare(String(b.yearLevel));
                if (yearCompare !== 0) return yearCompare;
                return String(a.classNumber).localeCompare(String(b.classNumber));
            } else { // special
                return String(a.className).localeCompare(String(b.className));
            }
        });
    },
    // Updates an existing class in the state array
    UPDATE_CLASS(state, updatedClass) {
        const index = state.classes.findIndex(cls => cls.id === updatedClass.id);
        if (index !== -1) {
            // Preserve existing linked textbooks if not part of the update payload
            const existingTextbooks = state.classes[index].textbooks;
            state.classes[index] = {
                ...state.classes[index], // Keep existing data like textbooks
                ...updatedClass,         // Apply updates from payload
                textbooks: updatedClass.textbooks || existingTextbooks || [], // Keep existing or use updated
                color: updatedClass.color || '#FFFFFF' // Ensure color default
            };
            // Re-sort after update to maintain order
            state.classes.sort((a, b) => {
                if (a.classType !== b.classType) return a.classType.localeCompare(b.classType);
                if (a.classType === 'numbered') {
                    const yearCompare = String(a.yearLevel).localeCompare(String(b.yearLevel));
                    if (yearCompare !== 0) return yearCompare;
                    return String(a.classNumber).localeCompare(String(b.classNumber));
                } else { return String(a.className).localeCompare(String(b.className)); }
            });
        } else {
             console.warn(`Could not find class with ID ${updatedClass.id} to update in state.`);
        }
    },
    // Removes a class from the state array
    REMOVE_CLASS(state, classId) {
        state.classes = state.classes.filter(cls => cls.id !== classId);
    },
    // Updates only the textbooks array for a specific class
    UPDATE_CLASS_TEXTBOOKS(state, { classId, textbooks }) {
        const index = state.classes.findIndex(cls => cls.id === classId);
        if (index !== -1) {
            state.classes[index] = { ...state.classes[index], textbooks: textbooks || [] };
        }
    },
    // Sets loading state
    SET_LOADING(state, isLoading) { state.isLoading = isLoading; },
    // Sets error state
    SET_ERROR(state, error) { state.error = error; state.isLoading = false; },
    // Resets state to initial values
    RESET_STATE(state) { state.classes = []; state.isLoading = false; state.error = null; }
  },
  actions: {
    // Fetches all classes for the user
    async fetchClasses({ commit, state }) {
       if (state.isLoading) return;
      commit('SET_LOADING', true);
      commit('SET_ERROR', null);
      try {
        const response = await ClassesService.getAll();
        commit('SET_CLASSES', response.data); // Mutation handles default color
        console.log('Fetched classes from API (with textbooks)');
      } catch (error) {
        const message = error.response?.data?.message || error.message || 'Failed to fetch classes';
        commit('SET_ERROR', message);
        console.error('Error fetching classes:', message);
      } finally {
         commit('SET_LOADING', false);
      }
    },
    // Adds a new class
    async addClass({ commit, dispatch }, classData) {
        commit('SET_ERROR', null);
        try {
            console.log("[addClass Action] Sending data:", classData);
            const response = await ClassesService.add(classData);
            commit('ADD_CLASS', response.data); // Mutation handles default color
            console.log('Added class via API:', response.data);
            dispatch('ui/showNotification', { type: 'success', message: 'Class added successfully!' }, { root: true });
            return response.data;
        } catch (error) {
             const message = error.response?.data?.message || error.message || 'Failed to add class';
             console.error('Error adding class:', message);
             dispatch('ui/showNotification', { type: 'error', message }, { root: true });
             throw new Error(message);
        }
    },

    // --- Action to update an existing class ---
    async updateClass({ commit, dispatch }, { id, data }) {
       // data should include { classType, classNumber?, yearLevel?, className?, color? }
       // Note: classType should match existing and not be changed here (backend enforces this)
       commit('SET_ERROR', null); // Clear previous errors
       try {
           console.log(`[updateClass Action] Updating class ID ${id} with data:`, data);
           // Call the service update method
           const response = await ClassesService.update(id, data);
           // Commit mutation with data returned from API
           commit('UPDATE_CLASS', response.data);
           // Show success notification
           dispatch('ui/showNotification', { type: 'success', message: 'Class updated successfully!' }, { root: true });
           return response.data; // Return updated data
       } catch (error) {
            // Handle errors during update
            const message = error.response?.data?.message || error.message || 'Failed to update class';
            console.error(`Error updating class ID ${id}:`, message);
            // Show error notification
            dispatch('ui/showNotification', { type: 'error', message }, { root: true });
            throw new Error(message); // Re-throw for component handling
       }
       // No SET_LOADING here as modal usually handles its own loading state
    },
    // --- End updateClass action ---

    // Deletes a class
    async deleteClass({ commit, dispatch }, classId) {
        commit('SET_ERROR', null);
        try {
            await ClassesService.delete(classId);
            commit('REMOVE_CLASS', classId);
            console.log(`Deleted class ID ${classId} via API`);
            dispatch('ui/showNotification', { type: 'success', message: 'Class deleted successfully.' }, { root: true });
        } catch (error) {
            const message = error.response?.data?.message || error.message || 'Failed to delete class';
            console.error(`Error deleting class ID ${classId}:`, message);
            dispatch('ui/showNotification', { type: 'error', message }, { root: true });
            throw new Error(message);
        }
    },
    // Links a textbook to a class
    async linkTextbook({ commit, dispatch }, { classId, textbookId }) {
        commit('SET_ERROR', null);
        try {
            const response = await ClassesService.linkTextbook(classId, textbookId);
            commit('UPDATE_CLASS_TEXTBOOKS', { classId: classId, textbooks: response.data.textbooks });
            console.log(`Linked textbook ${textbookId} to class ${classId}`);
            dispatch('ui/showNotification', { type: 'success', message: 'Textbook linked!' }, { root: true });
        } catch (error) {
            const message = error.response?.data?.message || error.message || 'Failed to link textbook.';
            console.error(`Error linking textbook ${textbookId} to class ${classId}:`, message);
            dispatch('ui/showNotification', { type: 'error', message }, { root: true });
            throw new Error(message);
        }
    },
    // Unlinks a textbook from a class
    async unlinkTextbook({ commit, dispatch, rootState }, { classId, textbookId }) {
         commit('SET_ERROR', null);
         try {
            await ClassesService.unlinkTextbook(classId, textbookId);
            // Find the class in the current state to update its textbook list locally
            const currentClass = rootState.classes.classes.find(c => c.id === classId);
            if (currentClass) {
                const updatedTextbooks = currentClass.textbooks.filter(tb => tb.id !== textbookId);
                 commit('UPDATE_CLASS_TEXTBOOKS', { classId: classId, textbooks: updatedTextbooks });
            } else {
                console.warn("Could not find class locally to update after unlinking textbook.");
            }
            console.log(`Unlinked textbook ${textbookId} from class ${classId}`);
            dispatch('ui/showNotification', { type: 'success', message: 'Textbook unlinked.' }, { root: true });
        } catch (error) {
             const message = error.response?.data?.message || error.message || 'Failed to unlink textbook.';
            console.error(`Error unlinking textbook ${textbookId} from class ${classId}:`, message);
            dispatch('ui/showNotification', { type: 'error', message }, { root: true });
            throw new Error(message);
        }
    }
  },
  getters: {
    allClasses: state => state.classes,
    isLoading: state => state.isLoading,
    error: state => state.error,
    getClassById: (state) => (id) => {
        // Ensure comparison works even if IDs are numbers vs strings
        const classId = typeof id === 'string' ? parseInt(id, 10) : id;
        return state.classes.find(c => c.id === classId);
    }
  },
};

