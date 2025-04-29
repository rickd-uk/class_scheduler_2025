import ClassesService from '../../services/ClassesService'; // Use the actual service

export default {
  namespaced: true,
  state: () => ({
    classes: [], // Will now contain class objects {..., color: '#RRGGBB'}
    isLoading: false,
    error: null,
  }),
  mutations: {
    SET_CLASSES(state, classes) {
      // Ensure color exists with a default, then sort
      state.classes = classes.map(cls => ({
          ...cls,
          textbooks: cls.textbooks || [],
          color: cls.color || '#FFFFFF' // Default to white if color is missing
      })).sort((a, b) => { // Sort logic matching backend
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
    ADD_CLASS(state, newClass) {
      // Ensure color exists with a default when adding
      const classToAdd = {
          ...newClass,
          textbooks: newClass.textbooks || [],
          color: newClass.color || '#FFFFFF' // Default to white if color is missing
      };
      state.classes.push(classToAdd); // Add to end
      // Re-sort after adding
      state.classes.sort((a, b) => { // Sort logic matching backend
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
    // --- Add UPDATE_CLASS mutation ---
    UPDATE_CLASS(state, updatedClass) {
        const index = state.classes.findIndex(cls => cls.id === updatedClass.id);
        if (index !== -1) {
            // Ensure existing textbooks array is preserved if not part of update
            // and ensure color has a default if missing in update data
            state.classes[index] = {
                ...state.classes[index], // Keep existing data like textbooks
                ...updatedClass,         // Apply updates from payload
                color: updatedClass.color || '#FFFFFF' // Ensure color default
            };
            // Re-sort might be needed if ordering depends on updated fields
            state.classes.sort((a, b) => { /* ... sort logic ... */ });
        } else {
             console.warn(`Could not find class with ID ${updatedClass.id} to update in state.`);
        }
    },
    REMOVE_CLASS(state, classId) {
        state.classes = state.classes.filter(cls => cls.id !== classId);
    },
    UPDATE_CLASS_TEXTBOOKS(state, { classId, textbooks }) {
        const index = state.classes.findIndex(cls => cls.id === classId);
        if (index !== -1) {
            state.classes[index] = { ...state.classes[index], textbooks: textbooks || [] };
        }
    },
    SET_LOADING(state, isLoading) { state.isLoading = isLoading; },
    SET_ERROR(state, error) { state.error = error; state.isLoading = false; },
    RESET_STATE(state) { state.classes = []; state.isLoading = false; state.error = null; }
  },
  actions: {
    async fetchClasses({ commit, state }) {
       if (state.isLoading) return;
      commit('SET_LOADING', true);
      commit('SET_ERROR', null);
      try {
        const response = await ClassesService.getAll();
        commit('SET_CLASSES', response.data); // SET_CLASSES mutation now handles default color
        console.log('Fetched classes from API (with textbooks)');
      } catch (error) {
        const message = error.response?.data?.message || error.message || 'Failed to fetch classes';
        commit('SET_ERROR', message);
        console.error('Error fetching classes:', message);
      } finally {
         commit('SET_LOADING', false);
      }
    },
    // addClass action already sends classData which now includes color from component
    async addClass({ commit, dispatch }, classData) {
        commit('SET_ERROR', null);
        try {
            console.log("[addClass Action] Sending data:", classData); // Log data being sent
            const response = await ClassesService.add(classData);
            commit('ADD_CLASS', response.data); // ADD_CLASS mutation now handles default color
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
    // --- TODO: Add updateClass action ---
    // async updateClass({ commit, dispatch }, { id, data }) {
    //    // data should include { classType, classNumber?, yearLevel?, className?, color? }
    //    commit('SET_ERROR', null);
    //    try {
    //        // Call ClassesService.update(id, data) - Requires PUT /api/classes/:id route
    //        // const response = await ClassesService.update(id, data);
    //        // commit('UPDATE_CLASS', response.data);
    //        // dispatch('ui/showNotification', { type: 'success', message: 'Class updated!' }, { root: true });
    //        // return response.data;
    //        console.warn("updateClass action not fully implemented yet.");
    //        throw new Error("Update class not implemented."); // Placeholder
    //    } catch (error) {
    //         const message = error.response?.data?.message || error.message || 'Failed to update class';
    //         console.error(`Error updating class ID ${id}:`, message);
    //         dispatch('ui/showNotification', { type: 'error', message }, { root: true });
    //         throw new Error(message);
    //    }
    // },
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
    async unlinkTextbook({ commit, dispatch, rootState }, { classId, textbookId }) {
         commit('SET_ERROR', null);
         try {
            await ClassesService.unlinkTextbook(classId, textbookId);
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
        const classId = typeof id === 'string' ? parseInt(id, 10) : id;
        return state.classes.find(c => c.id === classId);
    }
  },
};
