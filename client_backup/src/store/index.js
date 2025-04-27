import { createStore } from 'vuex'

// Import modules or create them inline
const auth = {
  namespaced: true,
  state: {
    isAuthenticated: false,
    user: null
  },
  mutations: {
    SET_AUTH(state, auth) {
      state.isAuthenticated = auth
    },
    SET_USER(state, user) {
      state.user = user
    }
  },
  actions: {
    login({ commit }) {
      // Placeholder login action
      commit('SET_AUTH', true)
      commit('SET_USER', { username: 'Demo User' })
    },
    logout({ commit }) {
      // Placeholder logout action
      commit('SET_AUTH', false)
      commit('SET_USER', null)
    }
  }
}

// Create empty placeholder modules for now
const createEmptyModule = () => ({
  namespaced: true,
  state: {},
  mutations: {},
  actions: {}
})

export default createStore({
  modules: {
    auth,
    classes: createEmptyModule(),
    textbooks: createEmptyModule(),
    schedule: createEmptyModule(),
    templates: createEmptyModule(),
    daysOff: createEmptyModule(),
    schoolYear: createEmptyModule(),
    ui: createEmptyModule()
  }
})
