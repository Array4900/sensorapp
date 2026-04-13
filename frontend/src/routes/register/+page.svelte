<script lang="ts">
  import { goto } from '$app/navigation';
  import { register, isLoading as authLoading } from '$lib/stores/auth';

  let username: string = '';
  let password: string = '';
  let confirm: string = '';

  let usernameError: string = '';
  let passwordError: string = '';
  let confirmError: string = '';
  let submitMessage: string = '';
  let isSuccess: boolean = false;

  function clearFieldError(field: 'username' | 'password' | 'confirm') {
    if (field === 'username') usernameError = '';
    if (field === 'password') passwordError = '';
    if (field === 'confirm') confirmError = '';
    submitMessage = '';
    isSuccess = false;
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
      isSuccess = false;
      return;
    }

    try {
      await register(username, password);
      isSuccess = true;
      submitMessage = 'Registrácia úspešná — čoskoro budete presmerovaní na prihlasovaciu stránku...';
      setTimeout(() => {
        goto('/login');
      }, 2000);
    } catch (err) {
      isSuccess = false;
      submitMessage = (err as Error)?.message || 'Registrácia zlyhala. Skúste to znova.';
    }
  }
</script>

<style>
  .register-page {
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

  .register-form {
    width: 100%;
    max-width: 400px;
    background: white;
    padding: 2.5rem;
    border-radius: 12px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  }

  .register-form h2 {
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

  .form-success {
    background: #f0fdf4;
    color: #16a34a;
    padding: 0.75rem 1rem;
    border-radius: 8px;
    margin-bottom: 1rem;
    font-size: 0.875rem;
    border: 1px solid #bbf7d0;
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

  .field-error {
    color: #dc2626;
    font-size: 0.8rem;
    margin-bottom: 0.25rem;
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

  .field input.invalid {
    border-color: #dc2626;
  }

  .register-form p {
    margin-bottom: 0.5rem;
    font-size: 0.875rem;
    color: var(--color-text-secondary, #6b7280);
  }

  .register-form a {
    color: var(--color-primary, #4361ee);
    text-decoration: none;
    font-weight: 600;
  }

  .register-form a:hover {
    text-decoration: underline;
  }

  .submit-btn {
    width: 100%;
    padding: 0.75rem;
    margin-top: 1rem;
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
    .register-page {
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

    .register-form {
      padding: 1.5rem;
    }
  }
</style>

<div class="register-page">
  <div class="left-panel">
    <div class="welcome">
      <h1>Vitajte v aplikácii SensorApp</h1>
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
        <label for="username">Používateľské meno</label>
        {#if usernameError}
          <div class="field-error">{usernameError}</div>
        {/if}
        <input
          id="username"
          name="username"
          type="text"
          bind:value={username}
          class:invalid={!!usernameError}
          on:input={() => clearFieldError('username')}
          minlength="4"
          maxlength="15"
          autocomplete="username"
        />
      </div>

      <div class="field">
        <label for="password">Heslo</label>
        {#if passwordError}
          <div class="field-error">{passwordError}</div>
        {/if}
        <input
          id="password"
          name="password"
          type="password"
          bind:value={password}
          class:invalid={!!passwordError}
          on:input={() => clearFieldError('password')}
          autocomplete="new-password"
        />
      </div>

      <div class="field">
        <label for="confirm">Potvrďte heslo</label>
        {#if confirmError}
          <div class="field-error">{confirmError}</div>
        {/if}
        <input
          id="confirm"
          name="confirm"
          type="password"
          bind:value={confirm}
          class:invalid={!!confirmError}
          on:input={() => clearFieldError('confirm')}
          autocomplete="new-password"
        />
      </div>

      <p>Už máš vytvorený účet? <a href="/login" on:click|preventDefault={() => goto('/login')}>Prihlás sa</a></p>

      <button type="submit" class="submit-btn" disabled={$authLoading}>
        {$authLoading ? 'Registrujem...' : 'Registrovať'}
      </button>

      {#if submitMessage && !(usernameError || passwordError || confirmError)}
        <div class:form-success={isSuccess} class:form-error={!isSuccess}>{submitMessage}</div>
      {/if}
    </form>
  </div>
</div>
