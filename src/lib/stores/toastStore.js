// @ts-nocheck
import { writable } from "svelte/store";

const DEDUPED_TYPES = ["info", "warning"];

function createToastStore() {
  const { subscribe, update } = writable([]);

  function add(message, type = "info", duration = 3000) {
    const id = crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;

    let added = false;

    update((toasts) => {
      const shouldDedupe = DEDUPED_TYPES.includes(type);

      if (shouldDedupe) {
        const duplicate = toasts.some((toast) => toast.message === message && toast.type === type);

        if (duplicate) {
          return toasts;
        }
      }

      added = true;

      return [
        ...toasts,
        {
          id,
          message,
          type,
          duration,
        },
      ];
    });

    if (added) {
      setTimeout(() => remove(id), duration);
    }

    return added ? id : null;
  }

  function remove(id) {
    update((toasts) => toasts.filter((toast) => toast.id !== id));
  }

  return {
    subscribe,

    add,

    remove,

    success(message, duration = 3000) {
      add(message, "success", duration);
    },

    error(message, duration = 3000) {
      add(message, "error", duration);
    },

    warning(message, duration = 3000) {
      add(message, "warning", duration);
    },

    info(message, duration = 3000) {
      add(message, "info", duration);
    },
  };
}

export const toastStore = createToastStore();
