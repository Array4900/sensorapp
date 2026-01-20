<script lang="ts">
  import '../../static/loginForm.css';
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
      await goto('/sensors');
    } catch (err) {
      localError = (err as Error)?.message || 'Prihlásenie zlyhalo';
    }
  }

  // Combine local and store errors
  $: displayError = localError || $authError || '';
</script>


<div class="login-page">
    <div class="left-panel">
        <div class="welcome">
            <h1>Vitajte v aplikácii sensorapp</h1>
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
                <label for="username">používateľské meno</label>
                <input
                        id="username"
                        name="username"
                        type="text"
                        bind:value={username}
                        autocomplete="username"
                />
            </div>

            <div class="field">
                <label for="password">heslo</label>
                <input
                        id="password"
                        name="password"
                        type="password"
                        bind:value={password}
                        autocomplete="current-password"
                />
            </div>

            <p>Nemáš účet? <a href="/register" on:click|preventDefault={() => goto('/register')}>zaregistruj sa</a></p>

            <button type="submit" class="submit-btn" disabled={$isLoading}>
                {$isLoading ? 'Prihlasovanie...' : 'Prihlásiť sa'}
            </button>
        </form>
    </div>
</div>
