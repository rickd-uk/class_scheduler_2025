// client/src/store/modules/auth.js
import AuthService from '../../services/AuthService'
import router from '../../router' // Import router for programmatic navigation
import ApiService from '../../services/ApiService'; // Import ApiService to potentially set headers

// Helper to parse JSON safely
const safeJsonParse = (item) => {
  try {
    return JSON.parse(item);
  } catch (e) {
    return null;
  }
}

export default {
  namespaced: true,

  state: () => ({
    token: localStorage.getItem('token') || null,
    user: safeJsonParse(localStorage.getItem('user')) || null,
    isLoading: false,
    error: null
  }),

  getters: {
    isAuthenticated: state => !!state.token && !!state.user,
    currentUser: state => state.user,
    isLoading: state => state.isLoading,
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
      state.token = null
      state.user = null
    },
    LOGOUT(state) {
      state.token = null
      state.user = null
      state.isLoading = false
      state.error = null
    },
    CLEAR_ERROR(state) {
       state.error = null;
    }
  },

  actions: {
    async login({ commit }, credentials) {
      commit('AUTH_REQUEST')
      try {
        console.log('Attempting login via API for:', credentials.username);
        // Call the actual AuthService
        const response = await AuthService.login(credentials);

        const { token, user } = response.data; // Assuming API returns { token: '...', user: {...} }

        if (!token || !user) {
           throw new Error('Invalid response from server during login.');
        }

        // Store token and user in localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));

        // Update state
        commit('AUTH_SUCCESS', { token, user });

        // NOTE: ApiService interceptor already adds token to subsequent requests

        console.log('API Login successful for:', user.username);
        return response; // Return response for potential chaining
      } catch (error) {
        console.error('Login action failed:', error);
        // Extract error message from API response if available
        const errorMessage = error.response?.data?.message || error.message || 'Authentication failed.';
        commit('AUTH_ERROR', errorMessage);
        // Clear localStorage on failure
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        throw new Error(errorMessage); // Re-throw error for component handling
      }
    },

    async register({ commit }, userData) {
      commit('AUTH_REQUEST');
      try {
        console.log('Attempting registration via API for:', userData.username);
        // Call the actual AuthService
        const response = await AuthService.register(userData);

        const { token, user } = response.data; // Assuming API returns { token: '...', user: {...} }

        if (!token || !user) {
           throw new Error('Invalid response from server during registration.');
        }

        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));

        commit('AUTH_SUCCESS', { token, user });

        console.log('API Registration successful for:', user.username);
        return response;
      } catch (error) {
        console.error('Registration action failed:', error);
        const errorMessage = error.response?.data?.message || error.message || 'Registration failed.';
        commit('AUTH_ERROR', errorMessage);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        throw new Error(errorMessage);
      }
    },

    logout({ commit }) {
      console.log('Logging out user...');
      // Optional: Call API logout endpoint via AuthService if implemented
      // AuthService.logout().catch(err => console.warn("Server logout failed", err));

      // Clear local storage
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // Reset state
      commit('LOGOUT');

      // Redirect to login page.
      router.push({ name: 'login' }).catch(err => {
          if (err.name !== 'NavigationDuplicated') {
              console.error('Router push error during logout:', err);
          }
      });
      console.log('Logout complete.');
    },

    clearError({ commit }) {
        commit('CLEAR_ERROR');
    },

    // Action triggered by Axios interceptor on 401
    handleUnauthorized({ commit, state }) {
        // Only logout if user was actually logged in (avoid loops on login page)
        if(state.token) {
            console.warn("Handling unauthorized access (401). Logging out.");
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            commit('LOGOUT');
            router.push({ name: 'login', query: { sessionExpired: 'true' } }).catch(err => {
               if (err.name !== 'NavigationDuplicated') {
                  console.error('Router push error during unauthorized handling:', err);
              }
            });
        } else {
             console.log("Handling unauthorized access (401), but user already logged out.");
        }
    }
  }
}

