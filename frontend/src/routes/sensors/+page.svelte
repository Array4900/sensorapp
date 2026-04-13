<!--
  Sensors Page - View and manage sensors
  Admin can create sensors; all users can view their own sensors
-->
<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { isAuthenticated, isAdmin, user } from '$lib/stores/auth';
    import { 
        getSensors, 
        createSensor, 
        updateSensor,
        deleteSensor, 
        type Sensor, 
        type CreateSensorData 
    } from '$lib/api';

    // ============================================
    // STATE
    // ============================================
    
    let sensors: Sensor[] = [];
    let loading = true;
    let error = '';
    
    // Add sensor form state
    let showAddForm = false;
    let newSensorName = '';
    let newSensorLocation = '';
    let newSensorOwner = '';
    let addError = '';
    let adding = false;
    
    // Edit sensor modal state
    let showEditModal = false;
    let editingSensor: Sensor | null = null;
    let editSensorData = { name: '', location: '', isActive: true };
    let editError = '';
    let editing = false;
    
    // API key / QR code visibility
    let visibleApiKeys: Set<string> = new Set();
    let visibleQrCodes: Set<string> = new Set();
    
    // ============================================
    // LIFECYCLE
    // ============================================
    
    onMount(async () => {
        if (!$isAuthenticated) {
            goto('/login');
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
            sensors = await getSensors();
        } catch (e) {
            error = (e as Error).message || 'Nepodarilo sa načítať dáta';
        } finally {
            loading = false;
        }
    }
    
    async function handleAddSensor(e: Event) {
        e.preventDefault();
        addError = '';
        adding = true;
        
        try {
            const sensorData: CreateSensorData = {
                name: newSensorName,
            };
            if (newSensorLocation.trim()) {
                sensorData.location = newSensorLocation.trim();
            }
            if (newSensorOwner.trim()) {
                sensorData.owner = newSensorOwner.trim();
            }
            const sensor = await createSensor(sensorData);
            sensors = [sensor, ...sensors];
            newSensorName = '';
            newSensorLocation = '';
            newSensorOwner = '';
            showAddForm = false;
        } catch (e) {
            addError = (e as Error).message || 'Nepodarilo sa vytvoriť senzor';
        } finally {
            adding = false;
        }
    }
    
    function openEditModal(sensor: Sensor) {
        editingSensor = sensor;
        editSensorData = {
            name: sensor.name,
            location: sensor.location || '',
            isActive: sensor.isActive
        };
        editError = '';
        showEditModal = true;
    }
    
    async function handleEditSensor(e: Event) {
        e.preventDefault();
        if (!editingSensor) return;
        
        editError = '';
        editing = true;
        
        try {
            const updatedSensor = await updateSensor(editingSensor._id, {
                name: editSensorData.name,
                location: editSensorData.location,
                isActive: editSensorData.isActive
            });
            sensors = sensors.map(s => s._id === updatedSensor._id ? updatedSensor : s);
            showEditModal = false;
            editingSensor = null;
        } catch (e) {
            editError = (e as Error).message || 'Nepodarilo sa upraviť senzor';
        } finally {
            editing = false;
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
        visibleApiKeys = visibleApiKeys;
    }

    function toggleQrCodeVisibility(id: string) {
        if (visibleQrCodes.has(id)) {
            visibleQrCodes.delete(id);
        } else {
            visibleQrCodes.add(id);
        }
        visibleQrCodes = visibleQrCodes;
    }
    
    function copyApiKey(apiKey: string) {
        navigator.clipboard.writeText(apiKey);
    }
</script>

<!-- ============================================ -->
<!-- STYLES                                      -->
<!-- ============================================ -->
<style>
    .sensors-page {
        padding: 1.5rem;
        max-width: 1200px;
        margin: 0 auto;
    }
    
    .page-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
        flex-wrap: wrap;
        gap: 1rem;
    }
    
    .page-title {
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--color-text-primary, #1f2937);
    }
    
    .btn {
        padding: 0.5rem 1rem;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.15s;
        border: none;
        font-size: 0.875rem;
    }
    
    .btn-primary {
        background: var(--color-primary, #4361ee);
        color: white;
    }
    
    .btn-primary:hover {
        background: var(--color-secondary, #3a0ca3);
    }
    
    .btn-danger {
        background: #dc3545;
        color: white;
    }
    
    .btn-danger:hover {
        background: #c82333;
    }
    
    .btn-secondary {
        background: var(--color-bg-secondary, #f9fafb);
        color: var(--color-text-primary, #1f2937);
        border: 1px solid var(--color-border, #e5e7eb);
    }
    
    .btn-small {
        padding: 0.25rem 0.5rem;
        font-size: 0.8rem;
    }
    
    /* Forms */
    .form-container {
        background: white;
        border: 1px solid var(--color-border, #e5e7eb);
        border-radius: 12px;
        padding: 1.5rem;
        margin-bottom: 1.5rem;
    }
    
    .form-title {
        font-size: 1.125rem;
        font-weight: 600;
        margin-bottom: 1rem;
        color: var(--color-text-primary, #1f2937);
    }
    
    .form-grid {
        display: grid;
        gap: 1rem;
    }
    
    .form-row {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
    }
    
    .field {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }
    
    .field label {
        font-weight: 500;
        color: var(--color-text-secondary, #6b7280);
        font-size: 0.875rem;
    }
    
    .field input {
        padding: 0.5rem 0.75rem;
        border: 2px solid var(--color-border, #e5e7eb);
        border-radius: 8px;
        font-size: 1rem;
    }

    .field input:focus {
        outline: none;
        border-color: var(--color-primary, #4361ee);
    }
    
    .form-actions {
        display: flex;
        gap: 0.5rem;
        justify-content: flex-end;
        margin-top: 1rem;
    }
    
    .form-error {
        color: #dc3545;
        font-size: 0.875rem;
        margin-bottom: 0.5rem;
    }
    
    /* Sensors Grid */
    .sensors-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
        gap: 1rem;
    }
    
    .sensor-card {
        background: white;
        border: 1px solid var(--color-border, #e5e7eb);
        border-radius: 12px;
        padding: 1.25rem;
        transition: box-shadow 0.15s;
    }
    
    .sensor-card:hover {
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    
    .sensor-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 0.75rem;
    }
    
    .sensor-name {
        font-size: 1.125rem;
        font-weight: 600;
        color: var(--color-text-primary, #1f2937);
    }
    
    .sensor-status {
        padding: 0.125rem 0.5rem;
        border-radius: 999px;
        font-size: 0.75rem;
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
        gap: 0.375rem;
        margin-bottom: 1rem;
    }
    
    .info-row {
        display: flex;
        gap: 0.5rem;
    }
    
    .info-label {
        color: var(--color-text-secondary, #6b7280);
        font-size: 0.875rem;
        min-width: 80px;
    }
    
    .info-value {
        color: var(--color-text-primary, #1f2937);
        font-size: 0.875rem;
    }
    
    .api-key-section {
        background: var(--color-bg-secondary, #f9fafb);
        padding: 0.75rem;
        border-radius: 8px;
        margin-bottom: 1rem;
    }
    
    .api-key-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;
        flex-wrap: wrap;
        gap: 0.5rem;
    }
    
    .api-key-label {
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--color-text-secondary, #6b7280);
    }

    .api-key-actions {
        display: flex;
        gap: 0.25rem;
        flex-wrap: wrap;
    }
    
    .api-key-value {
        font-family: monospace;
        font-size: 0.8rem;
        word-break: break-all;
        background: white;
        padding: 0.5rem;
        border-radius: 4px;
    }
    
    .api-key-hidden {
        color: var(--color-text-muted, #9ca3af);
    }

    .qr-code-container {
        text-align: center;
        margin-top: 0.5rem;
    }

    .qr-code-container img {
        max-width: 200px;
        border: 1px solid var(--color-border, #e5e7eb);
        border-radius: 8px;
    }
    
    .sensor-actions {
        display: flex;
        gap: 0.5rem;
        justify-content: flex-end;
    }
    
    /* Modal */
    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    }
    
    .modal {
        background: white;
        border-radius: 12px;
        padding: 1.5rem;
        max-width: 500px;
        width: 90%;
        max-height: 90vh;
        overflow-y: auto;
    }
    
    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
    }
    
    .modal-title {
        font-size: 1.25rem;
        font-weight: 600;
    }
    
    .modal-close {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: var(--color-text-secondary, #6b7280);
    }
    
    .checkbox-field {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    .checkbox-field input {
        width: auto;
    }
    
    /* Loading & Error States */
    .loading-container, .error-container, .empty-state {
        text-align: center;
        padding: 3rem;
    }
    
    .loading-spinner {
        width: 40px;
        height: 40px;
        border: 3px solid var(--color-border, #e5e7eb);
        border-top-color: var(--color-primary, #4361ee);
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 1rem;
    }
    
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
    
    .empty-icon {
        font-size: 4rem;
        margin-bottom: 1rem;
    }

    @media (max-width: 768px) {
        .sensors-grid {
            grid-template-columns: 1fr;
        }
    }
</style>

<!-- ============================================ -->
<!-- TEMPLATE                                    -->
<!-- ============================================ -->
<div class="sensors-page">
    <div class="page-header">
        <h1 class="page-title">📡 Moje senzory</h1>
        <div>
            {#if $isAdmin}
                <button class="btn btn-primary" on:click={() => showAddForm = !showAddForm}>
                    {showAddForm ? '✕ Zrušiť' : '+ Pridať senzor'}
                </button>
            {/if}
        </div>
    </div>
    
    <!-- Add Sensor Form (admin only) -->
    {#if showAddForm && $isAdmin}
        <div class="form-container">
            <h3 class="form-title">Nový senzor (HladinomerESP)</h3>
            {#if addError}
                <div class="form-error">{addError}</div>
            {/if}
            <form class="form-grid" on:submit={handleAddSensor}>
                <div class="form-row">
                    <div class="field">
                        <label for="name">Názov</label>
                        <input 
                            id="name" 
                            type="text" 
                            bind:value={newSensorName} 
                            placeholder="Napr. Hladinomer nádrž 1"
                            required
                        />
                    </div>
                    <div class="field">
                        <label for="location">Umiestnenie (voliteľné)</label>
                        <input 
                            id="location" 
                            type="text" 
                            bind:value={newSensorLocation} 
                            placeholder="Napr. Pivnica, Záhrada..."
                        />
                    </div>
                    <div class="field">
                        <label for="owner">Vlastník (voliteľný)</label>
                        <input 
                            id="owner" 
                            type="text" 
                            bind:value={newSensorOwner} 
                            placeholder="Username (inak vy)"
                        />
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
            <button class="btn btn-primary" on:click={loadData}>Skúsiť znova</button>
        </div>
    <!-- Empty State -->
    {:else if sensors.length === 0}
        <div class="empty-state">
            <div class="empty-icon">📡</div>
            <h2>Zatiaľ nemáte žiadne senzory</h2>
            {#if $isAdmin}
                <p>Pridajte svoj prvý senzor kliknutím na tlačidlo vyššie.</p>
            {:else}
                <p>Kontaktujte administrátora pre vytvorenie senzora.</p>
            {/if}
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
                            <span class="info-label">📍 Lokácia:</span>
                            <span class="info-value">{sensor.location || 'Nezadaná'}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">🔧 Typ:</span>
                            <span class="info-value">{sensor.type}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">👤 Vlastník:</span>
                            <span class="info-value">{sensor.owner}</span>
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
                                    {visibleApiKeys.has(sensor._id) ? '🔒 Skryť' : '👁️ Zobraziť'}
                                </button>
                                {#if visibleApiKeys.has(sensor._id)}
                                    <button 
                                        class="btn btn-small btn-secondary" 
                                        on:click={() => copyApiKey(sensor.apiKey)}
                                    >
                                        📋 Kopírovať
                                    </button>
                                    <button 
                                        class="btn btn-small btn-secondary" 
                                        on:click={() => toggleQrCodeVisibility(sensor._id)}
                                    >
                                        {visibleQrCodes.has(sensor._id) ? '✕ QR' : '📱 QR kód'}
                                    </button>
                                {/if}
                            </div>
                        </div>
                        <div class="api-key-value">
                            {#if visibleApiKeys.has(sensor._id)}
                                {sensor.apiKey}
                            {:else}
                                <span class="api-key-hidden">••••••••••••••••••••••••</span>
                            {/if}
                        </div>
                        {#if visibleQrCodes.has(sensor._id) && sensor.qrCode}
                            <div class="qr-code-container">
                                <img src={sensor.qrCode} alt="QR kód API kľúča" />
                            </div>
                        {/if}
                    </div>
                    
                    <div class="sensor-actions">
                        <button 
                            class="btn btn-small btn-secondary" 
                            on:click={() => openEditModal(sensor)}
                        >
                            ✏️ Upraviť
                        </button>
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

<!-- Edit Sensor Modal -->
{#if showEditModal && editingSensor}
    <div class="modal-overlay" on:click={() => showEditModal = false} on:keydown={(e) => e.key === 'Escape' && (showEditModal = false)} role="dialog" aria-modal="true" tabindex="-1">
        <div class="modal" on:click|stopPropagation on:keydown|stopPropagation role="dialog" aria-modal="true" tabindex="0">
            <div class="modal-header">
                <h2 class="modal-title">✏️ Upraviť senzor</h2>
                <button class="modal-close" on:click={() => showEditModal = false}>&times;</button>
            </div>
            
            {#if editError}
                <div class="form-error">{editError}</div>
            {/if}
            
            <form class="form-grid" on:submit={handleEditSensor}>
                <div class="field">
                    <label for="editName">Názov</label>
                    <input id="editName" type="text" bind:value={editSensorData.name} required />
                </div>
                
                <div class="field">
                    <label for="editLocation">Umiestnenie</label>
                    <input id="editLocation" type="text" bind:value={editSensorData.location} placeholder="Napr. Pivnica, Záhrada..." />
                </div>
                
                <div class="field checkbox-field">
                    <input id="editActive" type="checkbox" bind:checked={editSensorData.isActive} />
                    <label for="editActive">Aktívny</label>
                </div>
                
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" on:click={() => showEditModal = false}>
                        Zrušiť
                    </button>
                    <button type="submit" class="btn btn-primary" disabled={editing}>
                        {editing ? 'Ukladám...' : 'Uložiť zmeny'}
                    </button>
                </div>
            </form>
        </div>
    </div>
{/if}
