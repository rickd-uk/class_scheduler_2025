// import TemplatesService from '../../services/TemplatesService'; // Assuming you create this service

export default {
  namespaced: true,

  state: () => ({
    templates: [], // Array of schedule templates { id: 't1', name: 'Standard Week', schedule: {...} }
    isLoading: false,
    error: null,
  }),

  mutations: {
    SET_TEMPLATES(state, templates) {
      state.templates = templates;
    },
     ADD_TEMPLATE(state, template) {
      state.templates.push(template);
    },
    UPDATE_TEMPLATE(state, updatedTemplate) {
      const index = state.templates.findIndex(t => t.id === updatedTemplate.id);
      if (index !== -1) {
        state.templates.splice(index, 1, updatedTemplate);
      }
    },
    REMOVE_TEMPLATE(state, templateId) {
      state.templates = state.templates.filter(t => t.id !== templateId);
    },
    SET_LOADING(state, isLoading) {
      state.isLoading = isLoading;
    },
    SET_ERROR(state, error) {
      state.error = error;
    },
     RESET_STATE(state) {
      state.templates = [];
      state.isLoading = false;
      state.error = null;
    }
  },

  actions: {
    async fetchTemplates({ commit }) {
      commit('SET_LOADING', true);
      commit('SET_ERROR', null);
      try {
        // const response = await TemplatesService.getAll(); // Replace with actual API call
        // commit('SET_TEMPLATES', response.data);

         // Placeholder:
        await new Promise(resolve => setTimeout(resolve, 350)); // Simulate network delay
        const placeholderData = [
           { id: 't1', name: 'Standard Week', schedule: { monday: [{ time: '09:00', classId: 'c1' }], tuesday: [{ time: '09:00', classId: 'c3' }] } },
           { id: 't2', name: 'Exam Week', schedule: { monday: [], tuesday: [], wednesday: [{ time: '10:00', notes: 'Exam Setup'}], thursday: [], friday: [] } },
        ];
        commit('SET_TEMPLATES', placeholderData);
        console.log('Fetched placeholder templates');

      } catch (error) {
        const message = error.response?.data?.message || error.message || 'Failed to fetch templates';
        commit('SET_ERROR', message);
        console.error('Error fetching templates:', message);
      } finally {
        commit('SET_LOADING', false);
      }
    },
    // Add actions for saveTemplate, deleteTemplate
     async applyTemplate({ commit, dispatch }, templateId) {
        commit('SET_LOADING', true);
        try {
            // 1. Find template data (or fetch if needed)
            const template = this.state.templates.templates.find(t => t.id === templateId); // Access module state correctly
            if (!template) throw new Error('Template not found');

            // 2. Call API to update the regular schedule (assuming an endpoint exists)
            // await ScheduleService.updateRegular(template.schedule);

            // 3. Fetch the updated regular schedule to reflect changes
            await dispatch('schedule/fetchRegularSchedule', null, { root: true }); // Dispatch to another module

             console.log(`Applied template ${templateId}`);
            // Optional: Show success notification
            dispatch('ui/showNotification', { type: 'success', message: `Template "${template.name}" applied successfully.` }, { root: true });

        } catch(error) {
             const message = error.response?.data?.message || error.message || 'Failed to apply template';
             commit('SET_ERROR', message);
             console.error('Error applying template:', message);
             dispatch('ui/showNotification', { type: 'error', message }, { root: true });
        } finally {
            commit('SET_LOADING', false);
        }
     }
  },

  getters: {
    allTemplates: state => state.templates,
    isLoading: state => state.isLoading,
    error: state => state.error,
    getTemplateById: (state) => (id) => {
        return state.templates.find(t => t.id === id);
    }
  },
};

