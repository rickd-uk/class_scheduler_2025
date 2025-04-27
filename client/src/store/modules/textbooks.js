// import TextbooksService from '../../services/TextbooksService'; // Assuming you create this service

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
      state.textbooks.push(newTextbook);
    },
    UPDATE_TEXTBOOK(state, updatedTextbook) {
      const index = state.textbooks.findIndex(t => t.id === updatedTextbook.id);
      if (index !== -1) {
        state.textbooks.splice(index, 1, updatedTextbook);
      }
    },
    REMOVE_TEXTBOOK(state, textbookId) {
      state.textbooks = state.textbooks.filter(t => t.id !== textbookId);
    },
    SET_LOADING(state, isLoading) {
      state.isLoading = isLoading;
    },
    SET_ERROR(state, error) {
      state.error = error;
    },
     RESET_STATE(state) {
      state.textbooks = [];
      state.isLoading = false;
      state.error = null;
    }
  },

  actions: {
    async fetchTextbooks({ commit }) {
      commit('SET_LOADING', true);
      commit('SET_ERROR', null);
      try {
        // const response = await TextbooksService.getAll(); // Replace with actual API call
        // commit('SET_TEXTBOOKS', response.data);

         // Placeholder:
        await new Promise(resolve => setTimeout(resolve, 300)); // Simulate network delay
        const placeholderData = [
          { id: 'tb1', title: 'Algebra Basics', subject: 'Mathematics', isbn: '978-1234567890' },
          { id: 'tb2', title: 'Intro to Literature', subject: 'English', isbn: '978-0987654321' },
        ];
        commit('SET_TEXTBOOKS', placeholderData);
        console.log('Fetched placeholder textbooks');

      } catch (error) {
         const message = error.response?.data?.message || error.message || 'Failed to fetch textbooks';
        commit('SET_ERROR', message);
        console.error('Error fetching textbooks:', message);
      } finally {
        commit('SET_LOADING', false);
      }
    },
     // Add actions for addTextbook, updateTextbook, deleteTextbook using API calls
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

