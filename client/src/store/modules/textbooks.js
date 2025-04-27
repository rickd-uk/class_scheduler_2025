// client/src/store/modules/textbooks.js
import TextbooksService from '../../services/TextbooksService'; // Use the actual service

export default {
  namespaced: true,

  state: () => ({
    textbooks: [],
    isLoading: false,
    error: null,
  }),

  mutations: {
    SET_TEXTBOOKS(state, textbooks) {
      state.textbooks = textbooks;
    },
    ADD_TEXTBOOK(state, newTextbook) {
      state.textbooks.unshift(newTextbook); // Add to beginning
    },
    UPDATE_TEXTBOOK(state, updatedTextbook) {
        // Find the index of the textbook to update
        const index = state.textbooks.findIndex(book => book.id === updatedTextbook.id);
        if (index !== -1) {
            // Replace the old item with the updated one
            state.textbooks.splice(index, 1, updatedTextbook);
        }
    },
    REMOVE_TEXTBOOK(state, textbookId) {
        // Filter out the deleted textbook
        state.textbooks = state.textbooks.filter(book => book.id !== textbookId);
    },
    SET_LOADING(state, isLoading) {
      state.isLoading = isLoading;
    },
    SET_ERROR(state, error) {
      state.error = error;
      state.isLoading = false; // Ensure loading is false on error
    },
     RESET_STATE(state) {
      state.textbooks = [];
      state.isLoading = false;
      state.error = null;
    }
  },

  actions: {
    async fetchTextbooks({ commit, state }) {
       if (state.isLoading) return;
      commit('SET_LOADING', true);
      commit('SET_ERROR', null);
      try {
        const response = await TextbooksService.getAll();
        commit('SET_TEXTBOOKS', response.data);
        console.log('Fetched textbooks from API');
      } catch (error) {
         const message = error.response?.data?.message || error.message || 'Failed to fetch textbooks';
        commit('SET_ERROR', message);
        console.error('Error fetching textbooks:', message);
      } finally {
         commit('SET_LOADING', false);
      }
    },

     async addTextbook({ commit, dispatch }, textbookData) {
        commit('SET_ERROR', null);
        try {
            const response = await TextbooksService.add(textbookData);
            commit('ADD_TEXTBOOK', response.data);
            console.log('Added textbook via API:', response.data);
             // Optionally dispatch success notification
            // dispatch('ui/showNotification', { type: 'success', message: 'Textbook added successfully!' }, { root: true });
            return response.data;
        } catch (error) {
             const message = error.response?.data?.message || error.message || 'Failed to add textbook';
             console.error('Error adding textbook:', message);
             // Optionally dispatch UI notification
             // dispatch('ui/showNotification', { type: 'error', message }, { root: true });
             throw new Error(message);
        }
    },

    async updateTextbook({ commit, dispatch }, { id, data }) {
        commit('SET_ERROR', null);
        try {
            const response = await TextbooksService.update(id, data);
            commit('UPDATE_TEXTBOOK', response.data); // Update local state with returned data
            console.log(`Updated textbook ID ${id} via API:`, response.data);
            // Optionally dispatch success notification
            // dispatch('ui/showNotification', { type: 'success', message: 'Textbook updated successfully!' }, { root: true });
            return response.data;
        } catch (error) {
            const message = error.response?.data?.message || error.message || 'Failed to update textbook';
            console.error(`Error updating textbook ID ${id}:`, message);
            // Optionally dispatch UI notification
            // dispatch('ui/showNotification', { type: 'error', message }, { root: true });
            throw new Error(message);
        }
    },

    async deleteTextbook({ commit, dispatch }, textbookId) {
        commit('SET_ERROR', null);
        try {
            await TextbooksService.delete(textbookId);
            commit('REMOVE_TEXTBOOK', textbookId); // Remove from local state
            console.log(`Deleted textbook ID ${textbookId} via API`);
            // Optionally dispatch success notification
            // dispatch('ui/showNotification', { type: 'success', message: 'Textbook deleted successfully!' }, { root: true });
        } catch (error) {
            const message = error.response?.data?.message || error.message || 'Failed to delete textbook';
            console.error(`Error deleting textbook ID ${textbookId}:`, message);
            // Optionally dispatch UI notification
            // dispatch('ui/showNotification', { type: 'error', message }, { root: true });
            throw new Error(message);
        }
    }
    // Add actions for link/unlink later
  },

  getters: {
    allTextbooks: state => state.textbooks,
    isLoading: state => state.isLoading,
    error: state => state.error,
     getTextbookById: (state) => (id) => {
        return state.textbooks.find(t => t.id === id);
    }
  },
};

