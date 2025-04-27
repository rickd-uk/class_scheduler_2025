import ApiService from './ApiService'

const AuthService = {
  login(credentials) {
    return ApiService.post('/api/auth/login', credentials)
  },
  
  register(userData) {
    return ApiService.post('/api/auth/register', userData)
  },
  
  getCurrentUser() {
    return ApiService.get('/api/auth/me')
  }
}

export default AuthService
