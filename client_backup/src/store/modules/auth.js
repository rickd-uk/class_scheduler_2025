// client/src/store/modules/auth.js
import AuthService from '@/services/AuthService'

export default {
  namespaced: true,
  
  state: {
    token: localStorage.getItem('token') || null,
    user: JSON.parse(localStorage.getItem('user')) || null,
    isLoading: false,
    error: null
  },
  
  getters: {
    isAuthenticated: state => !!state.token,
    currentUser: state => state.user,
    error: state => state.error
  },
  
  mutations: {
    AUTH_REQUEST(state) {
      state.isLoading = true
      state.error = null
    },
    
    AUTH_SUCCESS(state, { token, user }) {
      state.token = token
      state.user = user
      state.isLoading = false
      state.error = null
    },
    
    AUTH_ERROR(state, error) {
      state.isLoading = false
      state.error = error
    },
    
    LOGOUT(state) {
      state.token = null
      state.user = null
    }
  },
  
  actions: {
    async login({ commit }, credentials) {
      commit('AUTH_REQUEST')
      
      try {
        const response = await AuthService.login(credentials)
        const { token, user } = response.data
        
        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(user))
        
        commit('AUTH_SUCCESS', { token, user })
        return response
      } catch (error) {
        commit('AUTH_ERROR', error.response?.data?.message || 'Authentication failed')
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        throw error
      }
    },
    
    async register({ commit }, userData) {
      commit('AUTH_REQUEST')
      
      try {
        const response = await AuthService.register(userData)
        const { token, user } = response.data
        
        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(user))
        
        commit('AUTH_SUCCESS', { token, user })
        return response
      } catch (error) {
        commit('AUTH_ERROR', error.response?.data?.message || 'Registration failed')
        throw error
      }
    },
    
    logout({ commit }) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      commit('LOGOUT')
    }
  }
}
