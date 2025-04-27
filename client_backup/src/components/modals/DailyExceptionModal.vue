<template>
  <div class="DailyExceptionModal" v-if="isVisible">
    <div class="modal-content">
      <h2>DailyExceptionModal</h2>
      <p>This modal is under development</p>
      <button @click="closeModal">Close</button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'DailyExceptionModal',
  data() {
    return {
      isVisible: false
    }
  },
  methods: {
    closeModal() {
      this.isVisible = false
    }
  }
}
</script>
