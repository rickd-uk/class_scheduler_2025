<template>
  <div class="templates-panel">
    <div class="panel-header">
      <h2 class="panel-title">Irregular Schedule Templates</h2>
      <button @click="createTemplate" class="btn btn-primary">
        <i class="fas fa-plus"></i> Create Template
      </button>
    </div>

    <div v-if="templates.length === 0" class="empty-state">
      <p>No templates defined yet. Create a template to define custom schedules for special days.</p>
    </div>

    <div v-else class="templates-list">
      <div 
        v-for="template in templates" 
        :key="template.id"
        class="template-card"
      >
        <div class="template-header">
          <h3 class="template-code">{{ template.code }}</h3>
          <div class="template-actions">
            <button @click="editTemplate(template)" class="action-btn edit-btn" title="Edit template">
              <i class="fas fa-edit"></i>
            </button>
            <button @click="confirmDeleteTemplate(template)" class="action-btn delete-btn" title="Delete template">
              <i class="fas fa-trash-alt"></i>
            </button>
          </div>
        </div>

        <p class="template-name">{{ template.name }}</p>

        <div class="template-slots-preview">
          <span 
            v-for="(slot, index) in template.slots" 
            :key="`slot-${index}`"
            class="slot-preview"
          >
            S{{ index }}: {{ formatSlotPreview(slot) }}
          </span>
        </div>
      </div>
    </div>

    <!-- Confirmation Modal for Delete -->
    <modal 
      v-if="showDeleteConfirmation" 
      @close="showDeleteConfirmation = false"
      title="Confirm Delete"
    >
      <div class="confirmation-modal">
        <p>Are you sure you want to delete the template "{{ templateToDelete?.name }}" ({{ templateToDelete?.code }})?</p>
        <p class="warning">This action cannot be undone.</p>
        <div class="confirmation-actions">
          <button @click="showDeleteConfirmation = false" class="btn btn-secondary">
            Cancel
          </button>
          <button @click="deleteTemplate" class="btn btn-danger">
            Delete Template
          </button>
        </div>
      </div>
    </modal>
  </div>
</template>

<script>
import { mapState, mapActions } from 'vuex'
import Modal from '@/components/common/Modal.vue'

export default {
  name: 'TemplatesPanel',
  components: {
    Modal
  },
  data() {
    return {
      showDeleteConfirmation: false,
      templateToDelete: null
    }
  },
  computed: {
    ...mapState('templates', ['templates'])
  },
  methods: {
    ...mapActions('templates', ['deleteTemplate']),
    ...mapActions('ui', ['openModal', 'setTemplateEditData']),
    
    createTemplate() {
      this.setTemplateEditData(null) // No template to edit, creating new
      this.openModal('templateEditor')
    },
    
    editTemplate(template) {
      this.setTemplateEditData(template)
      this.openModal('templateEditor')
    },
    
    confirmDeleteTemplate(template) {
      this.templateToDelete = template
      this.showDeleteConfirmation = true
    },
    
    deleteTemplate() {
      if (this.templateToDelete) {
        this.deleteTemplate(this.templateToDelete.id)
          .then(() => {
            this.showDeleteConfirmation = false
            this.templateToDelete = null
          })
      }
    },
    
    formatSlotPreview(slot) {
      if (slot.type === 'period') {
        return `P${slot.periodNumber}`
      } else {
        return slot.eventName
      }
    }
  }
}
</script>

<style scoped>
.templates-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.panel-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--dark);
  margin: 0;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: var(--secondary);
  font-size: 0.925rem;
}

.templates-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
  overflow-y: auto;
}

.template-card {
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  padding: 1rem;
  background-color: #f9fafb;
  transition: transform 0.15s ease;
}

.template-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.template-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.template-code {
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
}

.template-actions {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.875rem;
  padding: 0.25rem;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.action-btn:hover {
  opacity: 1;
}

.edit-btn {
  color: #3b82f6;
}

.delete-btn {
  color: #ef4444;
}

.template-name {
  margin: 0 0 0.75rem;
  font-size: 0.925rem;
  color: var(--secondary);
}

.template-slots-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.slot-preview {
  display: inline-block;
  border: 1px solid #e5e7eb;
  background-color: #f3f4f6;
  border-radius: 0.25rem;
  padding: 0.1rem 0.4rem;
  font-size: 0.75rem;
  color: #4b5563;
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

.btn-primary {
  background-color: var(--primary);
  color: white;
}

.btn-primary:hover {
  background-color: var(--primary-dark);
}

.btn-secondary {
  background-color: #e5e7eb;
  color: #374151;
}

.btn-secondary:hover {
  background-color: #d1d5db;
}

.btn-danger {
  background-color: var(--danger);
  color: white;
}

.btn-danger:hover {
  background-color: #b91c1c;
}

.confirmation-modal {
  padding: 1rem;
}

.warning {
  color: var(--danger);
  font-size: 0.875rem;
  margin-bottom: 1.5rem;
}

.confirmation-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
}
</style>
