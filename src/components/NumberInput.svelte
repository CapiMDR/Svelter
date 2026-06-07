<script>
  let { value = $bindable(), integerOnly = false, min = 1, max = 100, step = 1, label = "", onchange = () => {} } = $props();

  function increment() {
    value = Math.min(max, Number(value) + step);
    onchange(value);
  }

  function decrement() {
    value = Math.max(min, Number(value) - step);
    onchange(value);
  }

  function handleInput() {
    if (integerOnly) {
      value = parseInt(value, 10) || 0;
    }
    onchange(Number(value));
  }
</script>

<div class="form-group">
  {#if label}
    <label for="value">{label}</label>
  {/if}

  <div class="number-input">
    <button type="button" class="step-btn" onclick={decrement} aria-label="Decrease"> − </button>

    <input id="value" bind:value type="number" {min} {max} {step} oninput={handleInput} />

    <button type="button" class="step-btn" onclick={increment} aria-label="Increase"> + </button>
  </div>
</div>

<style>
  label {
    font-size: var(--font-size-sm);
    font-weight: 600;
    color: var(--text-primary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .number-input {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .number-input input {
    width: 80px;
    text-align: center;
  }

  .step-btn {
    width: 36px;
    height: 36px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 1.2rem;
    font-weight: bold;
  }
</style>
