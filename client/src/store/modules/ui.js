export default {
  namespaced: true,

  state: () => ({
    modals: {
      templateEditor: false,
      dailyException: false,
      weeklySchedule: false,
      textbookEditor: false, // State for the textbook editor modal
      // textbookFormModal: false // Remove if using separate edit modal
      // classEditor: false,
    },
    // Data to pass to modals when opened
    modalData: {
      templateEditor: null,
      dailyException: null,
      weeklySchedule: null,
      textbookEditor: null, // State for textbook editor data
      // textbookFormModal: null // Remove if using separate edit modal
      // classEditor: null,
    },
    isLoading: false, // General UI loading state (e.g., for full page overlays)
    notification: null // { type: 'success' | 'error' | 'info', message: '...' }
  }),

  mutations: {
    OPEN_MODAL(state, { modalName, data = null }) {
      if (state.modals.hasOwnProperty(modalName)) {
        state.modals[modalName] = true;
        state.modalData[modalName] = data; // Store data for the modal
      } else {
        console.warn(`Modal "${modalName}" does not exist in UI store state.`);
      }
    },

    CLOSE_MODAL(state, modalName) {
    console.log(`[UI Store Mutation] CLOSE_MODAL for: ${modalName}. Current state: ${state.modals[modalName]}`); // <-- Add log
    if (state.modals.hasOwnProperty(modalName)) {
      state.modals[modalName] = false;
      state.modalData[modalName] = null;
      console.log(`[UI Store Mutation] State for ${modalName} set to: ${state.modals[modalName]}`); // <-- Add log
    } else {
      console.warn(`Modal "${modalName}" does not exist in UI store state.`);
    }
  },

    SET_LOADING(state, isLoading) {
      state.isLoading = isLoading;
    },

    SET_NOTIFICATION(state, { type, message }) {
      state.notification = { type, message };
    },

    CLEAR_NOTIFICATION(state) {
      state.notification = null;
    }
  },

  actions: {
    // Pass modal name and optional data payload
    openModal({ commit }, { modalName, data = null }) {
      // Important: Pass a deep copy of the data to avoid modifying original state directly
      const dataCopy = data ? JSON.parse(JSON.stringify(data)) : null;
      commit('OPEN_MODAL', { modalName, data: dataCopy });
    },

   closeModal({ commit }, modalName) {
    console.log(`[UI Store Action] closeModal called for: ${modalName}`); // <-- Add log
    commit('CLOSE_MODAL', modalName);
},

    setLoading({ commit }, isLoading) {
      commit('SET_LOADING', isLoading);
    },

    showNotification({ commit }, { type = 'info', message, duration = 3000 }) {
      commit('SET_NOTIFICATION', { type, message });
      // Automatically clear notification after duration
      if (duration > 0) {
        setTimeout(() => {
          commit('CLEAR_NOTIFICATION');
        }, duration);
      }
    },

    clearNotification({ commit }) {
      commit('CLEAR_NOTIFICATION');
    }
  },

  getters: {
    isModalOpen: (state) => (modalName) => {
       // Check if the modalName exists and return its boolean state
       return state.modals[modalName] || false;
    },
    getModalData: (state) => (modalName) => {
        // Return the data associated with the modal, or null if none
        return state.modalData[modalName] || null;
    },
  }
}

