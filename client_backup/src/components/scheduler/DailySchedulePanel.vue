<template>
  <div class="daily-schedule-panel">
    <div class="date-navigation">
      <button @click="goToPreviousDay" class="nav-btn">
        <i class="fas fa-chevron-left"></i> Previous
      </button>
      <div class="date-selector">
        <input 
          type="date" 
          v-model="selectedDate" 
          class="date-input"
          :min="schoolYear.startDate"
          :max="schoolYear.endDate"
        />
      </div>
      <button @click="goToNextDay" class="nav-btn">
        Next <i class="fas fa-chevron-right"></i>
      </button>
    </div>

    <div v-if="selectedDate" class="template-controls">
      <div class="template-selector">
        <label for="template-select" class="template-label">Apply Template:</label>
        <select 
          id="template-select" 
          v-model="selectedTemplate"
          class="template-select"
          @change="applyTemplate"
        >
          <option value="">-- Select Template --</option>
          <option v-for="template in templates" :key="template.id" :value="template.id">
            {{ template.name }} ({{ template.code }})
          </option>
        </select>
      </div>
      <button 
        v-if="hasActiveTemplate" 
        @click="revertToRegular"
        class="btn btn-warning"
      >
        <i class="fas fa-undo"></i> Revert to Regular
      </button>
    </div>

    <div class="schedule-header">
      <h3 class="date-display">
        Schedule for {{ formattedDate }} ({{ dayOfWeek }})
      </h3>
      <p v-if="hasActiveTemplate" class="template-info">
        Using Template: {{ activeTemplateName }} ({{ activeTemplateCode }})
      </p>
    </div>

    <div v-if="isDayOff" class="day-off-alert">
      <div class="day-off-content">
        <span class="day-off-title">{{ dayOffInfo.title }}</span>
        <span :class="['category-badge', `category-${dayOffInfo.category.replace(/\s+/g, '-')}`]">
          {{ dayOffInfo.category }}
        </span>
      </div>
    </div>

    <div v-else-if="isWeekend && !hasActiveTemplate" class="weekend-alert">
      Weekend - No Regular Classes
    </div>

    <div v-else class="daily-slots">
      <div 
        v-for="(slotInfo, index) in daySchedule" 
        :key="`slot-${index+1}`"
        class="slot-item"
      >
        <div class="slot-content">
          <div class="slot-header">
            <span class="slot-label">{{ getSlotLabel(index+1) }}:</span>
            <span class="class-title">{{ slotInfo.classTitle }}</span>
            <span class="class-code">({{ slotInfo.className }})</span>
          </div>

          <div v-if="slotInfo.details" class="slot-details">
            {{ slotInfo.details }}
          </div>

          <div v-if="slotInfo.textbook || slotInfo.pages" class="slot-textbook">
            <i class="fas fa-book"></i>
            <span v-if="slotInfo.textbook">{{ slotInfo.textbook }}</span>
            <span v-if="slotInfo.pages">(Pages: {{ slotInfo.pages }})</span>
          </div>
        </div>

        <button 
          @click="editSlot(index+1)" 
          class="edit-slot-btn"
          title="Edit details for this slot"
        >
          <i class="fas fa-edit"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex'
import { formatDate, parseDate } from '@/utils/dateHelpers'

export default {
  name: 'DailySchedulePanel',
  data() {
    return {
      selectedDate: formatDate(new Date()),
      selectedTemplate: ''
    }
  },
  computed: {
    ...mapState('schoolYear', ['schoolYear']),
    ...mapState('templates', ['templates']),
    ...mapState('daysOff', ['daysOff']),
    ...mapGetters('schedule', [
      'getScheduleForDate', 
      'getDaySchedule', 
      'getActiveTemplate'
    ]),
    
    formattedDate() {
      return this.selectedDate || ''
    },
    
    dateObj() {
      return this.selectedDate ? parseDate(this.selectedDate) : null
    },
    
    dayOfWeek() {
      if (!this.dateObj) return ''
      const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      return weekdays[this.dateObj.getDay()]
    },
    
    isWeekend() {
      if (!this.dateObj) return false
      const day = this.dateObj.getDay()
      return day === 0 || day === 6 // 0 = Sunday, 6 = Saturday
    },
    
    isDayOff() {
      return this.dayOffInfo !== null
    },
    
    dayOffInfo() {
      return this.daysOff[this.selectedDate] || null
    },
    
    daySchedule() {
      return this.getDaySchedule(this.selectedDate) || {}
    },
    
    hasActiveTemplate() {
      return this.activeTemplateInfo !== null
    },
    
    activeTemplateInfo() {
      return this.getActiveTemplate(this.selectedDate)
    },
    
    activeTemplateName() {
      return this.activeTemplateInfo ? this.activeTemplateInfo.name : ''
    },
    
    activeTemplateCode() {
      return this.activeTemplateInfo ? this.activeTemplateInfo.code : ''
    }
  },
  methods: {
    ...mapActions('schedule', ['applyTemplateToDate', 'removeTemplateFromDate']),
    ...mapActions('ui', ['openModal']),
    
    goToPreviousDay() {
      if (!this.dateObj) return
      
      const prevDate = new Date(this.dateObj)
      prevDate.setDate(prevDate.getDate() - 1)
      this.selectedDate = formatDate(prevDate)
    },
    
    goToNextDay() {
      if (!this.dateObj) return
      
      const nextDate = new Date(this.dateObj)
      nextDate.setDate(nextDate.getDate() + 1)
      this.selectedDate = formatDate(nextDate)
    },
    
    applyTemplate() {
      if (!this.selectedDate) return
      
      if (this.selectedTemplate) {
        this.applyTemplateToDate({
          date: this.selectedDate,
          templateId: this.selectedTemplate
        })
      } else {
        this.removeTemplateFromDate(this.selectedDate)
      }
    },
    
    revertToRegular() {
      if (!this.selectedDate) return
      this.removeTemplateFromDate(this.selectedDate)
      this.selectedTemplate = ''
    },
    
    editSlot(slotNumber) {
      if (!this.selectedDate) return
      
      this.$store.dispatch('ui/setExceptionEditData', {
        date: this.selectedDate,
        slotNumber
      })
      
      this.openModal('dailyException')
    },
    
    getSlotLabel(slotNumber) {
      // If template is active, get the template slot label
      if (this.activeTemplateInfo) {
        const templateSlot = this.activeTemplateInfo.slots[slotNumber]
        if (templateSlot) {
          if (templateSlot.type === 'period') {
            return `Slot ${slotNumber} (P${templateSlot.periodNumber})`
          } else {
            return `Slot ${slotNumber} (${templateSlot.eventName})`
          }
        }
        return `Slot ${slotNumber}`
      }
      
      // Default: regular period number
      return `Period ${slotNumber}`
    }
  },
  watch: {
    // Reset selected template when date changes
    selectedDate() {
      const templateInfo = this.getActiveTemplate(this.selectedDate)
      this.selectedTemplate = templateInfo ? templateInfo.id : ''
    }
  },
  mounted() {
    // Initialize the selected template if one is active
    const templateInfo = this.getActiveTemplate(this.selectedDate)
    if (templateInfo) {
      this.selectedTemplate = templateInfo.id
    }
  }
}
</script>

<style scoped>
.daily-schedule-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.date-navigation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.nav-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background-color: #e5e7eb;
  color: #374151;
  border: none;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.nav-btn:hover {
  background-color: #d1d5db;
}

.date-input {
  padding: 0.5rem 1rem;
  font-size: 1rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  text-align: center;
  width: 180px;
}

.template-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.template-selector {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.template-label {
  font-weight: 500;
  font-size: 0.875rem;
}

.template-select {
  padding: 0.375rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  min-width: 200px;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-warning {
  background-color: var(--warning);
  color: #713b00;
}

.btn-warning:hover {
  background-color: #f0b000;
}

.schedule-header {
  text-align: center;
  margin-bottom: 1rem;
}

.date-display {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 0.25rem;
}

.template-info {
  font-size: 0.875rem;
  color: #4f46e5;
  font-weight: 500;
  margin: 0;
}

.day-off-alert, .weekend-alert {
  background-color: #e0f2fe;
  color: #0c4a6e;
  border-radius: 0.5rem;
  padding: 1.5rem;
  text-align: center;
  font-weight: 500;
  margin-bottom: 1rem;
}

.weekend-alert {
  background-color: #f3f4f6;
  color: #4b5563;
}

.day-off-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.day-off-title {
  font-size: 1.125rem;
  font-weight: 600;
}

.category-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
}

.category-Holiday {
  background-color: #dbeafe;
  color: #1e40af;
}

.category-Study-at-home {
  background-color: #fef3c7;
  color: #92400e;
}

.category-School-Event {
  background-color: #d1fae5;
  color: #065f46;
}

.daily-slots {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  overflow-y: auto;
}

.slot-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  background-color: white;
}

.slot-content {
  flex-grow: 1;
}

.slot-header {
  margin-bottom: 0.5rem;
}

.slot-label {
  font-weight: 600;
  margin-right: 0.5rem;
}

.class-title {
  font-weight: 500;
}

.class-code {
  font-size: 0.875rem;
  color: #6b7280;
  margin-left: 0.5rem;
}

.slot-details {
  font-size: 0.875rem;
  color: #4b5563;
  margin-bottom: 0.5rem;
}

.slot-textbook {
  font-size: 0.875rem;
  color: #4f46e5;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.edit-slot-btn {
  color: #3b82f6;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  font-size: 1rem;
  margin-left: 0.5rem;
}

.edit-slot-btn:hover {
  color: #2563eb;
}
