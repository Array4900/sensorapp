<!--
  Dashboard Page - Overview of user's sensors and recent activity
-->
<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { isAuthenticated, user } from '$lib/stores/auth';
    import { getSensors, getSensorMeasurements, type Sensor, type Measurement } from '$lib/api';

    // ============================================
    // STATE
    // ============================================
    
    let sensors: Sensor[] = [];
    let recentMeasurements: { sensor: Sensor; measurement: Measurement }[] = [];
    let loading = true;
    let error = '';
    
    // ============================================
    // LIFECYCLE
    // ============================================
    
    onMount(async () => {
        if (!$isAuthenticated) {
            goto('/login');
            return;
        }
        
        await loadDashboardData();
    });
    
    // ============================================
    // FUNCTIONS
    // ============================================
    
    async function loadDashboardData() {
        loading = true;
        error = '';
        try {
            sensors = await getSensors();
            
            // Load recent measurements from each sensor
            const measurementPromises = sensors.slice(0, 5).map(async (sensor) => {
                try {
                    const measurements = await getSensorMeasurements(sensor._id);
                    if (measurements.length > 0) {
                        return { sensor, measurement: measurements[0] };
                    }
                    return null;
                } catch {
                    return null;
                }
            });
            
            const results = await Promise.all(measurementPromises);
            recentMeasurements = results.filter((r): r is { sensor: Sensor; measurement: Measurement } => r !== null);
        } catch (e) {
            error = (e as Error).message || 'Nepodarilo sa načítať dáta';
        } finally {
            loading = false;
        }
    }
    
    function formatDate(dateStr: string): string {
        return new Date(dateStr).toLocaleString('sk-SK');
    }
    
    function getSensorUnit(type: string): string {
        const units: Record<string, string> = {
            temperature: '°C',
            humidity: '%',
            pressure: 'hPa',
            level: 'cm',
            motion: '',
            other: ''
        };
        return units[type] || '';
    }
    
    function getSensorIcon(type: string): string {
        const icons: Record<string, string> = {
            temperature: '🌡️',
            humidity: '💧',
            pressure: '📊',
            level: '📏',
            motion: '🚶',
            other: '📍'
        };
        return icons[type] || '📡';
    }
</script>

<!-- ============================================ -->
<!-- STYLES                                      -->
<!-- ============================================ -->
<style>
    .dashboard-page {
        padding: var(--space-4);
        max-width: 1200px;
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
    
    .welcome-message {
        color: var(--color-text-secondary);
        font-size: var(--font-size-lg);
    }
    
    /* Stats Grid */
    .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: var(--space-4);
        margin-bottom: var(--space-8);
    }
    
    .stat-card {
        background: var(--color-bg-primary);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-lg);
        padding: var(--space-6);
        text-align: center;
    }
    
    .stat-icon {
        font-size: 2.5rem;
        margin-bottom: var(--space-2);
    }
    
    .stat-value {
        font-size: var(--font-size-3xl);
        font-weight: 700;
        color: var(--color-primary);
    }
    
    .stat-label {
        color: var(--color-text-secondary);
        font-size: var(--font-size-sm);
        margin-top: var(--space-1);
    }
    
    /* Sections */
    .dashboard-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
        gap: var(--space-6);
    }
    
    .section {
        background: var(--color-bg-primary);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-lg);
        overflow: hidden;
    }
    
    .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--space-4);
        border-bottom: 1px solid var(--color-border);
        background: var(--color-bg-secondary);
    }
    
    .section-title {
        font-size: var(--font-size-lg);
        font-weight: 600;
        color: var(--color-text-primary);
    }
    
    .section-link {
        color: var(--color-primary);
        text-decoration: none;
        font-weight: 500;
        font-size: var(--font-size-sm);
    }
    
    .section-link:hover {
        text-decoration: underline;
    }
    
    .section-content {
        padding: var(--space-4);
    }
    
    /* Sensor List */
    .sensor-list {
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
    }
    
    .sensor-item {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        padding: var(--space-3);
        background: var(--color-bg-secondary);
        border-radius: var(--radius-md);
        cursor: pointer;
        transition: all var(--transition-fast);
    }
    
    .sensor-item:hover {
        background: var(--color-bg-tertiary);
    }
    
    .sensor-icon {
        font-size: 1.5rem;
    }
    
    .sensor-info {
        flex: 1;
    }
    
    .sensor-name {
        font-weight: 600;
        color: var(--color-text-primary);
    }
    
    .sensor-location {
        font-size: var(--font-size-sm);
        color: var(--color-text-secondary);
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
    
    /* Recent Measurements */
    .measurement-list {
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
    }
    
    .measurement-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--space-3);
        background: var(--color-bg-secondary);
        border-radius: var(--radius-md);
    }
    
    .measurement-sensor {
        font-weight: 500;
        color: var(--color-text-primary);
    }
    
    .measurement-time {
        font-size: var(--font-size-sm);
        color: var(--color-text-secondary);
    }
    
    .measurement-value {
        font-size: var(--font-size-xl);
        font-weight: 700;
        color: var(--color-primary);
    }
    
    /* Empty States */
    .empty-state {
        text-align: center;
        padding: var(--space-6);
        color: var(--color-text-secondary);
    }
    
    .empty-icon {
        font-size: 2rem;
        margin-bottom: var(--space-2);
    }
    
    .btn {
        padding: var(--space-2) var(--space-4);
        border-radius: var(--radius-md);
        font-weight: 600;
        cursor: pointer;
        transition: all var(--transition-fast);
        border: none;
        text-decoration: none;
        display: inline-block;
    }
    
    .btn-primary {
        background: var(--color-primary);
        color: white;
    }
    
    .btn-primary:hover {
        background: var(--color-primary-dark);
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
    
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
</style>

<!-- ============================================ -->
<!-- TEMPLATE                                    -->
<!-- ============================================ -->
<div class="dashboard-page">
    <div class="page-header">
        <h1 class="page-title">📊 Dashboard</h1>
        <p class="welcome-message">Vitaj späť, {$user?.username}!</p>
    </div>
    
    {#if loading}
        <div class="loading-container">
            <div class="loading-spinner"></div>
            <p>Načítavam dashboard...</p>
        </div>
    {:else if error}
        <div class="error-container">
            <p style="color: var(--color-danger);">{error}</p>
            <button class="btn btn-primary" on:click={loadDashboardData}>Skúsiť znova</button>
        </div>
    {:else}
        <!-- Stats -->
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon">📡</div>
                <div class="stat-value">{sensors.length}</div>
                <div class="stat-label">Celkom senzorov</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">✅</div>
                <div class="stat-value">{sensors.filter(s => s.isActive).length}</div>
                <div class="stat-label">Aktívnych senzorov</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">📈</div>
                <div class="stat-value">{recentMeasurements.length}</div>
                <div class="stat-label">Senzorov s dátami</div>
            </div>
        </div>
        
        <!-- Dashboard Grid -->
        <div class="dashboard-grid">
            <!-- Sensors Section -->
            <div class="section">
                <div class="section-header">
                    <h2 class="section-title">📡 Moje senzory</h2>
                    <a href="/sensors" class="section-link" on:click|preventDefault={() => goto('/sensors')}>
                        Zobraziť všetky →
                    </a>
                </div>
                <div class="section-content">
                    {#if sensors.length === 0}
                        <div class="empty-state">
                            <div class="empty-icon">📡</div>
                            <p>Zatiaľ nemáte žiadne senzory</p>
                            <button class="btn btn-primary" on:click={() => goto('/sensors')}>
                                Pridať senzor
                            </button>
                        </div>
                    {:else}
                        <div class="sensor-list">
                            {#each sensors.slice(0, 5) as sensor (sensor._id)}
                                <div class="sensor-item" role="button" tabindex="0" on:click={() => goto(`/sensors/${sensor._id}`)} on:keydown={(e) => e.key === 'Enter' && goto(`/sensors/${sensor._id}`)}>
                                    <span class="sensor-icon">{getSensorIcon(sensor.type)}</span>
                                    <div class="sensor-info">
                                        <div class="sensor-name">{sensor.name}</div>
                                        <div class="sensor-location">{sensor.location}</div>
                                    </div>
                                    <span class="sensor-status" class:status-active={sensor.isActive} class:status-inactive={!sensor.isActive}>
                                        {sensor.isActive ? 'Aktívny' : 'Neaktívny'}
                                    </span>
                                </div>
                            {/each}
                        </div>
                    {/if}
                </div>
            </div>
            
            <!-- Recent Measurements Section -->
            <div class="section">
                <div class="section-header">
                    <h2 class="section-title">📈 Posledné merania</h2>
                </div>
                <div class="section-content">
                    {#if recentMeasurements.length === 0}
                        <div class="empty-state">
                            <div class="empty-icon">📉</div>
                            <p>Zatiaľ žiadne merania</p>
                        </div>
                    {:else}
                        <div class="measurement-list">
                            {#each recentMeasurements as { sensor, measurement } (measurement._id)}
                                <div class="measurement-item">
                                    <div>
                                        <div class="measurement-sensor">{getSensorIcon(sensor.type)} {sensor.name}</div>
                                        <div class="measurement-time">{formatDate(measurement.timestamp)}</div>
                                    </div>
                                    <div class="measurement-value">
                                        {measurement.value}{getSensorUnit(sensor.type)}
                                    </div>
                                </div>
                            {/each}
                        </div>
                    {/if}
                </div>
            </div>
        </div>
    {/if}
</div>
