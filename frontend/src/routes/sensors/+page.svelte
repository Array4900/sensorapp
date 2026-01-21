<!--
  Sensors Page - View and manage sensors and locations
  Users can view their sensors, filter by location, edit sensors, and manage locations
-->
<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { isAuthenticated, user } from '$lib/stores/auth';
    import { 
        getSensors, 
        createSensor, 
        updateSensor,
        deleteSensor, 
        getLocations,
        createLocation,
        updateLocation,
        deleteLocation,
        type Sensor, 
        type Location,
        type CreateSensorData 
    } from '$lib/api';

    // ============================================
    // STATE
    // ============================================
    
    let sensors: Sensor[] = [];
    let locations: Location[] = [];
    let loading = true;
    let error = '';
    
    // Filter state
    let selectedLocationFilter: string = 'all';
    
    // Add sensor form state
    let showAddForm = false;
    let newSensor: CreateSensorData = { name: '', location: '', type: '' };
    let addError = '';
    let adding = false;
    
    // Edit sensor modal state
    let showEditModal = false;
    let editingSensor: Sensor | null = null;
    let editSensorData = { name: '', location: '', type: '', isActive: true };
    let editError = '';
    let editing = false;
    
    // Location management state
    let showLocationManager = false;
    let showAddLocationForm = false;
    let newLocationName = '';
    let newLocationDescription = '';
    let addLocationError = '';
    let addingLocation = false;
    
    // Edit location state
    let editingLocation: Location | null = null;
    let editLocationName = '';
    let editLocationDescription = '';
    let editLocationError = '';
    let savingLocation = false;
    
    // API key visibility
    let visibleApiKeys: Set<string> = new Set();
    
    // ============================================
    // COMPUTED
    // ============================================
    
    $: filteredSensors = selectedLocationFilter === 'all' 
        ? sensors 
        : selectedLocationFilter === 'none'
            ? sensors.filter(s => !s.location)
            : sensors.filter(s => s.location?._id === selectedLocationFilter);
    
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
            const [sensorsData, locationsData] = await Promise.all([
                getSensors(),
                getLocations()
            ]);
            sensors = sensorsData;
            locations = locationsData;
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
                name: newSensor.name,
                type: newSensor.type
            };
            if (newSensor.location) {
                sensorData.location = newSensor.location;
            }
            const sensor = await createSensor(sensorData);
            sensors = [sensor, ...sensors];
            newSensor = { name: '', location: '', type: '' };
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
            location: sensor.location?._id || '',
            type: sensor.type,
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
                location: editSensorData.location || undefined,
                type: editSensorData.type,
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
    
    // Location management functions
    async function handleAddLocation(e: Event) {
        e.preventDefault();
        addLocationError = '';
        addingLocation = true;
        
        try {
            const location = await createLocation({
                name: newLocationName,
                description: newLocationDescription
            });
            locations = [...locations, location];
            newLocationName = '';
            newLocationDescription = '';
            showAddLocationForm = false;
        } catch (e) {
            addLocationError = (e as Error).message || 'Nepodarilo sa vytvoriť lokáciu';
        } finally {
            addingLocation = false;
        }
    }
    
    function startEditLocation(location: Location) {
        editingLocation = location;
        editLocationName = location.name;
        editLocationDescription = location.description;
        editLocationError = '';
    }
    
    async function handleSaveLocation() {
        if (!editingLocation) return;
        
        editLocationError = '';
        savingLocation = true;
        
        try {
            const updated = await updateLocation(editingLocation._id, {
                name: editLocationName,
                description: editLocationDescription
            });
            locations = locations.map(l => l._id === updated._id ? updated : l);
            editingLocation = null;
        } catch (e) {
            editLocationError = (e as Error).message || 'Nepodarilo sa upraviť lokáciu';
        } finally {
            savingLocation = false;
        }
    }
    
    async function handleDeleteLocation(id: string) {
        const loc = locations.find(l => l._id === id);
        if (!confirm(`Naozaj chcete vymazať lokáciu "${loc?.name}"?`)) {
            return;
        }
        
        try {
            await deleteLocation(id);
            locations = locations.filter(l => l._id !== id);
            if (selectedLocationFilter === id) {
                selectedLocationFilter = 'all';
            }
        } catch (e) {
            alert((e as Error).message || 'Nepodarilo sa vymazať lokáciu');
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
    
    function copyApiKey(apiKey: string) {
        navigator.clipboard.writeText(apiKey);
    }
    
    function getLocationName(sensor: Sensor): string {
        return sensor.location?.name || 'Bez lokácie';
    }
    
    function getSensorCountForLocation(locationId: string): number {
        return sensors.filter(s => s.location?._id === locationId).length;
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
    
    .header-actions {
        display: flex;
        gap: var(--space-2);
        flex-wrap: wrap;
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
    
    /* Filter Section */
    .filter-section {
        background: var(--color-bg-primary);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-lg);
        padding: var(--space-4);
        margin-bottom: var(--space-4);
        display: flex;
        align-items: center;
        gap: var(--space-4);
        flex-wrap: wrap;
    }
    
    .filter-label {
        font-weight: 600;
        color: var(--color-text-secondary);
    }
    
    .filter-select {
        padding: var(--space-2) var(--space-3);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        font-size: var(--font-size-base);
        min-width: 200px;
    }
    
    .filter-info {
        color: var(--color-text-secondary);
        font-size: var(--font-size-sm);
        margin-left: auto;
    }
    
    /* Forms */
    .form-container {
        background: var(--color-bg-primary);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-lg);
        padding: var(--space-6);
        margin-bottom: var(--space-6);
    }
    
    .form-title {
        font-size: var(--font-size-lg);
        font-weight: 600;
        margin-bottom: var(--space-4);
        color: var(--color-text-primary);
    }
    
    .form-grid {
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
    
    .field input, .field select, .field textarea {
        padding: var(--space-2) var(--space-3);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        font-size: var(--font-size-base);
    }
    
    .field textarea {
        resize: vertical;
        min-height: 80px;
    }
    
    .form-actions {
        display: flex;
        gap: var(--space-2);
        justify-content: flex-end;
        margin-top: var(--space-4);
    }
    
    .form-error {
        color: var(--color-danger, #dc3545);
        font-size: var(--font-size-sm);
        margin-bottom: var(--space-2);
    }
    
    /* Location Manager */
    .location-manager {
        background: var(--color-bg-primary);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-lg);
        padding: var(--space-6);
        margin-bottom: var(--space-6);
    }
    
    .location-manager-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--space-4);
    }
    
    .locations-list {
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
    }
    
    .location-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--space-3);
        background: var(--color-bg-secondary);
        border-radius: var(--radius-md);
        gap: var(--space-4);
    }
    
    .location-info {
        flex: 1;
    }
    
    .location-name {
        font-weight: 600;
        color: var(--color-text-primary);
    }
    
    .location-description {
        font-size: var(--font-size-sm);
        color: var(--color-text-secondary);
    }
    
    .location-stats {
        font-size: var(--font-size-sm);
        color: var(--color-text-muted);
    }
    
    .location-actions {
        display: flex;
        gap: var(--space-2);
    }
    
    .location-edit-form {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
        flex: 1;
    }
    
    .location-edit-row {
        display: flex;
        gap: var(--space-2);
        align-items: center;
    }
    
    .location-edit-row input {
        flex: 1;
        padding: var(--space-2);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-sm);
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
        background: var(--color-bg-primary);
        border-radius: var(--radius-lg);
        padding: var(--space-6);
        max-width: 500px;
        width: 90%;
        max-height: 90vh;
        overflow-y: auto;
    }
    
    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--space-4);
    }
    
    .modal-title {
        font-size: var(--font-size-xl);
        font-weight: 600;
    }
    
    .modal-close {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: var(--color-text-secondary);
    }
    
    .checkbox-field {
        display: flex;
        align-items: center;
        gap: var(--space-2);
    }
    
    .checkbox-field input {
        width: auto;
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
    
    .no-locations {
        text-align: center;
        padding: var(--space-4);
        color: var(--color-text-secondary);
    }
</style>

<!-- ============================================ -->
<!-- TEMPLATE                                    -->
<!-- ============================================ -->
<div class="sensors-page">
    <div class="page-header">
        <h1 class="page-title">📡 Moje senzory</h1>
        <div class="header-actions">
            <button class="btn btn-secondary" on:click={() => showLocationManager = !showLocationManager}>
                {showLocationManager ? '✕ Zavrieť lokácie' : '📍 Spravovať lokácie'}
            </button>
            <button class="btn btn-primary" on:click={() => showAddForm = !showAddForm}>
                {showAddForm ? '✕ Zrušiť' : '+ Pridať senzor'}
            </button>
        </div>
    </div>
    
    <!-- Location Manager -->
    {#if showLocationManager}
        <div class="location-manager">
            <div class="location-manager-header">
                <h3 class="form-title">📍 Moje lokácie</h3>
                <button class="btn btn-small btn-primary" on:click={() => showAddLocationForm = !showAddLocationForm}>
                    {showAddLocationForm ? '✕' : '+ Nová lokácia'}
                </button>
            </div>
            
            {#if showAddLocationForm}
                <form class="form-grid" style="margin-bottom: var(--space-4);" on:submit={handleAddLocation}>
                    {#if addLocationError}
                        <div class="form-error">{addLocationError}</div>
                    {/if}
                    <div class="form-row">
                        <div class="field">
                            <label for="newLocName">Názov lokácie</label>
                            <input id="newLocName" type="text" bind:value={newLocationName} placeholder="Napr. Obývačka" required />
                        </div>
                        <div class="field">
                            <label for="newLocDesc">Popis (voliteľný)</label>
                            <input id="newLocDesc" type="text" bind:value={newLocationDescription} placeholder="Popis lokácie" />
                        </div>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary btn-small" on:click={() => showAddLocationForm = false}>Zrušiť</button>
                        <button type="submit" class="btn btn-primary btn-small" disabled={addingLocation}>
                            {addingLocation ? 'Vytváram...' : 'Vytvoriť'}
                        </button>
                    </div>
                </form>
            {/if}
            
            {#if locations.length === 0}
                <div class="no-locations">Zatiaľ nemáte žiadne lokácie. Vytvorte si prvú!</div>
            {:else}
                <div class="locations-list">
                    {#each locations as location (location._id)}
                        <div class="location-item">
                            {#if editingLocation?._id === location._id}
                                <div class="location-edit-form">
                                    {#if editLocationError}
                                        <div class="form-error">{editLocationError}</div>
                                    {/if}
                                    <div class="location-edit-row">
                                        <input type="text" bind:value={editLocationName} placeholder="Názov" />
                                        <input type="text" bind:value={editLocationDescription} placeholder="Popis" />
                                        <button class="btn btn-small btn-primary" on:click={handleSaveLocation} disabled={savingLocation}>
                                            {savingLocation ? '...' : '✓'}
                                        </button>
                                        <button class="btn btn-small btn-secondary" on:click={() => editingLocation = null}>✕</button>
                                    </div>
                                </div>
                            {:else}
                                <div class="location-info">
                                    <div class="location-name">{location.name}</div>
                                    {#if location.description}
                                        <div class="location-description">{location.description}</div>
                                    {/if}
                                    <div class="location-stats">📡 {getSensorCountForLocation(location._id)} senzorov</div>
                                </div>
                                <div class="location-actions">
                                    <button class="btn btn-small btn-secondary" on:click={() => startEditLocation(location)}>✏️</button>
                                    <button class="btn btn-small btn-danger" on:click={() => handleDeleteLocation(location._id)}>🗑️</button>
                                </div>
                            {/if}
                        </div>
                    {/each}
                </div>
            {/if}
        </div>
    {/if}
    
    <!-- Add Sensor Form -->
    {#if showAddForm}
        <div class="form-container">
            <h3 class="form-title">Nový senzor</h3>
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
                            bind:value={newSensor.name} 
                            placeholder="Napr. Teplomer obývačka"
                            required
                        />
                    </div>
                    <div class="field">
                        <label for="location">Lokácia (voliteľná)</label>
                        <select id="location" bind:value={newSensor.location}>
                            <option value="">Bez lokácie</option>
                            {#each locations as loc}
                                <option value={loc._id}>{loc.name}</option>
                            {/each}
                        </select>
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
    
    <!-- Filter Section -->
    {#if !loading && sensors.length > 0}
        <div class="filter-section">
            <span class="filter-label">📍 Filtrovať podľa lokácie:</span>
            <select class="filter-select" bind:value={selectedLocationFilter}>
                <option value="all">Všetky senzory</option>
                <option value="none">Bez lokácie</option>
                {#each locations as loc}
                    <option value={loc._id}>{loc.name}</option>
                {/each}
            </select>
            <span class="filter-info">
                Zobrazených: {filteredSensors.length} z {sensors.length} senzorov
            </span>
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
            <p>Pridajte svoj prvý senzor kliknutím na tlačidlo vyššie.</p>
        </div>
    <!-- Sensors Grid -->
    {:else if filteredSensors.length === 0}
        <div class="empty-state">
            <div class="empty-icon">🔍</div>
            <h2>Žiadne senzory v tejto lokácii</h2>
            <p>Zmeňte filter alebo pridajte senzor do tejto lokácie.</p>
        </div>
    {:else}
        <div class="sensors-grid">
            {#each filteredSensors as sensor (sensor._id)}
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
                            <span class="info-value">{getLocationName(sensor)}</span>
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
        <div class="modal" tabindex="0" role="dialog" aria-modal="true" on:click|stopPropagation on:keydown|stopPropagation>
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
                    <label for="editLocation">Lokácia</label>
                    <select id="editLocation" bind:value={editSensorData.location}>
                        <option value="">Bez lokácie</option>
                        {#each locations as loc}
                            <option value={loc._id}>{loc.name}</option>
                        {/each}
                    </select>
                </div>
                
                <div class="field">
                    <label for="editType">Typ</label>
                    <select id="editType" bind:value={editSensorData.type} required>
                        <option value="temperature">Teplota</option>
                        <option value="humidity">Vlhkosť</option>
                        <option value="pressure">Tlak</option>
                        <option value="level">Hladina</option>
                        <option value="motion">Pohyb</option>
                        <option value="other">Iné</option>
                    </select>
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
