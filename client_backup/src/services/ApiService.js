// client/src/services/ApiService.js
import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.VUE_APP_API_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor for adding auth token
apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for handling errors
apiClient.interceptors.response.use(
  response => response,
  error => {
    // Handle 401 Unauthorized errors (token expired, etc.)
    if (error.response && error.response.status === 401) {
      // Redirect to login or refresh token
      localStorage.removeItem('token');
      // If using Vuex, dispatch logout action
      // store.dispatch('auth/logout');
    }
    return Promise.reject(error);
  }
);

const ApiService = {
  // Generic methods
  get(url, params = {}) {
    return apiClient.get(url, { params });
  },
  
  post(url, data = {}) {
    return apiClient.post(url, data);
  },
  
  put(url, data = {}) {
    return apiClient.put(url, data);
  },
  
  delete(url) {
    return apiClient.delete(url);
  }
};

export default ApiService;
