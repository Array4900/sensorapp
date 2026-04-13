<script lang="ts">
  import { goto } from '$app/navigation';
  import { login, isLoading, authError, clearError } from '$lib/stores/auth';

  let username = '';
  let password = '';
  let localError = '';

  async function submit(e: Event) {
    e.preventDefault();
    localError = '';
    clearError();
    
    try {
      await login(username, password);
      await goto('/dashboard');
    } catch (err) {
      localError = (err as Error)?.message || 'Prihlásenie zlyhalo';
    }
  }

  $: displayError = localError || $authError || '';
</script>

<style>
  .login-page {
    display: flex;
    min-height: 100vh;
    min-height: calc(100vh - var(--header-height, 64px));
  }

  .left-panel {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, var(--color-primary, #4361ee), var(--color-secondary, #3a0ca3));
    color: white;
    padding: 2rem;
  }

  .welcome h1 {
    font-size: 2rem;
    margin-bottom: 0.5rem;
  }

  .welcome p {
    font-size: 1.1rem;
    opacity: 0.9;
  }

  .right-panel {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    background: var(--color-bg-secondary, #f9fafb);
  }

  .login-form {
    width: 100%;
    max-width: 400px;
    background: white;
    padding: 2.5rem;
    border-radius: 12px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  }

  .login-form h2 {
    margin-bottom: 1.5rem;
    font-size: 1.5rem;
    color: var(--color-text-primary, #1f2937);
  }

  .form-error {
    background: #fef2f2;
    color: #dc2626;
    padding: 0.75rem 1rem;
    border-radius: 8px;
    margin-bottom: 1rem;
    font-size: 0.875rem;
    border: 1px solid #fecaca;
  }

  .field {
    margin-bottom: 1.25rem;
  }

  .field label {
    display: block;
    margin-bottom: 0.375rem;
    font-weight: 500;
    color: var(--color-text-secondary, #6b7280);
    font-size: 0.875rem;
  }

  .field input {
    width: 100%;
    padding: 0.75rem 1rem;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    font-size: 1rem;
    transition: border-color 0.2s;
    box-sizing: border-box;
  }

  .field input:focus {
    outline: none;
    border-color: var(--color-primary, #4361ee);
    box-shadow: 0 0 0 3px rgba(67, 97, 238, 0.1);
  }

  .login-form p {
    margin-bottom: 1.25rem;
    font-size: 0.875rem;
    color: var(--color-text-secondary, #6b7280);
  }

  .login-form a {
    color: var(--color-primary, #4361ee);
    text-decoration: none;
    font-weight: 600;
  }

  .login-form a:hover {
    text-decoration: underline;
  }

  .submit-btn {
    width: 100%;
    padding: 0.75rem;
    background: var(--color-primary, #4361ee);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
  }

  .submit-btn:hover:not(:disabled) {
    background: var(--color-secondary, #3a0ca3);
  }

  .submit-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  @media (max-width: 768px) {
    .login-page {
      flex-direction: column;
    }

    .left-panel {
      padding: 2rem 1.5rem;
      min-height: auto;
    }

    .welcome h1 {
      font-size: 1.5rem;
    }

    .right-panel {
      padding: 1.5rem;
    }

    .login-form {
      padding: 1.5rem;
    }
  }
</style>

<div class="login-page">
    <div class="left-panel">
        <div class="welcome">
            <h1>Vitajte v aplikácii SensorApp</h1>
            <p>Prihláste sa do aplikácie.</p>
        </div>
    </div>

    <div class="right-panel">
        <form class="login-form" on:submit={submit}>
            <h2>Prihlásenie</h2>

            {#if displayError}
                <div class="form-error">{displayError}</div>
            {/if}

            <div class="field">
                <label for="username">Používateľské meno</label>
                <input
                    id="username"
                    name="username"
                    type="text"
                    bind:value={username}
                    autocomplete="username"
                />
            </div>

            <div class="field">
                <label for="password">Heslo</label>
                <input
                    id="password"
                    name="password"
                    type="password"
                    bind:value={password}
                    autocomplete="current-password"
                />
            </div>

            <p>Nemáš účet? <a href="/register" on:click|preventDefault={() => goto('/register')}>Zaregistruj sa</a></p>

            <button type="submit" class="submit-btn" disabled={$isLoading}>
                {$isLoading ? 'Prihlasovanie...' : 'Prihlásiť sa'}
            </button>
        </form>
    </div>
</div>
