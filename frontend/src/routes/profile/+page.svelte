<script lang="ts">
    import { goto } from '$app/navigation';
    import { user, isAuthenticated, logout, isAdmin } from '$lib/stores/auth';
    import { onMount } from 'svelte';

    onMount(() => {
        if (!$isAuthenticated) {
            goto('/login');
        }
    });

    function handleLogout() {
        logout();
        goto('/');
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

        <div class="actions-section">
            <button class="btn btn-primary" on:click={() => goto('/sensors')}>
                📡 Moje senzory
            </button>
            <button class="btn btn-primary" on:click={() => goto('/dashboard')}>
                📊 Dashboard
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