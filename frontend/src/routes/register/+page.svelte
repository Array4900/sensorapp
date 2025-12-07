<script lang="ts">
  import '../../static/registerForm.css';
  import { goto } from '$app/navigation';

  let username: string = '';
  let password: string = '';
  let confirm: string = '';

  let usernameError: string = '';
  let passwordError: string = '';
  let confirmError: string = '';
  let submitMessage: string = '';

  function clearError(field: 'username' | 'password' | 'confirm') {
    if (field === 'username') usernameError = '';
    if (field === 'password') passwordError = '';
    if (field === 'confirm') confirmError = '';
    submitMessage = '';
  }

  function validateUsername(val: string): string {
    if (!val) return 'Je potrebné zadať používateľské meno';
    if (val.length < 4) return 'Používateľské meno musí byť dlhšie ako 3 znaky';
    if (val.length > 15) return 'Používateľské meno nesmie byť dlhšie ako 15 znakov';
    if (!/^[A-Za-z0-9]+$/.test(val)) return 'Používateľské meno môže obsahovať len písmená a čísla';
    return '';
  }

  function validatePassword(val: string): string {
    if (!val) return 'Je potrebné zadať heslo';
    if (val.length <= 6) return 'Heslo musí byť dlhšie ako 6 znakov';
    // require at least one character that is not a-z or A-Z
    if (!/[^A-Za-z]/.test(val)) return 'Heslo musí obsahovať aspoň jeden špeciálny znak alebo číslo';
    return '';
  }

  async function handleSubmit(e: Event) {
    e.preventDefault();

    usernameError = validateUsername(username);
    passwordError = validatePassword(password);
    confirmError = password === confirm ? '' : 'Heslá sa nezhodujú';

    if (usernameError || passwordError || confirmError) {
      submitMessage = 'Prosím opravte chyby vo formulári pred odoslaním.';
      return;
    }

    submitMessage = 'Čoskoro budete presmerovaní na prihlasovaciu stránku...';

try {
      console.log(JSON.stringify({ username, password }));
      const res = await fetch('http://localhost:5000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => null);
        submitMessage = errBody?.message ?? 'Registrácia zlyhala. Skúste to znova.';
        return;
      }

      const data = await res.json().catch(() => null);
      console.log('server response', data);
      submitMessage = 'Registrácia úspešná — čoskoro budete presmerovaní na prihlasovaciu stránku...';
        setTimeout(() => {
            goto('/login');
        }, 2000);
    } catch (err) {
      console.error(err);
      submitMessage = 'Chyba pri komunikácii so serverom. Skúste znova neskôr.';
    }

    console.log({ username, password });
  }
</script>

<div class="register-page">
  <div class="left-panel">
    <div class="welcome">
      <h1>Vitajte v aplikácii sensorapp</h1>
      <p>Registrujte sa a začnite sledovať svoje senzory.</p>
    </div>
  </div>

  <div class="right-panel">
    <form class="register-form" on:submit|preventDefault={handleSubmit}>
      <h2>Registrácia</h2>

      {#if submitMessage && (usernameError || passwordError || confirmError)}
        <div class="form-error">{submitMessage}</div>
      {/if}

      <div class="field">
        <label for="username">používateľské meno</label>
        {#if usernameError}
          <div class="field-error">{usernameError}</div>
        {/if}
        <input
          id="username"
          name="username"
          type="text"
          bind:value={username}
          class:invalid={!!usernameError}
          on:input={() => clearError('username')}
          minlength="4"
          maxlength="15"
          autocomplete="username"
        />
      </div>

      <div class="field">
        <label for="password">heslo</label>
        {#if passwordError}
          <div class="field-error">{passwordError}</div>
        {/if}
        <input
          id="password"
          name="password"
          type="password"
          bind:value={password}
          class:invalid={!!passwordError}
          on:input={() => clearError('password')}
          autocomplete="new-password"
        />
      </div>

      <div class="field">
        <label for="confirm">potvrďte heslo</label>
        {#if confirmError}
          <div class="field-error">{confirmError}</div>
        {/if}
        <input
          id="confirm"
          name="confirm"
          type="password"
          bind:value={confirm}
          class:invalid={!!confirmError}
          on:input={() => clearError('confirm')}
          autocomplete="new-password"
        />
      </div>

        <p>Už máš vytvorený účet?</p>
        <a href="/login" on:click|preventDefault={() => goto('/login')}>prihlás sa</a>
      <button type="submit" class="submit-btn">Registrovať</button>

      {#if submitMessage && !(usernameError || passwordError || confirmError)}
        <div class="form-success">{submitMessage}</div>
      {/if}
    </form>
  </div>
</div>
