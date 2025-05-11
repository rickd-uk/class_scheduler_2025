import axios from "axios";
import store from "../store"; // Import store to dispatch actions

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000", // Use env variable
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Request interceptor for adding auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = store.state.auth.token; // Get token from store
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    // Handle request error
    return Promise.reject(error);
  },
);

// Response interceptor for handling errors globally
apiClient.interceptors.response.use(
  (response) => response, // Pass through successful responses
  (error) => {
    const { response } = error; // Destructure response from error

    if (response) {
      // Handle 401 Unauthorized errors (e.g., token expired)
      if (response.status === 401) {
        console.error(
          "API Error: Unauthorized (401). Token might be invalid or expired.",
        );
        // Dispatch logout action or a specific handler for unauthorized
        store.dispatch("auth/handleUnauthorized"); // Dispatch specific handler
      }
      // Handle 403 Forbidden errors
      else if (response.status === 403) {
        console.error("API Error: Forbidden (403). User lacks permission.");
        // Optionally show a notification
        store.dispatch(
          "ui/showNotification",
          {
            type: "error",
            message: "You do not have permission to perform this action.",
          },
          { root: true },
        );
      }
      // Handle other errors (e.g., 404 Not Found, 500 Server Error)
      else {
        console.error(`API Error: ${response.status}`, response.data);
        // Optionally show a generic error notification
        // store.dispatch('ui/showNotification', { type: 'error', message: `An error occurred: ${response.statusText}` }, { root: true });
      }
    } else {
      // Handle network errors (no response from server)
      console.error("Network Error:", error.message);
      store.dispatch(
        "ui/showNotification",
        {
          type: "error",
          message: "Network error. Please check your connection.",
        },
        { root: true },
      );
    }

    // Reject the promise so the error can be caught locally if needed
    return Promise.reject(error);
  },
);

// Wrap API methods for convenience
const ApiService = {
  get(resource, params = {}) {
    return apiClient.get(resource, { params });
  },

  post(resource, data = {}) {
    return apiClient.post(resource, data);
  },

  put(resource, data = {}) {
    return apiClient.put(resource, data);
  },

  delete(resource) {
    return apiClient.delete(resource);
  },

  // You might add specific methods if needed, e.g.:
  // patch(resource, data = {}) {
  //   return apiClient.patch(resource, data);
  // }
};

export default ApiService;
