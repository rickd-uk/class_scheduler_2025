export default {
  namespaced: true,

  state: () => ({
    modals: {
      templateEditor: false,
      dailyException: false,
      weeklySchedule: false
      // Add other modals here if needed
      // textbookEditor: false,
      // classEditor: false,
    },
    // Data to pass to modals when opened
    modalData: {
      templateEditor: null,
      dailyException: null,
      weeklySchedule: null
      // textbookEditor: null,
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
      if (state.modals.hasOwnProperty(modalName)) {
        state.modals[modalName] = false;
        state.modalData[modalName] = null; // Clear data when modal closes
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

    // --- Deprecated / Renamed ---
    // Use SET_MODAL_DATA combined with OPEN_MODAL instead
    // SET_TEMPLATE_EDIT_DATA(state, data) {
    //   state.templateEditData = data
    // },
    // SET_EXCEPTION_EDIT_DATA(state, data) {
    //   state.exceptionEditData = data
    // }
    // --- End Deprecated ---
  },

  actions: {
    // Pass modal name and optional data payload
    openModal({ commit }, { modalName, data = null }) {
      commit('OPEN_MODAL', { modalName, data });
    },

    closeModal({ commit }, modalName) {
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

    // --- Deprecated / Renamed ---
    // setTemplateEditData({ commit }, data) {
    //   commit('SET_TEMPLATE_EDIT_DATA', data)
    // },
    // setExceptionEditData({ commit }, data) {
    //   commit('SET_EXCEPTION_EDIT_DATA', data)
    // }
     // --- End Deprecated ---
  },

  getters: {
    isModalOpen: (state) => (modalName) => {
       return state.modals[modalName] || false;
    },
    getModalData: (state) => (modalName) => {
        return state.modalData[modalName] || null;
    },
    // --- Deprecated / Renamed ---
    // templateEditData: state => state.templateEditData,
    // exceptionEditData: state => state.exceptionEditData
    // --- End Deprecated ---
  }
}

