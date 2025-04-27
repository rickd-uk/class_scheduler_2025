// client/src/services/ScheduleService.js
import ApiService from './ApiService'

const ScheduleService = {
  // Regular schedule methods
  getRegularSchedule() {
    return ApiService.get('/api/schedule/regular')
  },
  
  assignClassToPeriod(weekday, period, classId) {
    return ApiService.post('/api/schedule/regular', {
      weekday,
      period,
      classId
    })
  },
  
  removeClassFromPeriod(weekday, period) {
    return ApiService.delete(`/api/schedule/regular/${weekday}/${period}`)
  },
  
  // Templates methods
  getTemplates() {
    return ApiService.get('/api/templates')
  },
  
  getTemplateById(id) {
    return ApiService.get(`/api/templates/${id}`)
  },
  
  createTemplate(templateData) {
    return ApiService.post('/api/templates', templateData)
  },
  
  updateTemplate(id, templateData) {
    return ApiService.put(`/api/templates/${id}`, templateData)
  },
  
  deleteTemplate(id) {
    return ApiService.delete(`/api/templates/${id}`)
  },
  
  // Exceptions methods
  getExceptions() {
    return ApiService.get('/api/schedule/exceptions')
  },
  
  getExceptionByDate(date) {
    return ApiService.get(`/api/schedule/exceptions/${date}`)
  },
  
  applyTemplate(date, templateId) {
    return ApiService.post('/api/schedule/exceptions', {
      date,
      templateId
    })
  },
  
  updateException(date, exceptionData) {
    return ApiService.put(`/api/schedule/exceptions/${date}`, exceptionData)
  },
  
  removeException(date) {
    return ApiService.delete(`/api/schedule/exceptions/${date}`)
  },
  
  // Slot override methods
  updateSlotOverride(date, slotNumber, overrideData) {
    return ApiService.put(`/api/schedule/exceptions/${date}/slots/${slotNumber}`, overrideData)
  },
  
  deleteSlotOverride(date, slotNumber) {
    return ApiService.delete(`/api/schedule/exceptions/${date}/slots/${slotNumber}`)
  }
}

export default ScheduleService
