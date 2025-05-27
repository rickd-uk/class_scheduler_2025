import ApiService from "./ApiService";

// Define API endpoints (Match routes in server/routes/authRoutes.js)
const LOGIN_ENDPOINT = "/auth/login";
const REGISTER_ENDPOINT = "/auth/register";
// const ME_ENDPOINT = '/api/auth/me'; // Keep if needed later
// const LOGOUT_ENDPOINT = '/api/auth/logout'; // Keep if needed later

const AuthService = {
  login(credentials) {
    // credentials should be an object like { username: '...', password: '...' }
    console.log(`AuthService: Sending login request to ${LOGIN_ENDPOINT}`);
    // Use the actual ApiService post method
    return ApiService.post(LOGIN_ENDPOINT, credentials);
  },

  register(userData) {
    // userData should be an object like { username: '...', email: '...', password: '...' }
    console.log(
      `AuthService: Sending register request to ${REGISTER_ENDPOINT}`,
    );
    // Use the actual ApiService post method
    return ApiService.post(REGISTER_ENDPOINT, userData);
  },

  // Optional: Get current user data if token is valid
  // getCurrentUser() {
  //    console.log(`AuthService: Sending request to ${ME_ENDPOINT}`);
  //   return ApiService.get(ME_ENDPOINT)
  // },

  // Optional: Send logout request to server (e.g., to invalidate session/token)
  // logout() {
  //   console.log(`AuthService: Sending logout request to ${LOGOUT_ENDPOINT}`);
  //   // This might not return anything significant or could be fire-and-forget
  //   return ApiService.post(LOGOUT_ENDPOINT)
  //    .catch(error => {
  //       // Don't block client logout if API call fails
  //       console.warn("AuthService: Server logout failed or endpoint doesn't exist.", error);
  //       return Promise.resolve(); // Resolve anyway
  //    });
  // }
};

export default AuthService;
