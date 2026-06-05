<script setup lang="ts">
import {
  closeModal,
  modalMessage,
  modalOpen,
  modalTitle
} from "../composables/useModal.ts";
</script>

<template>
  <dialog
      class="modal"
      :class="{ 'modal-open': modalOpen }"
  >
    <div class="modal-box">
      <h3 class="font-bold text-lg text-center">
        {{ modalTitle }}
      </h3>

      <p class="py-4">
        {{ modalMessage }}
      </p>

      <div class="modal-action">
        <button
            class="btn btn-primary"
            @click="closeModal"
        >
          ตกลง
        </button>
      </div>
    </div>

    <form
        method="dialog"
        class="modal-backdrop"
    >
      <button @click.prevent="closeModal">
        close
      </button>
    </form>
  </dialog>
</template>