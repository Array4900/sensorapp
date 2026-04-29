<!--
  Sensor Detail Page - View sensor details and measurements
-->
<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import { isAuthenticated } from '$lib/stores/auth';
    import { isOnline } from '$lib/stores/offline';
    import { getSensorById, getSensorMeasurementsPage, deleteMeasurements, type Sensor, type Measurement } from '$lib/api';

    // ============================================
    // STATE
    // ============================================
    
    let sensor: Sensor | null = null;
    let measurements: Measurement[] = [];
    let loading = true;
    let error = '';
    let showApiKey = false;
    let showMacAddress = false;
    let offline = false;
    let currentPage = 1;
    let totalMeasurements = 0;
    let measurementsPerPage = 20;
    let selectedMeasurementIds: string[] = [];
    let deletingMeasurements = false;
    
    $: sensorId = $page.params.id;
    $: offline = !$isOnline;
    $: totalPages = Math.ceil(totalMeasurements / measurementsPerPage);
    $: allVisibleMeasurementsSelected = measurements.length > 0 && measurements.every((measurement) => selectedMeasurementIds.includes(measurement._id));
    
    // ============================================
    // LIFECYCLE
    // ============================================
    
    onMount(async () => {
        if (!$isAuthenticated) {
            goto('/login');
            return;
        }
        
        await loadSensorData();
    });
    
    // ============================================
    // FUNCTIONS
    // ============================================
    
    async function loadSensorData() {
        loading = true;
        error = '';
        try {
            sensor = await getSensorById(sensorId ?? "null");
            const measurementsData = await getSensorMeasurementsPage(sensorId ?? "null", currentPage, measurementsPerPage);
            measurements = measurementsData.measurements;
            totalMeasurements = measurementsData.total;
            selectedMeasurementIds = [];
        } catch (e) {
            error = (e as Error).message || 'Nepodarilo sa načítať dáta';
        } finally {
            loading = false;
        }
    }

    async function goToPage(page: number) {
        if (page >= 1 && page <= totalPages) {
            currentPage = page;
            await loadSensorData();
        }
    }

    function toggleMeasurementSelection(measurementId: string) {
        if (selectedMeasurementIds.includes(measurementId)) {
            selectedMeasurementIds = selectedMeasurementIds.filter((id) => id !== measurementId);
            return;
        }

        selectedMeasurementIds = [...selectedMeasurementIds, measurementId];
    }

    function toggleSelectAllMeasurements() {
        if (allVisibleMeasurementsSelected) {
            selectedMeasurementIds = [];
            return;
        }

        selectedMeasurementIds = measurements.map((measurement) => measurement._id);
    }

    async function handleDeleteSelectedMeasurements() {
        if (selectedMeasurementIds.length === 0) {
            return;
        }

        if (!confirm(`Naozaj chcete vymazať ${selectedMeasurementIds.length} vybraných meraní?`)) {
            return;
        }

        if (!sensor) return;

        deletingMeasurements = true;
        try {
            const { deletedCount } = await deleteMeasurements(sensor._id, selectedMeasurementIds);
            const nextTotal = Math.max(totalMeasurements - deletedCount, 0);
            const nextTotalPages = Math.max(1, Math.ceil(nextTotal / measurementsPerPage));

            currentPage = Math.min(currentPage, nextTotalPages);
            await loadSensorData();
        } catch (e) {
            error = (e as Error).message || 'Nepodarilo sa vymazať merania';
        } finally {
            deletingMeasurements = false;
        }
    }
    
    function copyApiKey() {
        if (sensor) {
            navigator.clipboard.writeText(sensor.apiKey);
        }
    }

    function copyMacAddress() {
        if (sensor) {
            navigator.clipboard.writeText(sensor.macAddress);
        }
    }
    
    function formatDate(dateStr: string): string {
        return new Date(dateStr).toLocaleString('sk-SK');
    }
    
    function getSensorTypeLabel(type: string): string {
        const labels: Record<string, string> = {
            HladinomerESP: '📊 Hladinomer ESP',
            temperature: '🌡️ Teplota',
            humidity: '💧 Vlhkosť',
            pressure: '📊 Tlak',
            level: '📏 Hladina',
            motion: '🚶 Pohyb',
            other: '📍 Iné'
        };
        return labels[type] || type;
    }
    
    function getSensorUnit(type: string): string {
        const units: Record<string, string> = {
            HladinomerESP: 'cm',
            temperature: '°C',
            humidity: '%',
            pressure: 'hPa',
            level: 'cm',
            motion: '',
            other: ''
        };
        return units[type] || '';
    }
</script>

<!-- ============================================ -->
<!-- STYLES                                      -->
<!-- ============================================ -->
<style>
    .sensor-detail-page {
        padding: var(--space-4);
        max-width: 1200px;
        margin: 0 auto;
    }
    
    .back-link {
        display: inline-flex;
        align-items: center;
        gap: var(--space-2);
        color: var(--color-primary);
        text-decoration: none;
        margin-bottom: var(--space-4);
        font-weight: 500;
    }
    
    .back-link:hover {
        text-decoration: underline;
    }
    
    .sensor-header-card {
        background: var(--color-bg-primary);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-lg);
        padding: var(--space-6);
        margin-bottom: var(--space-6);
    }
    
    .sensor-title {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--space-4);
    }
    
    .sensor-name {
        font-size: var(--font-size-2xl);
        font-weight: 700;
        color: var(--color-text-primary);
    }
    
    .sensor-status {
        padding: var(--space-1) var(--space-3);
        border-radius: var(--radius-full);
        font-size: var(--font-size-sm);
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
    
    .sensor-details {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: var(--space-4);
        margin-bottom: var(--space-6);
    }
    
    .detail-item {
        display: flex;
        flex-direction: column;
        gap: var(--space-1);
    }
    
    .detail-label {
        font-size: var(--font-size-sm);
        color: var(--color-text-secondary);
    }
    
    .detail-value {
        font-size: var(--font-size-base);
        font-weight: 500;
        color: var(--color-text-primary);
    }
    
    .api-key-section {
        background: var(--color-bg-secondary);
        padding: var(--space-4);
        border-radius: var(--radius-md);
    }
    
    .api-key-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--space-2);
    }
    
    .api-key-label {
        font-weight: 600;
        color: var(--color-text-primary);
    }
    
    .api-key-actions {
        display: flex;
        gap: var(--space-2);
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
    
    .btn-secondary {
        background: var(--color-bg-primary);
        color: var(--color-text-primary);
        border: 1px solid var(--color-border);
    }
    
    .btn-primary {
        background: var(--color-primary);
        color: white;
    }
    
    .api-key-value {
        font-family: monospace;
        font-size: var(--font-size-sm);
        word-break: break-all;
        background: var(--color-bg-primary);
        padding: var(--space-3);
        border-radius: var(--radius-sm);
        margin-top: var(--space-2);
    }
    
    .api-key-hidden {
        color: var(--color-text-muted);
    }
    
    /* Measurements Section */
    .measurements-section {
        background: var(--color-bg-primary);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-lg);
        padding: var(--space-6);
    }
    
    .section-title {
        font-size: var(--font-size-xl);
        font-weight: 600;
        color: var(--color-text-primary);
    }

    .measurements-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: var(--space-4);
        margin-bottom: var(--space-4);
        flex-wrap: wrap;
    }

    .measurements-actions {
        display: flex;
        gap: var(--space-2);
        align-items: center;
        margin-left: auto;
        flex-wrap: wrap;
    }

    .selection-count {
        font-size: var(--font-size-sm);
        color: var(--color-text-secondary);
    }
    
    .measurements-table {
        width: 100%;
        border-collapse: collapse;
    }
    
    .measurements-table th,
    .measurements-table td {
        padding: var(--space-3);
        text-align: left;
        border-bottom: 1px solid var(--color-border);
    }
    
    .measurements-table th {
        background: var(--color-bg-secondary);
        font-weight: 600;
        color: var(--color-text-secondary);
        font-size: var(--font-size-sm);
    }
    
    .measurements-table td {
        color: var(--color-text-primary);
    }
    
    .measurement-value {
        font-weight: 600;
        font-size: var(--font-size-lg);
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
        font-size: 3rem;
        margin-bottom: var(--space-4);
    }

    .offline-notice {
        background: #fff3cd;
        border: 1px solid #ffc107;
        border-radius: var(--radius-lg);
        padding: var(--space-4);
        margin-bottom: var(--space-6);
        display: flex;
        align-items: center;
        gap: var(--space-3);
    }

    .offline-notice-icon {
        font-size: 1.5rem;
        flex-shrink: 0;
    }

    .offline-notice-text {
        color: #856404;
        font-weight: 600;
    }

    .status-offline {
        background: #fff3cd;
        color: #856404;
    }

    /* Pagination */
    .pagination {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: var(--space-2);
        margin-top: var(--space-4);
        flex-wrap: wrap;
    }

    .pagination-info {
        font-size: var(--font-size-sm);
        color: var(--color-text-secondary);
    }

    .btn-pagination {
        padding: var(--space-2) var(--space-3);
        font-size: var(--font-size-sm);
    }

    .btn-pagination:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .checkbox-cell {
        width: 56px;
        text-align: center;
    }

    .measurement-checkbox {
        width: 18px;
        height: 18px;
        cursor: pointer;
    }

    .btn-danger {
        background: #dc3545;
        color: white;
    }

    .btn-danger:disabled,
    .btn-secondary:disabled,
    .btn-primary:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
</style>

<!-- ============================================ -->
<!-- TEMPLATE                                    -->
<!-- ============================================ -->
<div class="sensor-detail-page">
    <a href="/sensors" class="back-link" on:click|preventDefault={() => goto('/sensors')}>
        ← Späť na senzory
    </a>
    
    {#if loading}
        <div class="loading-container">
            <div class="loading-spinner"></div>
            <p>Načítavam dáta senzora...</p>
        </div>
    {:else if error}
        <div class="error-container">
            <p class="form-error">{error}</p>
            <button class="btn btn-primary" on:click={loadSensorData}>Skúsiť znova</button>
        </div>
    {:else if sensor}
        {#if offline}
            <div class="offline-notice">
                <span class="offline-notice-icon">⚠️</span>
                <span class="offline-notice-text">Nedá sa načítať nové dáta — ste offline. Zobrazujú sa uložené dáta.</span>
            </div>
        {/if}
        <!-- Sensor Info Card -->
        <div class="sensor-header-card">
            <div class="sensor-title">
                <h1 class="sensor-name">{sensor.name}</h1>
                {#if offline}
                    <span class="sensor-status status-offline">Nedá sa zistiť</span>
                {:else}
                    <span class="sensor-status" class:status-active={sensor.isActive} class:status-inactive={!sensor.isActive}>
                        {sensor.isActive ? 'Aktívny' : 'Neaktívny'}
                    </span>
                {/if}
            </div>
            
            <div class="sensor-details">
                <div class="detail-item">
                    <span class="detail-label">📏 Výška Nádrže</span>
                    <span class="detail-value">{sensor.tankHeight} cm</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">🔧 Typ</span>
                    <span class="detail-value">{getSensorTypeLabel(sensor.type)}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">📅 Vytvorené</span>
                    <span class="detail-value">{formatDate(sensor.createdAt)}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">📊 Počet meraní</span>
                    <span class="detail-value">{measurements.length}</span>
                </div>
            </div>
            
            <div class="api-key-section">
                <div class="api-key-header">
                    <span class="api-key-label">🔑 API Kľúč pre senzor</span>
                    <div class="api-key-actions">
                        <button class="btn btn-small btn-secondary" on:click={() => showApiKey = !showApiKey}>
                            {showApiKey ? '👁️ Skryť' : '👁️ Zobraziť'}
                        </button>
                        <button class="btn btn-small btn-secondary" on:click={copyApiKey}>
                            📋 Kopírovať
                        </button>
                    </div>
                </div>
                <div class="api-key-value">
                    {#if showApiKey}
                        {sensor.apiKey}
                    {:else}
                        <span class="api-key-hidden">••••••••••••••••••••••••••••••••</span>
                    {/if}
                </div>
            </div>

            <div class="api-key-section">
                <div class="api-key-header">
                    <span class="api-key-label">🔌 MAC Adresa</span>
                    <div class="api-key-actions">
                        <button class="btn btn-small btn-secondary" on:click={() => showMacAddress = !showMacAddress}>
                            {showMacAddress ? '👁️ Skryť' : '👁️ Zobraziť'}
                        </button>
                            <button class="btn btn-small btn-secondary" on:click={copyMacAddress}>
                                📋 Kopírovať
                        </button>
                    </div>
                </div>
                <div class="api-key-value">
                    {#if showMacAddress}
                        {sensor.macAddress}
                    {:else}
                        <span class="api-key-hidden">••••••••••••••••••••••••••••••••</span>
                    {/if}
                </div>
            </div>
        </div>
        
        <!-- Measurements Section -->
        <div class="measurements-section">
            <div class="measurements-header">
                <h2 class="section-title">📊 Merania (Posledných {measurementsPerPage})</h2>
                {#if !offline && measurements.length > 0}
                    <div class="measurements-actions">
                        <span class="selection-count">Zvolené: {selectedMeasurementIds.length}</span>
                        <button class="btn btn-secondary" on:click={toggleSelectAllMeasurements} disabled={deletingMeasurements}>
                            {allVisibleMeasurementsSelected ? 'Zrušiť výber všetkých' : 'Zvoliť všetky'}
                        </button>
                        <button class="btn btn-danger" on:click={handleDeleteSelectedMeasurements} disabled={selectedMeasurementIds.length === 0 || deletingMeasurements}>
                            {deletingMeasurements ? 'Mažem...' : 'Vymazať všetky zvolené'}
                        </button>
                    </div>
                {/if}
            </div>
            
            {#if measurements.length === 0}
                <div class="empty-state">
                    <div class="empty-icon">📉</div>
                    <h3>Zatiaľ žiadne merania</h3>
                    <p>Tento senzor ešte neodoslal žiadne dáta. Použite API kľúč vyššie pre odosielanie meraní.</p>
                </div>
            {:else}
                <table class="measurements-table">
                    <thead>
                        <tr>
                            {#if !offline}
                                <th class="checkbox-cell">Výber</th>
                            {/if}
                            <th>Hodnota</th>
                            <th>Čas merania</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each measurements as measurement (measurement._id)}
                            <tr>
                                {#if !offline}
                                    <td class="checkbox-cell">
                                        <input
                                            class="measurement-checkbox"
                                            type="checkbox"
                                            checked={selectedMeasurementIds.includes(measurement._id)}
                                            on:change={() => toggleMeasurementSelection(measurement._id)}
                                            disabled={deletingMeasurements}
                                            aria-label={`Vybrať meranie z ${formatDate(measurement.timestamp)}`}
                                        />
                                    </td>
                                {/if}
                                <td>
                                    <span class="measurement-value">
                                        {measurement.value} {getSensorUnit(sensor.type)}
                                    </span>
                                </td>
                                <td>{formatDate(measurement.timestamp)}</td>
                            </tr>
                        {/each}
                    </tbody>
                </table>

                {#if totalPages > 1}
                    <div class="pagination">
                        <button 
                            class="btn btn-secondary btn-pagination" 
                            on:click={() => goToPage(currentPage - 1)}
                            disabled={currentPage === 1 || loading}
                        >
                            ← Predchádzajúca
                        </button>
                        <span class="pagination-info">
                            Strana {currentPage} z {totalPages} (spolu {totalMeasurements} meraní)
                        </span>
                        <button 
                            class="btn btn-secondary btn-pagination" 
                            on:click={() => goToPage(currentPage + 1)}
                            disabled={currentPage === totalPages || loading}
                        >
                            Ďalšia →
                        </button>
                    </div>
                {/if}
            {/if}
        </div>
    {/if}
</div>
