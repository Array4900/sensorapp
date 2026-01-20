<!--
  Sensors Page - View and manage sensors
  Users can view their sensors, see API keys, and add new sensors
-->
<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { isAuthenticated, user } from '$lib/stores/auth';
    import { getSensors, createSensor, deleteSensor, type Sensor, type CreateSensorData } from '$lib/api';

    // ============================================
    // STATE
    // ============================================
    
    let sensors: Sensor[] = [];
    let loading = true;
    let error = '';
    
    // Add sensor form state
    let showAddForm = false;
    let newSensor: CreateSensorData = { name: '', location: '', type: '' };
    let addError = '';
    let adding = false;
    
    // API key visibility
    let visibleApiKeys: Set<string> = new Set();
    
    // ============================================
    // LIFECYCLE
    // ============================================
    
    onMount(async () => {
        // Redirect if not authenticated
        if (!$isAuthenticated) {
            goto('/login');
            return;
        }
        
        await loadSensors();
    });
    
    // ============================================
    // FUNCTIONS
    // ============================================
    
    async function loadSensors() {
        loading = true;
        error = '';
        try {
            sensors = await getSensors();
        } catch (e) {
            error = (e as Error).message || 'Nepodarilo sa načítať senzory';
        } finally {
            loading = false;
        }
    }
    
    async function handleAddSensor(e: Event) {
        e.preventDefault();
        addError = '';
        adding = true;
        
        try {
            const sensor = await createSensor(newSensor);
            sensors = [sensor, ...sensors];
            newSensor = { name: '', location: '', type: '' };
            showAddForm = false;
        } catch (e) {
            addError = (e as Error).message || 'Nepodarilo sa vytvoriť senzor';
        } finally {
            adding = false;
        }
    }
    
    async function handleDeleteSensor(id: string) {
        if (!confirm('Naozaj chcete vymazať tento senzor a všetky jeho merania?')) {
            return;
        }
        
        try {
            await deleteSensor(id);
            sensors = sensors.filter(s => s._id !== id);
        } catch (e) {
            error = (e as Error).message || 'Nepodarilo sa vymazať senzor';
        }
    }
    
    function toggleApiKeyVisibility(id: string) {
        if (visibleApiKeys.has(id)) {
            visibleApiKeys.delete(id);
        } else {
            visibleApiKeys.add(id);
        }
        visibleApiKeys = visibleApiKeys; // Trigger reactivity
    }
    
    function copyApiKey(apiKey: string) {
        navigator.clipboard.writeText(apiKey);
        // Could add a toast notification here
    }
</script>

<!-- ============================================ -->
<!-- STYLES                                      -->
<!-- ============================================ -->
<style>
    .sensors-page {
        padding: var(--space-4);
        max-width: 1200px;
        margin: 0 auto;
    }
    
    .page-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--space-6);
        flex-wrap: wrap;
        gap: var(--space-4);
    }
    
    .page-title {
        font-size: var(--font-size-2xl);
        font-weight: 700;
        color: var(--color-text-primary);
    }
    
    .btn {
        padding: var(--space-2) var(--space-4);
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
    
    .btn-secondary {
        background: var(--color-bg-secondary);
        color: var(--color-text-primary);
        border: 1px solid var(--color-border);
    }
    
    .btn-small {
        padding: var(--space-1) var(--space-2);
        font-size: var(--font-size-sm);
    }
    
    /* Add Sensor Form */
    .add-form-container {
        background: var(--color-bg-primary);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-lg);
        padding: var(--space-6);
        margin-bottom: var(--space-6);
    }
    
    .add-form {
        display: grid;
        gap: var(--space-4);
    }
    
    .form-row {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: var(--space-4);
    }
    
    .field {
        display: flex;
        flex-direction: column;
        gap: var(--space-1);
    }
    
    .field label {
        font-weight: 500;
        color: var(--color-text-secondary);
    }
    
    .field input, .field select {
        padding: var(--space-2) var(--space-3);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        font-size: var(--font-size-base);
    }
    
    .form-actions {
        display: flex;
        gap: var(--space-2);
        justify-content: flex-end;
    }
    
    .form-error {
        color: var(--color-danger, #dc3545);
        font-size: var(--font-size-sm);
    }
    
    /* Sensors Grid */
    .sensors-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
        gap: var(--space-4);
    }
    
    .sensor-card {
        background: var(--color-bg-primary);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-lg);
        padding: var(--space-4);
        transition: box-shadow var(--transition-fast);
    }
    
    .sensor-card:hover {
        box-shadow: var(--shadow-md);
    }
    
    .sensor-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: var(--space-3);
    }
    
    .sensor-name {
        font-size: var(--font-size-lg);
        font-weight: 600;
        color: var(--color-text-primary);
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
    
    .sensor-info {
        display: grid;
        gap: var(--space-2);
        margin-bottom: var(--space-4);
    }
    
    .info-row {
        display: flex;
        gap: var(--space-2);
    }
    
    .info-label {
        color: var(--color-text-secondary);
        font-size: var(--font-size-sm);
        min-width: 80px;
    }
    
    .info-value {
        color: var(--color-text-primary);
        font-size: var(--font-size-sm);
    }
    
    .api-key-section {
        background: var(--color-bg-secondary);
        padding: var(--space-3);
        border-radius: var(--radius-md);
        margin-bottom: var(--space-4);
    }
    
    .api-key-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--space-2);
    }
    
    .api-key-label {
        font-size: var(--font-size-sm);
        font-weight: 600;
        color: var(--color-text-secondary);
    }
    
    .api-key-value {
        font-family: monospace;
        font-size: var(--font-size-sm);
        word-break: break-all;
        background: var(--color-bg-primary);
        padding: var(--space-2);
        border-radius: var(--radius-sm);
    }
    
    .api-key-hidden {
        color: var(--color-text-muted);
    }
    
    .api-key-actions {
        display: flex;
        gap: var(--space-2);
    }
    
    .sensor-actions {
        display: flex;
        gap: var(--space-2);
        justify-content: flex-end;
    }
    
    /* Loading & Error States */
    .loading-container, .error-container, .empty-state {
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
    
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
    
    .empty-icon {
        font-size: 4rem;
        margin-bottom: var(--space-4);
    }
</style>

<!-- ============================================ -->
<!-- TEMPLATE                                    -->
<!-- ============================================ -->
<div class="sensors-page">
    <div class="page-header">
        <h1 class="page-title">📡 Moje senzory</h1>
        <button class="btn btn-primary" on:click={() => showAddForm = !showAddForm}>
            {showAddForm ? '✕ Zrušiť' : '+ Pridať senzor'}
        </button>
    </div>
    
    <!-- Add Sensor Form -->
    {#if showAddForm}
        <div class="add-form-container">
            <h3>Nový senzor</h3>
            {#if addError}
                <div class="form-error">{addError}</div>
            {/if}
            <form class="add-form" on:submit={handleAddSensor}>
                <div class="form-row">
                    <div class="field">
                        <label for="name">Názov</label>
                        <input 
                            id="name" 
                            type="text" 
                            bind:value={newSensor.name} 
                            placeholder="Napr. Teplomer obývačka"
                            required
                        />
                    </div>
                    <div class="field">
                        <label for="location">Umiestnenie</label>
                        <input 
                            id="location" 
                            type="text" 
                            bind:value={newSensor.location} 
                            placeholder="Napr. Obývačka"
                            required
                        />
                    </div>
                    <div class="field">
                        <label for="type">Typ</label>
                        <select id="type" bind:value={newSensor.type} required>
                            <option value="">Vyberte typ</option>
                            <option value="temperature">Teplota</option>
                            <option value="humidity">Vlhkosť</option>
                            <option value="pressure">Tlak</option>
                            <option value="level">Hladina</option>
                            <option value="motion">Pohyb</option>
                            <option value="other">Iné</option>
                        </select>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" on:click={() => showAddForm = false}>
                        Zrušiť
                    </button>
                    <button type="submit" class="btn btn-primary" disabled={adding}>
                        {adding ? 'Vytváranie...' : 'Vytvoriť senzor'}
                    </button>
                </div>
            </form>
        </div>
    {/if}
    
    <!-- Loading State -->
    {#if loading}
        <div class="loading-container">
            <div class="loading-spinner"></div>
            <p>Načítavam senzory...</p>
        </div>
    <!-- Error State -->
    {:else if error}
        <div class="error-container">
            <p class="form-error">{error}</p>
            <button class="btn btn-primary" on:click={loadSensors}>Skúsiť znova</button>
        </div>
    <!-- Empty State -->
    {:else if sensors.length === 0}
        <div class="empty-state">
            <div class="empty-icon">📡</div>
            <h2>Zatiaľ nemáte žiadne senzory</h2>
            <p>Pridajte svoj prvý senzor kliknutím na tlačidlo vyššie.</p>
        </div>
    <!-- Sensors Grid -->
    {:else}
        <div class="sensors-grid">
            {#each sensors as sensor (sensor._id)}
                <div class="sensor-card">
                    <div class="sensor-header">
                        <span class="sensor-name">{sensor.name}</span>
                        <span class="sensor-status" class:status-active={sensor.isActive} class:status-inactive={!sensor.isActive}>
                            {sensor.isActive ? 'Aktívny' : 'Neaktívny'}
                        </span>
                    </div>
                    
                    <div class="sensor-info">
                        <div class="info-row">
                            <span class="info-label">📍 Miesto:</span>
                            <span class="info-value">{sensor.location}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">🔧 Typ:</span>
                            <span class="info-value">{sensor.type}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">📅 Vytvorené:</span>
                            <span class="info-value">{new Date(sensor.createdAt).toLocaleDateString('sk-SK')}</span>
                        </div>
                    </div>
                    
                    <div class="api-key-section">
                        <div class="api-key-header">
                            <span class="api-key-label">🔑 API Kľúč</span>
                            <div class="api-key-actions">
                                <button 
                                    class="btn btn-small btn-secondary" 
                                    on:click={() => toggleApiKeyVisibility(sensor._id)}
                                >
                                    {visibleApiKeys.has(sensor._id) ? '👁️ Skryť' : '👁️ Zobraziť'}
                                </button>
                                <button 
                                    class="btn btn-small btn-secondary" 
                                    on:click={() => copyApiKey(sensor.apiKey)}
                                >
                                    📋 Kopírovať
                                </button>
                            </div>
                        </div>
                        <div class="api-key-value">
                            {#if visibleApiKeys.has(sensor._id)}
                                {sensor.apiKey}
                            {:else}
                                <span class="api-key-hidden">••••••••••••••••••••••••</span>
                            {/if}
                        </div>
                    </div>
                    
                    <div class="sensor-actions">
                        <button 
                            class="btn btn-small btn-primary" 
                            on:click={() => goto(`/sensors/${sensor._id}`)}
                        >
                            📊 Merania
                        </button>
                        <button 
                            class="btn btn-small btn-danger" 
                            on:click={() => handleDeleteSensor(sensor._id)}
                        >
                            🗑️ Vymazať
                        </button>
                    </div>
                </div>
            {/each}
        </div>
    {/if}
</div>
