// import SchoolYearService from '../../services/SchoolYearService'; // Assuming you create this service

export default {
  namespaced: true,

  state: () => ({
    schoolYear: {
      startDate: null, // 'YYYY-MM-DD'
      endDate: null,   // 'YYYY-MM-DD'
      terms: [],       // Array of { name: 'Term 1', startDate: '...', endDate: '...' }
    },
    isLoading: false,
    error: null,
  }),

  mutations: {
    SET_SCHOOL_YEAR(state, schoolYearData) {
      state.schoolYear = schoolYearData;
    },
    SET_LOADING(state, isLoading) {
      state.isLoading = isLoading;
    },
    SET_ERROR(state, error) {
      state.error = error;
    },
     RESET_STATE(state) {
      state.schoolYear = { startDate: null, endDate: null, terms: [] };
      state.isLoading = false;
      state.error = null;
    }
  },

  actions: {
    async fetchSchoolYear({ commit }) {
      commit('SET_LOADING', true);
      commit('SET_ERROR', null);
      try {
        // const response = await SchoolYearService.get(); // Replace with actual API call
        // commit('SET_SCHOOL_YEAR', response.data);

         // Placeholder:
        await new Promise(resolve => setTimeout(resolve, 250)); // Simulate network delay
        const placeholderData = {
           startDate: '2024-09-02',
           endDate: '2025-06-20',
           terms: [
             { name: 'Fall Term', startDate: '2024-09-02', endDate: '2024-12-20' },
             { name: 'Spring Term', startDate: '2025-01-06', endDate: '2025-06-20' },
           ]
        };
        commit('SET_SCHOOL_YEAR', placeholderData);
        console.log('Fetched placeholder school year');

      } catch (error) {
         const message = error.response?.data?.message || error.message || 'Failed to fetch school year data';
        commit('SET_ERROR', message);
        console.error('Error fetching school year:', message);
      } finally {
        commit('SET_LOADING', false);
      }
    },
     // Add action for updateSchoolYear
  },

  getters: {
    currentSchoolYear: state => state.schoolYear,
    isLoading: state => state.isLoading,
    error: state => state.error,
    schoolYearStartDate: state => state.schoolYear.startDate,
    schoolYearEndDate: state => state.schoolYear.endDate,
    schoolYearTerms: state => state.schoolYear.terms,
  },
};

