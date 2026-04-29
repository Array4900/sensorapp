<!--
  Sensors Page - View and manage sensors
-->
<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { isAuthenticated, isAdmin, user } from '$lib/stores/auth';
    import { isOnline } from '$lib/stores/offline';
    import { 
        getSensorTypes,
        getSensors, 
        createSensor, 
        updateSensor,
        deleteSensor, 
        type Sensor, 
        type CreateSensorData,
        type SensorTypeDefinition
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
    let newSensorType = '';
    let newSensorMacAddress = '';
    let newSensorTankHeight = 0;
    let newSensorOwner = '';
    let sensorTypes: SensorTypeDefinition[] = [];
    let addError = '';
    let adding = false;
    
    // Edit sensor modal state
    let showEditModal = false;
    let editingSensor: Sensor | null = null;
    let editSensorData = { name: '', tankHeight: 0, isActive: true };
    let editError = '';
    let editing = false;
    
    // Offline state
    let offline = false;
    $: offline = !$isOnline;
    $: selectedSensorTypeObj = sensorTypes.find((typeDef) => typeDef.id === newSensorType) || null;
    $: hasSingleSensorType = sensorTypes.length === 1;

    // API key / QR code visibility
    let visibleApiKeys: Set<string> = new Set();
    let visibleQrCodes: Set<string> = new Set();
    let visibleMacAddresses: Set<string> = new Set();
    
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
            const [sensorsData, sensorTypesData] = await Promise.all([
                getSensors(),
                getSensorTypes()
            ]);

            sensors = sensorsData;
            sensorTypes = sensorTypesData;

            if (sensorTypes.length === 1 && !newSensorType) {
                newSensorType = sensorTypes[0].id;
            }
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
            normalizeMacAddress();
            const sensorData: CreateSensorData = {
                name: newSensorName,
                macAddress: newSensorMacAddress,
                type: newSensorType,
                tankHeight: newSensorTankHeight
            };
            if (newSensorOwner.trim()) {
                sensorData.owner = newSensorOwner.trim();
            }
            const sensor = await createSensor(sensorData);
            sensors = [sensor, ...sensors];
            newSensorName = '';
            newSensorType = sensorTypes.length === 1 ? sensorTypes[0].id : '';
            newSensorMacAddress = '';
            newSensorTankHeight = 0;
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
            tankHeight: sensor.tankHeight,
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
                tankHeight: editSensorData.tankHeight,
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

    function toggleMacAddressVisibility(id: string) {
        if (visibleMacAddresses.has(id)) {
            visibleMacAddresses.delete(id);
        } else {
            visibleMacAddresses.add(id);
        }
        visibleMacAddresses = visibleMacAddresses;
    }
    
    function copyApiKey(apiKey: string) {
        navigator.clipboard.writeText(apiKey);
    }

    function copyMacAddress(macAddress: string) {
        navigator.clipboard.writeText(macAddress);
    }

    function normalizeMacAddress() {
        newSensorMacAddress = newSensorMacAddress.trim().toUpperCase();
    }

    // TODO: Implement hardware initialization logic
    function handleInitializeHW(sensorId: string) {
        console.log('Initialize HW for sensor:', sensorId);
        // TODO: Add implementation in next session - should probably send a command to the sensor
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

    .field input:disabled {
        background-color: var(--color-bg-secondary, #f9fafb);
        cursor: not-allowed;
        opacity: 0.6;
    }

    .field select {
        padding: 0.5rem 0.75rem;
        border: 2px solid var(--color-border, #e5e7eb);
        border-radius: 8px;
        font-size: 1rem;
        background-color: white;
        cursor: pointer;
    }

    .field select:focus {
        outline: none;
        border-color: var(--color-primary, #4361ee);
    }

    .field select:disabled {
        background-color: var(--color-bg-secondary, #f9fafb);
        cursor: not-allowed;
        opacity: 0.6;
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
    .sensors-layout {
        display: flex;
        gap: 1rem;
    }

    .sensors-main {
        flex: 1;
        min-width: 0;
    }

    .offline-sidebar {
        width: 260px;
        flex-shrink: 0;
    }

    .offline-banner {
        background: #fff3cd;
        border: 1px solid #ffc107;
        border-radius: 12px;
        padding: 1.25rem;
        text-align: center;
        position: sticky;
        top: 1rem;
    }

    .offline-banner-icon {
        font-size: 2rem;
        margin-bottom: 0.5rem;
    }

    .offline-banner-title {
        font-weight: 700;
        color: #856404;
        font-size: 1.125rem;
        margin-bottom: 0.25rem;
    }

    .offline-banner-text {
        color: #856404;
        font-size: 0.875rem;
    }

    .status-offline {
        background: #fff3cd;
        color: #856404;
    }

    .sensors-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
        gap: 1rem;
    }

    @media (max-width: 900px) {
        .sensors-layout {
            flex-direction: column;
        }

        .offline-sidebar {
            width: 100%;
            order: -1;
        }
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
                <button class="btn btn-primary" disabled={offline} on:click={() => showAddForm = !showAddForm}>
                    {showAddForm ? '✕ Zrušiť' : '+ Pridať senzor'}
                </button>
            {/if}
        </div>
    </div>
    
    <!-- Add Sensor Form (admin only) -->
    {#if showAddForm && $isAdmin}
        <div class="form-container">
            <h3 class="form-title">Nový senzor - Konfigurácia</h3>
            {#if addError}
                <div class="form-error">{addError}</div>
            {/if}
            <form class="form-grid" on:submit={handleAddSensor}>
                <div class="form-row">
                    <div class="field">
                        <label for="name">Názov <span style="color: red;">*</span></label>
                        <input 
                            id="name" 
                            type="text" 
                            bind:value={newSensorName} 
                            placeholder="Napr. Hladinomer nádrž 1"
                            required
                            disabled={offline}
                        />
                    </div>
                    <div class="field">
                        <label for="sensorType">Typ senzora <span style="color: red;">*</span></label>
                        <select 
                            id="sensorType" 
                            bind:value={newSensorType} 
                            required
                            disabled={offline || hasSingleSensorType || sensorTypes.length === 0}
                        >
                            {#if !hasSingleSensorType}
                                <option value="">-- Vyber typ senzora --</option>
                            {/if}
                            {#each sensorTypes as sensorType}
                                <option value={sensorType.id}>{sensorType.label}</option>
                            {/each}
                        </select>
                    </div>
                </div>

                {#if newSensorType}
                    <div class="form-row">
                        <div class="field">
                            <label for="macAddress">MAC Adresa <span style="color: red;">*</span></label>
                            <input 
                                id="macAddress" 
                                type="text" 
                                bind:value={newSensorMacAddress} 
                                on:blur={normalizeMacAddress}
                                placeholder="Napr. AA:BB:CC:DD:EE:FF"
                                title="Zadajte MAC adresu vo formáte XX:XX:XX:XX:XX:XX"
                                required
                                disabled={offline}
                            />
                        </div>
                    </div>

                    {#if selectedSensorTypeObj?.params.includes('tankHeight')}
                        <div class="form-row">
                            <div class="field">
                                <label for="tankHeight">Výška Nádrže (cm) <span style="color: red;">*</span></label>
                                <input 
                                    id="tankHeight" 
                                    type="number" 
                                    bind:value={newSensorTankHeight} 
                                    placeholder="Napr. 200"
                                    required
                                    min="1"
                                    disabled={offline}
                                />
                            </div>
                        </div>
                    {/if}

                    <div class="form-row">
                        <div class="field">
                            <label for="owner">Vlastník (voliteľný)</label>
                            <input 
                                id="owner" 
                                type="text" 
                                bind:value={newSensorOwner} 
                                placeholder="Username (inak vy)"
                                disabled={offline}
                            />
                        </div>
                    </div>
                {/if}

                {#if sensorTypes.length === 0}
                    <div class="form-error">Typy senzorov sa nepodarilo načítať.</div>
                {/if}

                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" on:click={() => showAddForm = false} disabled={offline}>
                        Zrušiť
                    </button>
                    <button type="submit" class="btn btn-primary" disabled={adding || offline || !newSensorType || sensorTypes.length === 0}>
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
      <div class="sensors-layout">
        <div class="sensors-main">
        <div class="sensors-grid">
            {#each sensors as sensor (sensor._id)}
                <div class="sensor-card">
                    <div class="sensor-header">
                        <span class="sensor-name">{sensor.name}</span>
                        {#if offline}
                            <span class="sensor-status status-offline">Stav: Nedá sa zistiť</span>
                        {:else}
                            <span class="sensor-status" class:status-active={sensor.isActive} class:status-inactive={!sensor.isActive}>
                                {sensor.isActive ? 'Stav: Aktívny' : 'Stav: Neaktívny'}
                            </span>
                        {/if}
                    </div>
                    
                    <div class="sensor-info">
                        <div class="info-row">
                            <span class="info-label">📏 Výška:</span>
                            <span class="info-value">{sensor.tankHeight} cm</span>
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
                                    disabled={offline}
                                >
                                    {visibleApiKeys.has(sensor._id) ? '🔒 Skryť' : '👁️ Zobraziť'}
                                </button>
                                {#if visibleApiKeys.has(sensor._id)}
                                    <button 
                                        class="btn btn-small btn-secondary" 
                                        on:click={() => copyApiKey(sensor.apiKey)}
                                        disabled={offline}
                                    >
                                        📋 Kopírovať
                                    </button>
                                    <button 
                                        class="btn btn-small btn-secondary" 
                                        on:click={() => toggleQrCodeVisibility(sensor._id)}
                                        disabled={offline}
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

                    <div class="api-key-section">
                        <div class="api-key-header">
                            <span class="api-key-label">🔌 MAC Adresa</span>
                            <div class="api-key-actions">
                                <button 
                                    class="btn btn-small btn-secondary" 
                                    on:click={() => toggleMacAddressVisibility(sensor._id)}
                                    disabled={offline}
                                >
                                    {visibleMacAddresses.has(sensor._id) ? '🔒 Skryť' : '👁️ Zobraziť'}
                                </button>
                                {#if visibleMacAddresses.has(sensor._id)}
                                    <button 
                                        class="btn btn-small btn-secondary" 
                                        on:click={() => copyMacAddress(sensor.macAddress)}
                                        disabled={offline}
                                    >
                                        📋 Kopírovať
                                    </button>
                                {/if}
                            </div>
                        </div>
                        <div class="api-key-value">
                            {#if visibleMacAddresses.has(sensor._id)}
                                {sensor.macAddress}
                            {:else}
                                <span class="api-key-hidden">••••••••••••••••••••••••</span>
                            {/if}
                        </div>
                    </div>
                    
                    <div class="sensor-actions">
                        <button 
                            class="btn btn-small btn-secondary" 
                            on:click={() => handleInitializeHW(sensor._id)}
                            disabled={offline}
                        >
                            ⚙️ Init. HW
                        </button>
                        <button 
                            class="btn btn-small btn-secondary" 
                            on:click={() => openEditModal(sensor)}
                            disabled={offline}
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
                            disabled={offline}
                        >
                            🗑️ Vymazať
                        </button>
                    </div>
                </div>
            {/each}
        </div>
        </div>
        {#if offline}
            <div class="offline-sidebar">
                <div class="offline-banner">
                    <div class="offline-banner-icon">📡</div>
                    <div class="offline-banner-title">Ste offline</div>
                    <div class="offline-banner-text">Zobrazujú sa uložené dáta. Zmeny nie sú možné.</div>
                </div>
            </div>
        {/if}
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
                    <label for="editTankHeight">Výška Nádrže (cm)</label>
                    <input id="editTankHeight" type="number" bind:value={editSensorData.tankHeight} required min="1" />
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
