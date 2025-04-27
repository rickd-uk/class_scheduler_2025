// client/src/store/modules/schedule.js
import ScheduleService from '@/services/ScheduleService'
import { formatDate } from '@/utils/dateHelpers'

export default {
  namespaced: true,
  
  state: {
    regularSchedule: {}, // { weekday: { period: classId } }
    exceptions: {}, // { date: { templateId, slotOverrides: { slotNumber: { overrides } } } }
    isLoading: false,
    error: null
  },
  
  getters: {
    // Get schedule for a specific weekday
    getDaySchedule: (state, getters, rootState, rootGetters) => (dateStr) => {
      if (!dateStr) return null
      
      const dateObj = new Date(dateStr)
      const weekday = dateObj.getDay() // 0-6, 0 is Sunday
      
      // Check for day off
      if (rootState.daysOff.daysOff[dateStr]) {
        return {
          isDayOff: true,
          dayOffInfo: rootState.daysOff.daysOff[dateStr]
        }
      }
      
      // Check for schedule exception
      const exception = state.exceptions[dateStr]
      
      // If there's an exception with a template, apply the template
      if (exception && exception.templateId) {
        return getters.generateTemplateSchedule(dateStr, exception.templateId, exception.slotOverrides || {})
      }
      
      // Regular day schedule for this weekday
      const daySchedule = state.regularSchedule[weekday] || {}
      const result = {}
      
      // Convert period assignments to detailed info
      for (let period = 1; period <= 6; period++) {
        const classId = daySchedule[period]
        const classInfo = classId ? rootGetters['classes/getClassById'](classId) : null
        
        // Apply any slot overrides if they exist
        const slotOverrides = exception?.slotOverrides?.[period]
        
        result[period] = {
          className: slotOverrides?.classId ? 
            rootGetters['classes/getClassById'](slotOverrides.classId)?.className : 
            (classInfo?.className || 'NO_CLASS'),
          classTitle: slotOverrides?.classTitle || 
            (classInfo?.title || 'No Class'),
          details: slotOverrides?.details || '',
          textbook: slotOverrides?.textbookId ? 
            rootGetters['textbooks/getTextbookById'](slotOverrides.textbookId)?.name : 
            (classInfo?.defaultTextbook || ''),
          pages: slotOverrides?.pages || ''
        }
      }
      
      return result
    },
    
    // Get the active template for a specific date
    getActiveTemplate: (state, getters, rootState) => (dateStr) => {
      if (!dateStr) return null
      
      const exception = state.exceptions[dateStr]
      if (!exception || !exception.templateId) return null
      
      const template = rootState.templates.templates.find(t => t.id === exception.templateId)
      return template || null
    },
    
    // Generate a schedule based on a template
    generateTemplateSchedule: (state, getters, rootState, rootGetters) => (dateStr, templateId, slotOverrides = {}) => {
      if (!dateStr || !templateId) return null
      
      const dateObj = new Date(dateStr)
      const weekday = dateObj.getDay() // 0-6, 0 is Sunday
      const weekdaySchedule = state.regularSchedule[weekday] || {}
      
      // Find the template
      const template = rootState.templates.templates.find(t => t.id === templateId)
      if (!template) return null
      
      const result = {}
      
      // Process each slot in the template
      for (let slotNumber = 1; slotNumber <= 6; slotNumber++) {
        const templateSlot = template.slots[slotNumber]
        
        // Default values if slot isn't defined in the template
        let className = 'NO_CLASS'
        let classTitle = 'Empty Slot'
        let details = ''
        let textbook = ''
        let pages = ''
        
        if (templateSlot) {
          if (templateSlot.type === 'period') {
            // Use the class assigned to this period in the regular schedule
            const periodNumber = templateSlot.periodNumber
            const classId = weekdaySchedule[periodNumber]
            const classInfo = classId ? rootGetters['classes/getClassById'](classId) : null
            
            className = classInfo?.className || 'NO_CLASS'
            classTitle = classInfo?.title || 'No Regular Class'
            textbook = classInfo?.defaultTextbook || ''
          } else if (templateSlot.type === 'event') {
            // Event type slot
            className = 'EVENT'
            classTitle = templateSlot.eventName || 'Event'
          }
        }
        
        // Apply any overrides for this slot
        const slotOverride = slotOverrides[slotNumber]
        if (slotOverride) {
          if (slotOverride.classId) {
            const overrideClass = rootGetters['classes/getClassById'](slotOverride.classId)
            className = overrideClass?.className || className
            // Only override title if explicitly provided or if class was changed
            classTitle = slotOverride.classTitle || (slotOverride.classId ? (overrideClass?.title || classTitle) : classTitle)
          } else if (slotOverride.classTitle) {
            classTitle = slotOverride.classTitle
          }
          
          details = slotOverride.details || details
          
          if (slotOverride.textbookId) {
            const overrideTextbook = rootGetters['textbooks/getTextbookById'](slotOverride.textbookId)
            textbook = overrideTextbook?.name || textbook
          }
          
          pages = slotOverride.pages || pages
        }
        
        result[slotNumber] = {
          className,
          classTitle,
          details,
          textbook,
          pages
        }
      }
      
      return result
    }
  },
  
  mutations: {
    SET_REGULAR_SCHEDULE(state, schedule) {
      state.regularSchedule = schedule
    },
    
    SET_EXCEPTIONS(state, exceptions) {
      state.exceptions = exceptions
    },
    
    SET_PERIOD_CLASS(state, { weekday, period, classId }) {
      if (!state.regularSchedule[weekday]) {
        state.regularSchedule = {
          ...state.regularSchedule,
          [weekday]: {}
        }
      }
      
      state.regularSchedule[weekday] = {
        ...state.regularSchedule[weekday],
        [period]: classId
      }
    },
    
    REMOVE_PERIOD_CLASS(state, { weekday, period }) {
      if (state.regularSchedule[weekday]) {
        const updatedWeekday = { ...state.regularSchedule[weekday] }
        delete updatedWeekday[period]
        
        state.regularSchedule = {
          ...state.regularSchedule,
          [weekday]: updatedWeekday
        }
      }
    },
    
    SET_EXCEPTION(state, { date, templateId, slotOverrides }) {
      state.exceptions = {
        ...state.exceptions,
        [date]: {
          templateId,
          slotOverrides: slotOverrides || {}
        }
      }
    },
    
    REMOVE_EXCEPTION(state, date) {
      const updatedExceptions = { ...state.exceptions }
      delete updatedExceptions[date]
      state.exceptions = updatedExceptions
    },
    
    SET_LOADING(state, isLoading) {
      state.isLoading = isLoading
    },
    
    SET_ERROR(state, error) {
      state.error = error
    }
  },
  
  actions: {
    // Fetch regular weekly schedule from API
    async fetchRegularSchedule({ commit }) {
      commit('SET_LOADING', true)
      commit('SET_ERROR', null)
      
      try {
        const response = await ScheduleService.getRegularSchedule()
        
        // Transform API response to our state format
        // API returns array of { weekday, period, classId }
        const schedule = {}
        
        response.data.forEach(item => {
          if (!schedule[item.weekday]) {
            schedule[item.weekday] = {}
          }
          schedule[item.weekday][item.period] = item.classId
        })
        
        commit('SET_REGULAR_SCHEDULE', schedule)
      } catch (error) {
        console.error('Error fetching regular schedule:', error)
        commit('SET_ERROR', error.message || 'Failed to load schedule')
      } finally {
        commit('SET_LOADING', false)
      }
    },
    
    // Fetch schedule exceptions from API
    async fetchExceptions({ commit }) {
      commit('SET_LOADING', true)
      commit('SET_ERROR', null)
      
      try {
        const response = await ScheduleService.getExceptions()
        
        // Transform API response to our state format
        const exceptions = {}
        
        response.data.forEach(exception => {
          // Transform slot overrides array to object
          const slotOverrides = {}
          
          if (exception.slotOverrides && exception.slotOverrides.length > 0) {
            exception.slotOverrides.forEach(override => {
              slotOverrides[override.slotNumber] = {
                classId: override.classId,
                classTitle: override.classTitle,
                details: override.details,
                textbookId: override.textbookId,
                pages: override.pages
              }
            })
          }
          
          exceptions[exception.date] = {
            templateId: exception.templateId,
            slotOverrides
          }
        })
        
        commit('SET_EXCEPTIONS', exceptions)
      } catch (error) {
        console.error('Error fetching schedule exceptions:', error)
        commit('SET_ERROR', error.message || 'Failed to load schedule exceptions')
      } finally {
        commit('SET_LOADING', false)
      }
    },
    
    // Update a class assignment in the regular schedule
    async updateRegularSchedule({ commit }, { weekday, period, classId }) {
      commit('SET_LOADING', true)
      commit('SET_ERROR', null)
      
      try {
        if (classId) {
          // Assign class to period
          await ScheduleService.assignClassToPeriod(weekday, period, classId)
          commit('SET_PERIOD_CLASS', { weekday, period, classId })
        } else {
          // Remove class from period
          await ScheduleService.removeClassFromPeriod(weekday, period)
          commit('REMOVE_PERIOD_CLASS', { weekday, period })
        }
      } catch (error) {
        console.error('Error updating regular schedule:', error)
        commit('SET_ERROR', error.message || 'Failed to update schedule')
        throw error
      } finally {
        commit('SET_LOADING', false)
      }
    },
    
    // Apply a template to a specific date
    async applyTemplateToDate({ commit }, { date, templateId }) {
      commit('SET_LOADING', true)
      commit('SET_ERROR', null)
      
      try {
        await ScheduleService.applyTemplate(date, templateId)
        commit('SET_EXCEPTION', { date, templateId, slotOverrides: {} })
      } catch (error) {
        console.error('Error applying template:', error)
        commit('SET_ERROR', error.message || 'Failed to apply template')
        throw error
      } finally {
        commit('SET_LOADING', false)
      }
    },
    
    // Remove template from a date
    async removeTemplateFromDate({ commit, state }, date) {
      commit('SET_LOADING', true)
      commit('SET_ERROR', null)
      
      try {
        // Check if there are any slot overrides to preserve
        const hasOverrides = state.exceptions[date]?.slotOverrides && 
                           Object.keys(state.exceptions[date].slotOverrides).length > 0
                           
        if (hasOverrides) {
          // Keep the overrides but remove the template
          await ScheduleService.updateException(date, { templateId: null })
          commit('SET_EXCEPTION', { date, templateId: null, slotOverrides: state.exceptions[date].slotOverrides })
        } else {
          // Remove the entire exception
          await ScheduleService.removeException(date)
          commit('REMOVE_EXCEPTION', date)
        }
      } catch (error) {
        console.error('Error removing template:', error)
        commit('SET_ERROR', error.message || 'Failed to remove template')
        throw error
      } finally {
        commit('SET_LOADING', false)
      }
    },
    
    // Update slot overrides for a specific date
    async updateSlotOverrides({ commit, state }, { date, slotNumber, overrides }) {
      commit('SET_LOADING', true)
      commit('SET_ERROR', null)
      
      try {
        // Get current exception if it exists
        const currentException = state.exceptions[date] || { templateId: null, slotOverrides: {} }
        
        // Create updated slot overrides
        const updatedSlotOverrides = { 
          ...currentException.slotOverrides,
          [slotNumber]: overrides
        }
        
        // If the override is empty, remove it
        if (!overrides.classId && !overrides.classTitle && !overrides.details && 
            !overrides.textbookId && !overrides.pages) {
          delete updatedSlotOverrides[slotNumber]
        }
        
        // Update exception
        await ScheduleService.updateException(date, {
          templateId: currentException.templateId,
          slotOverrides: updatedSlotOverrides
        })
        
        // If no template and no overrides left, remove the exception
        if (!currentException.templateId && Object.keys(updatedSlotOverrides).length === 0) {
          commit('REMOVE_EXCEPTION', date)
        } else {
          commit('SET_EXCEPTION', { 
            date, 
            templateId: currentException.templateId,
            slotOverrides: updatedSlotOverrides
          })
        }
      } catch (error) {
        console.error('Error updating slot overrides:', error)
        commit('SET_ERROR', error.message || 'Failed to update slot')
        throw error
      } finally {
        commit('SET_LOADING', false)
      }
    },
    
    // Clear all overrides for a specific date
    async clearOverridesForDate({ commit, state }, date) {
      commit('SET_LOADING', true)
      commit('SET_ERROR', null)
      
      try {
        const currentException = state.exceptions[date]
        
        if (!currentException) {
          return // Nothing to clear
        }
        
        // If there's a template, keep it but remove all overrides
        if (currentException.templateId) {
          await ScheduleService.updateException(date, {
            templateId: currentException.templateId,
            slotOverrides: {}
          })
          
          commit('SET_EXCEPTION', { 
            date, 
            templateId: currentException.templateId,
            slotOverrides: {}
          })
        } else {
          // If no template, remove the entire exception
          await ScheduleService.removeException(date)
          commit('REMOVE_EXCEPTION', date)
        }
      } catch (error) {
        console.error('Error clearing overrides:', error)
        commit('SET_ERROR', error.message || 'Failed to clear overrides')
        throw error
      } finally {
        commit('SET_LOADING', false)
      }
    }
  }
}
