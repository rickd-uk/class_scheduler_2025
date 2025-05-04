export default {
  namespaced: true,

  state: () => ({
    modals: {
      templateEditor: false,
      dailyException: false,
      weeklySchedule: false,
      textbookFormModal: false,
      linkTextbookModal: false, // Add state for the link modal
      dayOffEditor: false,
      exceptionPatternEditor: false,
      classFormModal: false,
      // classEditor: false,
    },
    modalData: {
      templateEditor: null,
      dailyException: null,
      weeklySchedule: null,
      textbookFormModal: null,
      linkTextbookModal: null, // Add state for link modal data (the class object)
      dayOffEditor: null,
      exceptionPatternEditor: null,
      // classEditor: null,
      classFormModal: null,
    },
    isLoading: false,
    notification: null
  }),

  mutations: {
    OPEN_MODAL(state, { modalName, data = null }) {
      console.log(`[UI Store Mutation] OPEN_MODAL for: ${modalName}. Current state: ${state.modals[modalName]}`); // <-- Add log
      if (state.modals.hasOwnProperty(modalName)) {
        state.modals[modalName] = true;
        state.modalData[modalName] = data;
        console.log(`[UI Store Mutation] State for ${modalName} set to: ${state.modals[modalName]}`); // <-- Add log
      } else {
        console.warn(`Modal "${modalName}" does not exist in UI store state.`);
      }
    },

    CLOSE_MODAL(state, modalName) {
      console.log(`[UI Store Mutation] CLOSE_MODAL for: ${modalName}. Current state: ${state.modals[modalName]}`);
      if (state.modals.hasOwnProperty(modalName)) {
        state.modals[modalName] = false;
        state.modalData[modalName] = null;
        console.log(`[UI Store Mutation] State for ${modalName} set to: ${state.modals[modalName]}`);
      } else {
        console.warn(`Modal "${modalName}" does not exist in UI store state.`);
      }
    },
    // Other mutations...
    SET_LOADING(state, isLoading) { state.isLoading = isLoading; },
    SET_NOTIFICATION(state, { type, message }) { state.notification = { type, message }; },
    CLEAR_NOTIFICATION(state) { state.notification = null; }
  },

  actions: {
    openModal({ commit }, { modalName, data = null }) {
      console.log(`[UI Store Action] openModal called for: ${modalName}`); // <-- Add log
      const dataCopy = data ? JSON.parse(JSON.stringify(data)) : null;
      commit('OPEN_MODAL', { modalName, data: dataCopy });
    },
    closeModal({ commit }, modalName) {
      console.log(`[UI Store Action] closeModal called for: ${modalName}`);
      commit('CLOSE_MODAL', modalName);
    },


    // Other actions...
    setLoading({ commit }, isLoading) { commit('SET_LOADING', isLoading); },

    showNotification({ commit }, { type = 'info', message, duration = 3000 }) {
      commit('SET_NOTIFICATION', { type, message });
      // Automatically clear notification after duration
      if (duration > 0) {
        setTimeout(() => {
          commit('CLEAR_NOTIFICATION');
        }, duration);
      }
    },

    clearNotification({ commit }) { commit('CLEAR_NOTIFICATION'); }
  },

  getters: {
    isModalOpen: (state) => (modalName) => {
       return state.modals[modalName] || false;
    },
    getModalData: (state) => (modalName) => {
        return state.modalData[modalName] || null;
    },
  }
}

