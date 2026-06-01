<script>
  import Clock from "./Clock.svelte";
</script>

<nav class="navbar">
  <div class="navbar-content">
    <div class="navbar-brand">
      <span class="icon">💪</span>
      <h1 class="title">FitFlow</h1>
    </div>
    <div class="navbar-time">
      <Clock />
    </div>
  </div>
</nav>

<style>
  .navbar {
    width: 100%;
    background: linear-gradient(135deg, var(--bg-primary) 0%, var(--color-primary) 100%);
    border-bottom: 2px solid var(--color-accent-primary);
    padding: var(--spacing-md) 0;
    box-shadow: var(--shadow-md);
    position: sticky;
    top: 0;
    z-index: 100;
  }

  .navbar-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 var(--spacing-md);
    max-width: 1200px;
    margin: 0 auto;
  }

  .navbar-brand {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    flex: 1;
  }

  .icon {
    font-size: var(--font-size-xl);
  }

  .title {
    font-size: var(--font-size-xl);
    margin: 0;
    background: linear-gradient(135deg, var(--color-accent-primary), var(--color-accent-secondary));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .navbar-time {
    color: var(--text-secondary);
    font-size: var(--font-size-sm);
    text-align: right;
  }

  @media (max-width: 640px) {
    .navbar-content {
      flex-direction: column;
      gap: var(--spacing-sm);
    }

    .navbar-brand {
      width: 100%;
    }

    .navbar-time {
      width: 100%;
    }

    .title {
      font-size: var(--font-size-lg);
    }

    .icon {
      font-size: var(--font-size-lg);
    }
  }
</style>
