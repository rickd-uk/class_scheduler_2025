<template>
  <div v-if="show" class="modal-overlay" @click="close">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>Class Note</h3>
        <button @click="close" class="close-btn">&times;</button>
      </div>
      <div class="modal-body">
        <textarea
          v-model="localNote"
          placeholder="Add a note for this class..."
          @keydown.esc="close"
          ref="textarea"
          rows="10"
        ></textarea>
      </div>
      <div class="modal-footer">
        <button @click="save" class="btn-save">Save</button>
        <button @click="close" class="btn-cancel">Cancel</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "ClassNoteModal",
  props: {
    show: {
      type: Boolean,
      required: true,
    },
    note: {
      type: String,
      default: "",
    },
  },
  data() {
    return {
      localNote: this.note,
    };
  },
  watch: {
    note(newVal) {
      this.localNote = newVal;
    },
    show(newVal) {
      if (newVal) {
        // Reset localNote to the current note prop value when modal opens
        this.localNote = this.note;
        this.$nextTick(() => {
          this.$refs.textarea?.focus();
        });
      }
    },
  },
  methods: {
    close() {
      this.$emit("close");
    },
    save() {
      this.$emit("save", this.localNote);
    },
  },
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 800px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 28px;
  line-height: 1;
  cursor: pointer;
  color: #6b7280;
  padding: 0;
  width: 32px;
  height: 32px;
}

.close-btn:hover {
  color: #374151;
}

.modal-body {
  padding: 20px;
}

.modal-body textarea {
  width: 100%;
  min-height: 200px;
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-family: inherit;
  font-size: 15px;
  resize: none;
  line-height: 1.6;
}

.modal-body textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 20px;
  border-top: 1px solid #e5e7eb;
}

.modal-footer button {
  padding: 10px 20px;
  border-radius: 4px;
  border: none;
  font-size: 14px;
  cursor: pointer;
  font-weight: 500;
}

.btn-save {
  background: #3b82f6;
  color: white;
}

.btn-save:hover {
  background: #2563eb;
}

.btn-cancel {
  background: #f3f4f6;
  color: #374151;
}

.btn-cancel:hover {
  background: #e5e7eb;
}
</style>
