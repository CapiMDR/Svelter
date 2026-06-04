// @ts-nocheck
import { writable } from "svelte/store";

const initialState = {
  open: false,
  title: "Confirm",
  acceptText: "Accept",
  closeText: "Close",
  content: "",
  onAccept: null,
  onClose: null,
};

function createModalStore() {
  const { subscribe, set, update } = writable(initialState);

  return {
    subscribe,

    show(config) {
      set({
        ...initialState,
        open: true,
        ...config,
      });
    },

    close() {
      update((state) => {
        state.onClose?.();

        return initialState;
      });
    },

    accept() {
      update((state) => {
        state.onAccept?.();

        return initialState;
      });
    },
  };
}

export const modalStore = createModalStore();
