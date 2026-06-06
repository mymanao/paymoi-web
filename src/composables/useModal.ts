import { ref } from "vue";

export const modalOpen = ref(false);
export const modalTitle = ref("");
export const modalMessage = ref("");

export function showModal(message: string, title = "แจ้งเตือน"): Promise<void> {
  modalTitle.value = title;
  modalMessage.value = message;
  modalOpen.value = true;

  return new Promise((resolve) => {
    const close = () => {
      modalOpen.value = false;
      window.removeEventListener("modal-close", close);
      resolve();
    };

    window.addEventListener("modal-close", close);
  });
}

export function closeModal() {
  window.dispatchEvent(new Event("modal-close"));
}
