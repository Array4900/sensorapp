<!--
  Admin Page - User and sensor management for administrators
-->
<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { isAuthenticated, isAdmin, user as currentUser } from '$lib/stores/auth';
    import { 
        getAllUsers, 
        getAllSensors, 
        getUserSensors, 
        deleteUser, 
        adminDeleteSensor,
        transferSensorOwnership,
        sendPushNotification,
        type User, 
        type Sensor 
    } from '$lib/api';

    // ============================================
    // STATE
    // ============================================
    
    let users: User[] = [];
    let allSensors: Sensor[] = [];
    let loading = true;
    let error = '';
    
    // Expanded user details
    let expandedUser: string | null = null;
    let userSensors: Record<string, Sensor[]> = {};
    let loadingUserData: string | null = null;
    
    // Active tab
    let activeTab: 'users' | 'sensors' = 'users';
    
    // Transfer state
    let transferringId: string | null = null;
    let pushTitle = '';
    let pushBody = '';
    let pushUrl = '/';
    let pushUsername = '';
    let sendingPush = false;
    let pushStatus = '';
    let pushError = '';
    
    // ============================================
    // LIFECYCLE
    // ============================================
    
    onMount(async () => {
        if (!$isAuthenticated) {
            goto('/login');
            return;
        }
        
        if (!$isAdmin) {
            goto('/');
            return;
        }
        
        await loadData();
    });
    
    // ============================================
    // FUNCTIONS
    // ============================================
    
    async function loadData() {
        loading = true;
        error = '';
        try {
            const [usersData, sensorsData] = await Promise.all([
                getAllUsers(),
                getAllSensors()
            ]);
            users = usersData;
            allSensors = sensorsData;
        } catch (e) {
            error = (e as Error).message || 'Nepodarilo sa načítať dáta';
        } finally {
            loading = false;
        }
    }
    
    async function toggleUserExpanded(username: string) {
        if (expandedUser === username) {
            expandedUser = null;
            return;
        }
        
        expandedUser = username;
        
        // Load user data if not cached
        if (!userSensors[username]) {
            loadingUserData = username;
            try {
                const sensors = await getUserSensors(username);
                userSensors[username] = sensors;
            } catch (e) {
                console.error('Failed to load user data:', e);
                userSensors[username] = [];
            } finally {
                loadingUserData = null;
            }
        }
    }
    
    async function handleDeleteUser(username: string) {
        if (username === $currentUser?.username) {
            alert('Nemôžete vymazať svoj vlastný účet!');
            return;
        }
        
        if (!confirm(`Naozaj chcete vymazať používateľa "${username}" a všetky jeho senzory a merania?`)) {
            return;
        }
        
        try {
            await deleteUser(username);
            users = users.filter(u => u.username !== username);
            allSensors = allSensors.filter(s => s.owner !== username);
            delete userSensors[username];
            if (expandedUser === username) {
                expandedUser = null;
            }
        } catch (e) {
            alert((e as Error).message || 'Nepodarilo sa vymazať používateľa');
        }
    }
    
    async function handleDeleteSensor(sensorId: string, owner: string) {
        if (!confirm('Naozaj chcete vymazať tento senzor a všetky jeho merania?')) {
            return;
        }
        
        try {
            await adminDeleteSensor(sensorId);
            allSensors = allSensors.filter(s => s._id !== sensorId);
            if (userSensors[owner]) {
                userSensors[owner] = userSensors[owner].filter(s => s._id !== sensorId);
            }
        } catch (e) {
            alert((e as Error).message || 'Nepodarilo sa vymazať senzor');
        }
    }
    
    async function handleTransferSensor(sensorId: string, oldOwner: string, newOwner: string) {
        if (!newOwner || newOwner === oldOwner) return;
        
        if (!confirm(`Naozaj chcete previesť senzor na používateľa "${newOwner}"? Lokácia bude zrušená a vygeneruje sa nový API kľúč.`)) {
            return;
        }
        
        transferringId = sensorId;
        try {
            const updatedSensor = await transferSensorOwnership(sensorId, newOwner);
            
            // Update allSensors list
            allSensors = allSensors.map(s => s._id === sensorId ? updatedSensor : s);
            
            // Update userSensors cache - remove from old owner, add to new owner
            if (userSensors[oldOwner]) {
                userSensors[oldOwner] = userSensors[oldOwner].filter(s => s._id !== sensorId);
            }
            if (userSensors[newOwner]) {
                userSensors[newOwner] = [...userSensors[newOwner], updatedSensor];
            }
            
            alert('Senzor bol úspešne prevedený');
        } catch (e) {
            alert((e as Error).message || 'Nepodarilo sa previesť senzor');
        } finally {
            transferringId = null;
        }
    }
    
    function formatDate(dateStr: string): string {
        return new Date(dateStr).toLocaleDateString('sk-SK');
    }
    
    function getSensorCountForUser(username: string): number {
        return allSensors.filter(s => s.owner === username).length;
    }

    async function handleSendPushNotification() {
        pushStatus = '';
        pushError = '';

        if (!pushTitle.trim() || !pushBody.trim()) {
            pushError = 'Nadpis a text notifikácie sú povinné.';
            return;
        }

        sendingPush = true;

        try {
            const result = await sendPushNotification({
                title: pushTitle.trim(),
                body: pushBody.trim(),
                url: pushUrl.trim() || '/',
                username: pushUsername.trim() || undefined
            });

            pushStatus = `Odoslané: ${result.delivered}, odstránené neplatné odbery: ${result.removed}.`;
        } catch (e) {
            pushError = (e as Error).message || 'Nepodarilo sa odoslať notifikáciu.';
        } finally {
            sendingPush = false;
        }
    }
    

</script>

<!-- ============================================ -->
<!-- STYLES                                      -->
<!-- ============================================ -->
<style>
    .admin-page {
        padding: var(--space-4);
        max-width: 1400px;
        margin: 0 auto;
    }
    
    .page-header {
        margin-bottom: var(--space-6);
    }
    
    .page-title {
        font-size: var(--font-size-2xl);
        font-weight: 700;
        color: var(--color-text-primary);
        margin-bottom: var(--space-2);
    }
    
    .page-subtitle {
        color: var(--color-text-secondary);
    }
    
    /* Tabs */
    .tabs {
        display: flex;
        gap: var(--space-2);
        margin-bottom: var(--space-6);
        border-bottom: 2px solid var(--color-border);
    }
    
    .tab {
        padding: var(--space-3) var(--space-6);
        background: none;
        border: none;
        font-size: var(--font-size-base);
        font-weight: 600;
        cursor: pointer;
        color: var(--color-text-secondary);
        border-bottom: 2px solid transparent;
        margin-bottom: -2px;
        transition: all var(--transition-fast);
    }
    
    .tab:hover {
        color: var(--color-primary);
    }
    
    .tab.active {
        color: var(--color-primary);
        border-bottom-color: var(--color-primary);
    }
    
    /* Stats Cards */
    .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: var(--space-4);
        margin-bottom: var(--space-6);
    }
    
    .stat-card {
        background: var(--color-bg-primary);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-lg);
        padding: var(--space-4);
        text-align: center;
    }
    
    .stat-value {
        font-size: var(--font-size-3xl);
        font-weight: 700;
        color: var(--color-primary);
    }
    
    .stat-label {
        color: var(--color-text-secondary);
        font-size: var(--font-size-sm);
    }
    
    /* Users List */
    .users-list {
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
    }
    
    .user-card {
        background: var(--color-bg-primary);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-lg);
        overflow: hidden;
    }
    
    .user-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--space-4);
        cursor: pointer;
        transition: background var(--transition-fast);
    }
    
    .user-header:hover {
        background: var(--color-bg-secondary);
    }
    
    .user-info {
        display: flex;
        align-items: center;
        gap: var(--space-4);
    }
    
    .user-avatar {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: var(--color-primary-light);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.5rem;
    }
    
    .user-details h3 {
        font-size: var(--font-size-lg);
        font-weight: 600;
        color: var(--color-text-primary);
        margin: 0;
    }
    
    .user-meta {
        display: flex;
        gap: var(--space-4);
        font-size: var(--font-size-sm);
        color: var(--color-text-secondary);
    }
    
    .user-role {
        padding: var(--space-1) var(--space-2);
        border-radius: var(--radius-full);
        font-size: var(--font-size-xs);
        font-weight: 600;
    }
    
    .role-admin {
        background: #fff3cd;
        color: #856404;
    }
    
    .role-user {
        background: #d4edda;
        color: #155724;
    }
    
    .user-actions {
        display: flex;
        gap: var(--space-2);
        align-items: center;
    }
    
    .btn {
        padding: var(--space-2) var(--space-4);
        border-radius: var(--radius-md);
        font-weight: 600;
        cursor: pointer;
        transition: all var(--transition-fast);
        border: none;
    }
    
    .btn-small {
        padding: var(--space-1) var(--space-2);
        font-size: var(--font-size-sm);
    }
    
    .btn-danger {
        background: var(--color-danger, #dc3545);
        color: white;
    }
    
    .btn-danger:hover {
        background: #c82333;
    }
    
    .btn-primary {
        background: var(--color-primary);
        color: white;
    }
    
    .expand-icon {
        transition: transform var(--transition-fast);
    }
    
    .expand-icon.expanded {
        transform: rotate(180deg);
    }
    
    /* User Data Expansion */
    .user-data {
        border-top: 1px solid var(--color-border);
        padding: var(--space-4);
        background: var(--color-bg-secondary);
    }
    
    .data-section {
        margin-bottom: var(--space-4);
    }
    
    .data-section:last-child {
        margin-bottom: 0;
    }
    
    .data-title {
        font-size: var(--font-size-base);
        font-weight: 600;
        margin-bottom: var(--space-3);
        color: var(--color-text-primary);
    }
    
    .data-table {
        width: 100%;
        border-collapse: collapse;
        background: var(--color-bg-primary);
        border-radius: var(--radius-md);
        overflow: hidden;
    }
    
    .data-table th,
    .data-table td {
        padding: var(--space-3);
        text-align: left;
        border-bottom: 1px solid var(--color-border);
    }
    
    .data-table th {
        background: var(--color-bg-tertiary);
        font-weight: 600;
        color: var(--color-text-secondary);
        font-size: var(--font-size-sm);
    }
    
    .no-data {
        text-align: center;
        padding: var(--space-4);
        color: var(--color-text-secondary);
    }
    
    /* All Data Tables */
    .section-container {
        background: var(--color-bg-primary);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-lg);
        overflow: hidden;
    }

    .notification-panel {
        background: var(--color-bg-primary);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-lg);
        padding: var(--space-4);
        margin-bottom: var(--space-6);
    }

    .notification-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: var(--space-3);
        margin-bottom: var(--space-3);
    }

    .notification-field {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
    }

    .notification-field input,
    .notification-field textarea {
        padding: var(--space-2) var(--space-3);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        font-size: var(--font-size-base);
    }

    .notification-field textarea {
        min-height: 110px;
        resize: vertical;
        grid-column: 1 / -1;
    }
    
    .section-header {
        padding: var(--space-4);
        border-bottom: 1px solid var(--color-border);
    }
    
    .section-title {
        font-size: var(--font-size-lg);
        font-weight: 600;
        color: var(--color-text-primary);
    }
    
    .all-data-table {
        width: 100%;
        border-collapse: collapse;
    }
    
    .all-data-table th,
    .all-data-table td {
        padding: var(--space-3) var(--space-4);
        text-align: left;
        border-bottom: 1px solid var(--color-border);
    }
    
    .all-data-table th {
        background: var(--color-bg-secondary);
        font-weight: 600;
        color: var(--color-text-secondary);
        font-size: var(--font-size-sm);
    }
    
    .sensor-status {
        padding: var(--space-1) var(--space-2);
        border-radius: var(--radius-full);
        font-size: var(--font-size-xs);
        font-weight: 600;
    }
    
    .status-active {
        background: #d4edda;
        color: #155724;
    }
    
    .status-inactive {
        background: #f8d7da;
        color: #721c24;
    }
    
    /* Transfer select */
    .transfer-select {
        padding: var(--space-1) var(--space-2);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        font-size: var(--font-size-sm);
        background: white;
        cursor: pointer;
        min-width: 120px;
    }
    
    .transfer-select:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
    
    .transferring {
        display: inline-block;
        margin-left: var(--space-2);
        font-size: var(--font-size-xs);
        color: var(--color-primary);
        animation: pulse 1s infinite;
    }
    
    @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
    }
    
    /* Loading & Error States */
    .loading-container, .error-container {
        text-align: center;
        padding: var(--space-12);
    }
    
    .loading-spinner {
        width: 40px;
        height: 40px;
        border: 3px solid var(--color-border);
        border-top-color: var(--color-primary);
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto var(--space-4);
    }
    
    .loading-small {
        width: 20px;
        height: 20px;
        border-width: 2px;
        display: inline-block;
        margin: 0;
    }
    
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
</style>

<!-- ============================================ -->
<!-- TEMPLATE                                    -->
<!-- ============================================ -->
<div class="admin-page">
    <div class="page-header">
        <h1 class="page-title">⚙️ Administrácia</h1>
        <p class="page-subtitle">Správa používateľov a senzorov</p>
    </div>
    
    {#if loading}
        <div class="loading-container">
            <div class="loading-spinner"></div>
            <p>Načítavam dáta...</p>
        </div>
    {:else if error}
        <div class="error-container">
            <p style="color: var(--color-danger);">{error}</p>
            <button class="btn btn-primary" on:click={loadData}>Skúsiť znova</button>
        </div>
    {:else}
        <!-- Stats -->
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-value">{users.length}</div>
                <div class="stat-label">Používatelia</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">{allSensors.length}</div>
                <div class="stat-label">Senzory</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">{allSensors.filter(s => s.isActive).length}</div>
                <div class="stat-label">Aktívne senzory</div>
            </div>
        </div>

        <div class="notification-panel">
            <div class="section-header" style="padding: 0 0 var(--space-4) 0; border-bottom: none;">
                <h2 class="section-title">🔔 Odoslať push notifikáciu</h2>
            </div>

            <div class="notification-grid">
                <div class="notification-field">
                    <label for="push-title">Nadpis</label>
                    <input id="push-title" bind:value={pushTitle} placeholder="Napr. Nové upozornenie" />
                </div>
                <div class="notification-field">
                    <label for="push-user">Používateľ</label>
                    <input id="push-user" bind:value={pushUsername} placeholder="Nechať prázdne pre všetkých" list="push-users" />
                    <datalist id="push-users">
                        {#each users as user (user._id)}
                            <option value={user.username}></option>
                        {/each}
                    </datalist>
                </div>
                <div class="notification-field">
                    <label for="push-url">URL po kliknutí</label>
                    <input id="push-url" bind:value={pushUrl} placeholder="/dashboard" />
                </div>
                <div class="notification-field">
                    <label for="push-body">Text správy</label>
                    <textarea id="push-body" bind:value={pushBody} placeholder="Sem zadajte obsah notifikácie"></textarea>
                </div>
            </div>

            {#if pushError}
                <p style="color: var(--color-danger); margin-bottom: var(--space-3);">{pushError}</p>
            {/if}

            {#if pushStatus}
                <p style="color: #155724; margin-bottom: var(--space-3);">{pushStatus}</p>
            {/if}

            <button class="btn btn-primary" on:click={handleSendPushNotification} disabled={sendingPush}>
                {sendingPush ? 'Odosielam...' : 'Odoslať notifikáciu'}
            </button>
        </div>
        
        <!-- Tabs -->
        <div class="tabs">
            <button 
                class="tab" 
                class:active={activeTab === 'users'}
                on:click={() => activeTab = 'users'}
            >
                👥 Používatelia ({users.length})
            </button>
            <button 
                class="tab" 
                class:active={activeTab === 'sensors'}
                on:click={() => activeTab = 'sensors'}
            >
                📡 Všetky senzory ({allSensors.length})
            </button>
        </div>
        
        <!-- Users Tab -->
        {#if activeTab === 'users'}
            <div class="users-list">
                {#each users as user (user._id)}
                    <div class="user-card">
                        <div class="user-header" role="button" tabindex="0" on:click={() => toggleUserExpanded(user.username)} on:keydown={(e) => e.key === 'Enter' && toggleUserExpanded(user.username)}>
                            <div class="user-info">
                                <div class="user-avatar">👤</div>
                                <div class="user-details">
                                    <h3>{user.username}</h3>
                                    <div class="user-meta">
                                        <span>📅 {formatDate(user.createdAt)}</span>
                                        <span>📡 {getSensorCountForUser(user.username)} senzorov</span>
                                    </div>
                                </div>
                            </div>
                            <div class="user-actions">
                                <span class="user-role" class:role-admin={user.role === 'ADMIN'} class:role-user={user.role === 'USER'}>
                                    {user.role === 'ADMIN' ? '👑 Admin' : '👤 Používateľ'}
                                </span>
                                <span class="expand-icon" class:expanded={expandedUser === user.username}>▼</span>
                                {#if user.username !== $currentUser?.username}
                                    <button 
                                        class="btn btn-small btn-danger" 
                                        on:click|stopPropagation={() => handleDeleteUser(user.username)}
                                    >
                                        🗑️
                                    </button>
                                {/if}
                            </div>
                        </div>
                        
                        {#if expandedUser === user.username}
                            <div class="user-data">
                                {#if loadingUserData === user.username}
                                    <div class="loading-spinner loading-small"></div>
                                {:else}
                                    <!-- User Sensors -->
                                    <div class="data-section">
                                        <h4 class="data-title">📡 Senzory používateľa</h4>
                                        {#if userSensors[user.username]?.length === 0}
                                            <div class="no-data">Používateľ nemá žiadne senzory</div>
                                        {:else if userSensors[user.username]}
                                            <table class="data-table">
                                                <thead>
                                                    <tr>
                                                        <th>Názov</th>
                                                        <th>Lokácia</th>
                                                        <th>Typ</th>
                                                        <th>Stav</th>
                                                        <th>Akcie</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {#each userSensors[user.username] as sensor (sensor._id)}
                                                        <tr>
                                                            <td>{sensor.name}</td>
                                                            <td>{sensor.type}</td>
                                                            <td>
                                                                <span class="sensor-status" class:status-active={sensor.isActive} class:status-inactive={!sensor.isActive}>
                                                                    {sensor.isActive ? 'Aktívny' : 'Neaktívny'}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                <button 
                                                                    class="btn btn-small btn-danger"
                                                                    on:click={() => handleDeleteSensor(sensor._id, user.username)}
                                                                >
                                                                    🗑️
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    {/each}
                                                </tbody>
                                            </table>
                                        {/if}
                                    </div>
                                {/if}
                            </div>
                        {/if}
                    </div>
                {/each}
            </div>
        {/if}
        
        <!-- Sensors Tab -->
        {#if activeTab === 'sensors'}
            <div class="section-container">
                <div class="section-header">
                    <h2 class="section-title">📡 Všetky senzory v systéme</h2>
                </div>
                
                {#if allSensors.length === 0}
                    <div class="no-data">V systéme nie sú žiadne senzory</div>
                {:else}
                    <table class="all-data-table">
                        <thead>
                            <tr>
                                <th>Názov</th>
                                <th>Vlastník</th>
                                <th>Lokácia</th>
                                <th>Typ</th>
                                <th>Stav</th>
                                <th>Vytvorené</th>
                                <th>Previesť na</th>
                                <th>Akcie</th>
                            </tr>
                        </thead>
                        <tbody>
                            {#each allSensors as sensor (sensor._id)}
                                <tr>
                                    <td>{sensor.name}</td>
                                    <td>{sensor.owner}</td>
                                    <td>{sensor.macAddress}</td>
                                    <td>{sensor.type}</td>
                                    <td>{sensor.lastMeasurement}</td>
                                    <td>
                                        <span class="sensor-status" class:status-active={sensor.isActive} class:status-inactive={!sensor.isActive}>
                                            {sensor.isActive ? 'Aktívny' : 'Neaktívny'}
                                        </span>
                                    </td>
                                    <td>{formatDate(sensor.createdAt)}</td>
                                    <td>
                                        <select 
                                            class="transfer-select"
                                            disabled={transferringId === sensor._id}
                                            on:change={(e) => {
                                                const target = e.currentTarget;
                                                const newOwner = target.value;
                                                if (newOwner) {
                                                    handleTransferSensor(sensor._id, sensor.owner, newOwner);
                                                    target.value = '';
                                                }
                                            }}
                                        >
                                            <option value="">-- Vybrať --</option>
                                            {#each users.filter(u => u.username !== sensor.owner) as u (u._id)}
                                                <option value={u.username}>{u.username}</option>
                                            {/each}
                                        </select>
                                        {#if transferringId === sensor._id}
                                            <span class="transferring">Prevádza sa...</span>
                                        {/if}
                                    </td>
                                    <td>
                                        <button 
                                            class="btn btn-small btn-danger"
                                            on:click={() => handleDeleteSensor(sensor._id, sensor.owner)}
                                        >
                                            🗑️ Vymazať
                                        </button>
                                    </td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                {/if}
            </div>
        {/if}
        
    {/if}
</div>
