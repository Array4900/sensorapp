<script lang="ts">
  import '../../static/loginForm.css';
  import { goto } from '$app/navigation';
  let username = '';
  let password = '';
  let error = '';
  let loading = false;

  async function submit(e: Event) {
    e.preventDefault();
    error = '';
    loading = true;
    try {
      const res = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ message: 'Login failed' }));
        error = data?.message || `Login failed: ${res.status}`;
        loading = false;
        return;
      }
      await goto('/profile');
    } catch (err) {
      error = (err as Error)?.message || 'Network error';
    } finally {
      loading = false;
    }
  }
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

            {#if error}
                <div class="form-error">{error}</div>
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

            <button type="submit" class="submit-btn" disabled={loading}>
                {loading ? 'Prihlasovanie...' : 'Prihlásiť sa'}
            </button>
        </form>
    </div>
</div>
