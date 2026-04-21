<script lang="ts">
    import { goto } from '$app/navigation';
    import { authToken, user, isAuthenticated, logout, isAdmin } from '$lib/stores/auth';
    import { changePassword } from '$lib/stores/auth';
    import { onMount } from 'svelte';
    import {
        getNotificationPermission,
        hasPushSubscription,
        isPushSupported,
        subscribeToPush,
        unsubscribeFromPush
    } from '$lib/push';

    let showPasswordDialog = false;
    let oldPassword = '';
    let newPassword = '';
    let confirmPassword = '';
    let passwordError = '';
    let passwordSuccess = '';
    let isChanging = false;
    let notificationsSupported = false;
    let notificationsEnabled = false;
    let notificationsBusy = false;
    let notificationMessage = '';
    let notificationError = '';
    let notificationPermission: NotificationPermission | 'unsupported' = 'unsupported';

    async function refreshPushState() {
        notificationsSupported = isPushSupported();
        notificationPermission = getNotificationPermission();

        if (!notificationsSupported) {
            notificationsEnabled = false;
            return;
        }

        notificationsEnabled = await hasPushSubscription();
    }

    onMount(async () => {
        if (!$isAuthenticated) {
            goto('/login');
            return;
        }

        await refreshPushState();
    });

    function handleLogout() {
        logout();
        goto('/');
    }

    async function handleChangePassword() {
        passwordError = '';
        passwordSuccess = '';

        // Validation
        if (!oldPassword || !newPassword || !confirmPassword) {
            passwordError = 'Prosím vyplňte všetky polia';
            return;
        }

        if (newPassword !== confirmPassword) {
            passwordError = 'Nové heslá sa nezhodujú';
            return;
        }

        if (newPassword.length <= 6) {
            passwordError = 'Heslo musí byť dlhšie ako 6 znakov';
            return;
        }

        if (!/[^A-Za-z]/.test(newPassword)) {
            passwordError = 'Heslo musí obsahovať aspoň jeden špeciálny znak alebo číslo';
            return;
        }

        isChanging = true;

        try {
            const result = await changePassword(oldPassword, newPassword);
            
            if (result.success) {
                passwordSuccess = 'Heslo bolo úspešne zmenené!';
                
                oldPassword = '';
                newPassword = '';
                confirmPassword = '';
                // zavri dialog okno po úspechu
                setTimeout(() => {
                    showPasswordDialog = false;
                    passwordSuccess = '';
                }, 2000);
            } else {
                passwordError = result.message || 'Zmena hesla zlyhala';
            }
        } catch (e) {
            passwordError = (e as Error).message || 'Chyba pri komunikácii so serverom';
        } finally {
            isChanging = false;
        }
    }

    function openPasswordDialog() {
        showPasswordDialog = true;
        passwordError = '';
        passwordSuccess = '';
    }

    function closePasswordDialog() {
        showPasswordDialog = false;
        oldPassword = '';
        newPassword = '';
        confirmPassword = '';
        passwordError = '';
        passwordSuccess = '';
    }

    async function handleEnableNotifications() {
        notificationMessage = '';
        notificationError = '';
        notificationsBusy = true;

        try {
            if (!$authToken) {
                throw new Error('Musíte byť prihlásený.');
            }

            await subscribeToPush($authToken);
            notificationMessage = 'Push notifikácie boli zapnuté.';
            await refreshPushState();
        } catch (error) {
            notificationError = (error as Error).message || 'Nepodarilo sa zapnúť push notifikácie.';
        } finally {
            notificationsBusy = false;
        }
    }

    async function handleDisableNotifications() {
        notificationMessage = '';
        notificationError = '';
        notificationsBusy = true;

        try {
            if (!$authToken) {
                throw new Error('Musíte byť prihlásený.');
            }

            await unsubscribeFromPush($authToken);
            notificationMessage = 'Push notifikácie boli vypnuté.';
            await refreshPushState();
        } catch (error) {
            notificationError = (error as Error).message || 'Nepodarilo sa vypnúť push notifikácie.';
        } finally {
            notificationsBusy = false;
        }
    }
</script>

<style>
    .profile-page {
        padding: var(--space-4);
        max-width: 800px;
        margin: 0 auto;
    }

    .page-title {
        font-size: var(--font-size-2xl);
        font-weight: 700;
        color: var(--color-text-primary);
        margin-bottom: var(--space-6);
    }

    .profile-card {
        background: var(--color-bg-primary);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-lg);
        padding: var(--space-6);
        margin-bottom: var(--space-6);
    }

    .profile-header {
        display: flex;
        align-items: center;
        gap: var(--space-4);
        margin-bottom: var(--space-6);
    }

    .profile-avatar {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        background: var(--color-primary-light);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 2.5rem;
    }

    .profile-name {
        font-size: var(--font-size-xl);
        font-weight: 700;
        color: var(--color-text-primary);
    }

    .profile-role {
        padding: var(--space-1) var(--space-3);
        border-radius: var(--radius-full);
        font-size: var(--font-size-sm);
        font-weight: 600;
        display: inline-block;
        margin-top: var(--space-2);
    }

    .role-admin {
        background: #fff3cd;
        color: #856404;
    }

    .role-user {
        background: #d4edda;
        color: #155724;
    }

    .profile-info {
        display: grid;
        gap: var(--space-4);
    }

    .info-row {
        display: flex;
        gap: var(--space-4);
        padding: var(--space-3);
        background: var(--color-bg-secondary);
        border-radius: var(--radius-md);
    }

    .info-label {
        color: var(--color-text-secondary);
        min-width: 150px;
        font-weight: 500;
    }

    .info-value {
        color: var(--color-text-primary);
    }

    .actions-section {
        display: flex;
        gap: var(--space-4);
        flex-wrap: wrap;
    }

    .notification-status {
        display: grid;
        gap: var(--space-3);
    }

    .notification-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: var(--space-4);
        padding: var(--space-3);
        background: var(--color-bg-secondary);
        border-radius: var(--radius-md);
    }

    .notification-actions {
        display: flex;
        gap: var(--space-2);
        flex-wrap: wrap;
    }

    .btn {
        padding: var(--space-3) var(--space-6);
        border-radius: var(--radius-md);
        font-weight: 600;
        cursor: pointer;
        transition: all var(--transition-fast);
        border: none;
    }

    .btn-primary {
        background: var(--color-primary);
        color: white;
    }

    .btn-primary:hover {
        background: var(--color-primary-dark);
    }

    .btn-danger {
        background: var(--color-danger, #dc3545);
        color: white;
    }

    .btn-danger:hover {
        background: #c82333;
    }

    .login-prompt {
        text-align: center;
        padding: var(--space-12);
    }

    .login-prompt h2 {
        margin-bottom: var(--space-4);
    }

    /* Password Dialog */
    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    }

    .modal-backdrop {
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, 0.5);
        border: none;
        padding: 0;
        cursor: pointer;
    }

    .modal-dialog {
        position: relative;
        z-index: 1;
        background: var(--color-bg-primary);
        border-radius: var(--radius-lg);
        padding: var(--space-6);
        max-width: 400px;
        width: 90%;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    }

    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--space-4);
    }

    .modal-title {
        font-size: var(--font-size-lg);
        font-weight: 700;
        color: var(--color-text-primary);
    }

    .modal-close {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: var(--color-text-secondary);
    }

    .modal-close:hover {
        color: var(--color-text-primary);
    }

    .field {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
        margin-bottom: var(--space-4);
    }

    .field label {
        font-weight: 500;
        color: var(--color-text-primary);
    }

    .field input {
        padding: var(--space-2) var(--space-3);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        font-size: var(--font-size-base);
    }

    .field input:focus {
        outline: none;
        border-color: var(--color-primary);
        box-shadow: 0 0 0 2px var(--color-primary-light);
    }

    .error-message {
        color: var(--color-danger, #dc3545);
        font-size: var(--font-size-sm);
        margin-bottom: var(--space-4);
    }

    .success-message {
        color: #155724;
        background: #d4edda;
        padding: var(--space-2) var(--space-3);
        border-radius: var(--radius-md);
        font-size: var(--font-size-sm);
        margin-bottom: var(--space-4);
    }

    .modal-actions {
        display: flex;
        gap: var(--space-2);
        justify-content: flex-end;
    }

    .btn-secondary {
        background: var(--color-bg-secondary);
        color: var(--color-text-primary);
        border: 1px solid var(--color-border);
    }

    .btn-secondary:hover {
        background: var(--color-border);
    }
</style>

<div class="profile-page">
    <h1 class="page-title">👤 Profil</h1>

    {#if $user}
        <div class="profile-card">
            <div class="profile-header">
                <div class="profile-avatar">👤</div>
                <div>
                    <div class="profile-name">{$user.username}</div>
                    <span class="profile-role" class:role-admin={$isAdmin} class:role-user={!$isAdmin}>
                        {$isAdmin ? '👑 Administrátor' : '👤 Používateľ'}
                    </span>
                </div>
            </div>

            <div class="profile-info">
                <div class="info-row">
                    <span class="info-label">Používateľské meno</span>
                    <span class="info-value">{$user.username}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Rola</span>
                    <span class="info-value">{$user.role === 'ADMIN' ? 'Administrátor' : 'Používateľ'}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Stav</span>
                    <span class="info-value">✅ Prihlásený</span>
                </div>
            </div>
        </div>

        <div class="profile-card">
            <h2 class="page-title">🔔 Notifikácie</h2>

            <div class="notification-status">
                <div class="notification-row">
                    <span class="info-label">Podpora prehliadača</span>
                    <span class="info-value">{notificationsSupported ? 'Áno' : 'Nie'}</span>
                </div>
                <div class="notification-row">
                    <span class="info-label">Povolenie</span>
                    <span class="info-value">{notificationPermission}</span>
                </div>
                <div class="notification-row">
                    <span class="info-label">Aktívne odberné zariadenie</span>
                    <span class="info-value">{notificationsEnabled ? 'Áno' : 'Nie'}</span>
                </div>
            </div>

            {#if notificationError}
                <div class="error-message">{notificationError}</div>
            {/if}

            {#if notificationMessage}
                <div class="success-message">{notificationMessage}</div>
            {/if}

            <div class="notification-actions">
                <button class="btn btn-primary" on:click={handleEnableNotifications} disabled={!notificationsSupported || notificationsBusy}>
                    {notificationsBusy ? 'Spracovávam...' : 'Zapnúť push notifikácie'}
                </button>
                <button class="btn btn-secondary" on:click={handleDisableNotifications} disabled={!notificationsSupported || notificationsBusy || !notificationsEnabled}>
                    Vypnúť push notifikácie
                </button>
            </div>
        </div>

        <div class="actions-section">
            <button class="btn btn-primary" on:click={() => goto('/sensors')}>
                📡 Moje senzory
            </button>
            <button class="btn btn-primary" on:click={() => goto('/dashboard')}>
                📊 Dashboard
            </button>
            <button class="btn btn-primary" on:click={openPasswordDialog}>
                🔐 Zmeniť heslo
            </button>
            {#if $isAdmin}
                <button class="btn btn-primary" on:click={() => goto('/admin')}>
                    ⚙️ Administrácia
                </button>
            {/if}
            <button class="btn btn-danger" on:click={handleLogout}>
                🚪 Odhlásiť sa
            </button>
        </div>
    {:else}
        <div class="login-prompt">
            <h2>Musíš sa prihlásiť</h2>
            <p>Prosím prihlás sa do svojho profilu.</p>
            <button class="btn btn-primary" on:click={() => goto('/login')}>
                Prihlásiť sa
            </button>
        </div>
    {/if}
</div>

<!-- Change Password Dialog-->
{#if showPasswordDialog}
    <div class="modal-overlay">
        <button type="button" class="modal-backdrop" on:click={closePasswordDialog} aria-label="Zavrieť dialóg"></button>
        <div class="modal-dialog" role="dialog" aria-modal="true" aria-labelledby="change-password-title">
            <div class="modal-header">
                <h2 class="modal-title" id="change-password-title">🔐 Zmeniť heslo</h2>
                <button class="modal-close" on:click={closePasswordDialog}>✕</button>
            </div>

            {#if passwordError}
                <div class="error-message">{passwordError}</div>
            {/if}

            {#if passwordSuccess}
                <div class="success-message">{passwordSuccess}</div>
            {/if}

            <form on:submit|preventDefault={handleChangePassword}>
                <div class="field">
                    <label for="oldPassword">Staré heslo</label>
                    <input
                        id="oldPassword"
                        type="password"
                        bind:value={oldPassword}
                        placeholder="Zadajte staré heslo"
                        disabled={isChanging}
                    />
                </div>

                <div class="field">
                    <label for="newPassword">Nové heslo</label>
                    <input
                        id="newPassword"
                        type="password"
                        bind:value={newPassword}
                        placeholder="Zadajte nové heslo"
                        disabled={isChanging}
                    />
                </div>

                <div class="field">
                    <label for="confirmPassword">Potvrďte nové heslo</label>
                    <input
                        id="confirmPassword"
                        type="password"
                        bind:value={confirmPassword}
                        placeholder="Potvrďte nové heslo"
                        disabled={isChanging}
                    />
                </div>

                <div class="modal-actions">
                    <button
                        type="button"
                        class="btn btn-secondary"
                        on:click={closePasswordDialog}
                        disabled={isChanging}
                    >
                        Zrušiť
                    </button>
                    <button
                        type="submit"
                        class="btn btn-primary"
                        disabled={isChanging}
                    >
                        {isChanging ? 'Mením heslo...' : 'Zmeniť heslo'}
                    </button>
                </div>
            </form>
        </div>
    </div>
{/if}