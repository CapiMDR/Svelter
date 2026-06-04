<script>
  import Toast from "./Toast.svelte";
  import { toastStore } from "../lib/stores/toastStore.js";
</script>

<div class="toast-container">
  {#each $toastStore as toast (toast.id)}
    <Toast {toast} onClose={toastStore.remove} />
  {/each}
</div>

<style>
  .toast-container {
    position: fixed;

    top: 6rem;
    left: 50%;

    transform: translateX(-50%);

    display: flex;
    flex-direction: column;

    gap: 0.75rem;

    z-index: 9999;
  }
</style>
