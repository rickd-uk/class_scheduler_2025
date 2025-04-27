import ApiService from './ApiService'

const ClassesService = {
  getClasses() {
    return ApiService.get('/api/classes')
  },
  
  getClassById(id) {
    return ApiService.get(`/api/classes/${id}`)
  },
  
  createClass(classData) {
    return ApiService.post('/api/classes', classData)
  },
  
  updateClass(id, classData) {
    return ApiService.put(`/api/classes/${id}`, classData)
  },
  
  deleteClass(id) {
    return ApiService.delete(`/api/classes/${id}`)
  }
}

export default ClassesService
