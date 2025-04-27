// client/src/store/modules/classes.js
import ClassesService from '@/services/ClassesService'

export default {
  namespaced: true,
  
  state: {
    classes: [],
    isLoading: false,
    error: null
  },
  
  getters: {
    getClassById: state => id => state.classes.find(cls => cls.id === id),
    getClassByName: state => name => state.classes.find(cls => cls.class_name === name)
  },
  
  mutations: {
    SET_CLASSES(state, classes) {
      state.classes = classes
    },
    
    ADD_CLASS(state, newClass) {
      state.classes.push(newClass)
    },
    
    UPDATE_CLASS(state, updatedClass) {
      const index = state.classes.findIndex(cls => cls.id === updatedClass.id)
      if (index !== -1) {
        state.classes.splice(index, 1, updatedClass)
      }
    },
    
    REMOVE_CLASS(state, classId) {
      state.classes = state.classes.filter(cls => cls.id !== classId)
    },
    
    SET_LOADING(state, isLoading) {
      state.isLoading = isLoading
    },
    
    SET_ERROR(state, error) {
      state.error = error
    }
  },
  
  actions: {
    async fetchClasses({ commit }) {
      commit('SET_LOADING', true)
      
      try {
        const response = await ClassesService.getClasses()
        commit('SET_CLASSES', response.data)
        commit('SET_ERROR', null)
      } catch (error) {
        console.error('Error fetching classes:', error)
        commit('SET_ERROR', error.message || 'Failed to fetch classes')
      } finally {
        commit('SET_LOADING', false)
      }
    },
    
    async createClass({ commit }, classData) {
      commit('SET_LOADING', true)
      
      try {
        const response = await ClassesService.createClass(classData)
        commit('ADD_CLASS', response.data)
        commit('SET_ERROR', null)
        return response.data
      } catch (error) {
        console.error('Error creating class:', error)
        commit('SET_ERROR', error.response?.data?.message || 'Failed to create class')
        throw error
      } finally {
        commit('SET_LOADING', false)
      }
    },
    
    async updateClass({ commit }, { id, classData }) {
      commit('SET_LOADING', true)
      
      try {
        const response = await ClassesService.updateClass(id, classData)
        commit('UPDATE_CLASS', response.data)
        commit('SET_ERROR', null)
        return response.data
      } catch (error) {
        console.error('Error updating class:', error)
        commit('SET_ERROR', error.response?.data?.message || 'Failed to update class')
        throw error
      } finally {
        commit('SET_LOADING', false)
      }
    },
    
    async deleteClass({ commit }, classId) {
      commit('SET_LOADING', true)
      
      try {
        await ClassesService.deleteClass(classId)
        commit('REMOVE_CLASS', classId)
        commit('SET_ERROR', null)
      } catch (error) {
        console.error('Error deleting class:', error)
        commit('SET_ERROR', error.response?.data?.message || 'Failed to delete class')
        throw error
      } finally {
        commit('SET_LOADING', false)
      }
    }
  }
}
