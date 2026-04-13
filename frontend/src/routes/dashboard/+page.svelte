<!--
  Dashboard Page - Sensor data visualization with graphs
-->
<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { isAuthenticated, isAdmin, user } from '$lib/stores/auth';
    import { getSensors, getSensorMeasurements, type Sensor, type Measurement } from '$lib/api';

    // ============================================
    // STATE
    // ============================================
    
    let sensors: Sensor[] = [];
    let selectedSensorId: string = '';
    let measurements: Measurement[] = [];
    let loading = true;
    let loadingMeasurements = false;
    let error = '';

    // Command editor state
    let showCommandEditor = false;

    // Canvas references
    let distanceCanvas: HTMLCanvasElement;
    let percentCanvas: HTMLCanvasElement;

    // Sensor config (pre výpočet % naplnenia)
    const TANK_HEIGHT_CM = 200; // celková výška nádrže v cm
    
    // ============================================
    // LIFECYCLE
    // ============================================
    
    onMount(async () => {
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
            if (sensors.length > 0) {
                selectedSensorId = sensors[0]._id;
                await loadMeasurements();
            }
        } catch (e) {
            error = (e as Error).message || 'Nepodarilo sa načítať senzory';
        } finally {
            loading = false;
        }
    }

    async function loadMeasurements() {
        if (!selectedSensorId) return;
        loadingMeasurements = true;
        try {
            measurements = await getSensorMeasurements(selectedSensorId);
            // Sort by timestamp ascending for graphs
            measurements = measurements.sort((a, b) => 
                new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
            );
            // Draw graphs after data loads
            requestAnimationFrame(() => {
                drawDistanceGraph();
                drawPercentGraph();
            });
        } catch (e) {
            error = (e as Error).message || 'Nepodarilo sa načítať merania';
        } finally {
            loadingMeasurements = false;
        }
    }

    async function handleSensorChange() {
        await loadMeasurements();
    }

    function formatDate(dateStr: string): string {
        return new Date(dateStr).toLocaleString('sk-SK');
    }

    function formatShortDate(dateStr: string): string {
        const d = new Date(dateStr);
        return `${d.getDate()}.${d.getMonth()+1} ${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
    }

    function calculatePercent(distanceCm: number): number {
        // Vzdialenosť od senzora k hladine → čím menšia vzdialenosť, tým viac naplnená
        const filled = TANK_HEIGHT_CM - distanceCm;
        const percent = (filled / TANK_HEIGHT_CM) * 100;
        return Math.max(0, Math.min(100, parseFloat(percent.toFixed(1))));
    }

    // ============================================
    // GRAPH DRAWING
    // ============================================

    function drawDistanceGraph() {
        if (!distanceCanvas || measurements.length === 0) return;
        const ctx = distanceCanvas.getContext('2d');
        if (!ctx) return;

        const w = distanceCanvas.width = distanceCanvas.offsetWidth * 2;
        const h = distanceCanvas.height = 400;
        const padding = { top: 30, right: 30, bottom: 60, left: 60 };
        const graphW = w - padding.left - padding.right;
        const graphH = h - padding.top - padding.bottom;

        ctx.clearRect(0, 0, w, h);
        ctx.scale(1, 1);

        const values = measurements.map(m => m.value);
        const minVal = Math.max(0, Math.min(...values) - 10);
        const maxVal = Math.max(...values) + 10;

        // Grid lines
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 5; i++) {
            const y = padding.top + (i / 5) * graphH;
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(padding.left + graphW, y);
            ctx.stroke();

            // Y axis labels
            const val = maxVal - (i / 5) * (maxVal - minVal);
            ctx.fillStyle = '#6b7280';
            ctx.font = '22px sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(`${val.toFixed(0)} cm`, padding.left - 8, y + 5);
        }

        // Data line
        ctx.strokeStyle = '#4361ee';
        ctx.lineWidth = 3;
        ctx.beginPath();
        measurements.forEach((m, i) => {
            const x = padding.left + (i / (measurements.length - 1 || 1)) * graphW;
            const y = padding.top + ((maxVal - m.value) / (maxVal - minVal || 1)) * graphH;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();

        // Data points
        ctx.fillStyle = '#4361ee';
        measurements.forEach((m, i) => {
            const x = padding.left + (i / (measurements.length - 1 || 1)) * graphW;
            const y = padding.top + ((maxVal - m.value) / (maxVal - minVal || 1)) * graphH;
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fill();
        });

        // X axis labels (show a few)
        ctx.fillStyle = '#6b7280';
        ctx.font = '20px sans-serif';
        ctx.textAlign = 'center';
        const step = Math.max(1, Math.floor(measurements.length / 6));
        for (let i = 0; i < measurements.length; i += step) {
            const x = padding.left + (i / (measurements.length - 1 || 1)) * graphW;
            ctx.save();
            ctx.translate(x, h - padding.bottom + 15);
            ctx.rotate(-0.5);
            ctx.fillText(formatShortDate(measurements[i].timestamp), 0, 0);
            ctx.restore();
        }

        // Title
        ctx.fillStyle = '#1f2937';
        ctx.font = 'bold 26px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Vzdialenosť (cm) v čase', w / 2, 22);
    }

    function drawPercentGraph() {
        if (!percentCanvas || measurements.length === 0) return;
        const ctx = percentCanvas.getContext('2d');
        if (!ctx) return;

        const w = percentCanvas.width = percentCanvas.offsetWidth * 2;
        const h = percentCanvas.height = 400;
        const padding = { top: 30, right: 30, bottom: 60, left: 60 };
        const graphW = w - padding.left - padding.right;
        const graphH = h - padding.top - padding.bottom;

        ctx.clearRect(0, 0, w, h);

        // Grid lines
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 5; i++) {
            const y = padding.top + (i / 5) * graphH;
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(padding.left + graphW, y);
            ctx.stroke();

            const val = 100 - (i / 5) * 100;
            ctx.fillStyle = '#6b7280';
            ctx.font = '22px sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(`${val.toFixed(0)}%`, padding.left - 8, y + 5);
        }

        // Data line - fill gradient below
        const percentValues = measurements.map(m => calculatePercent(m.value));

        // Fill area
        ctx.beginPath();
        measurements.forEach((m, i) => {
            const x = padding.left + (i / (measurements.length - 1 || 1)) * graphW;
            const pct = percentValues[i];
            const y = padding.top + ((100 - pct) / 100) * graphH;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.lineTo(padding.left + graphW, padding.top + graphH);
        ctx.lineTo(padding.left, padding.top + graphH);
        ctx.closePath();
        const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + graphH);
        gradient.addColorStop(0, 'rgba(16, 185, 129, 0.3)');
        gradient.addColorStop(1, 'rgba(16, 185, 129, 0.02)');
        ctx.fillStyle = gradient;
        ctx.fill();

        // Line
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 3;
        ctx.beginPath();
        measurements.forEach((m, i) => {
            const x = padding.left + (i / (measurements.length - 1 || 1)) * graphW;
            const pct = percentValues[i];
            const y = padding.top + ((100 - pct) / 100) * graphH;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();

        // Points
        ctx.fillStyle = '#10b981';
        measurements.forEach((m, i) => {
            const x = padding.left + (i / (measurements.length - 1 || 1)) * graphW;
            const pct = percentValues[i];
            const y = padding.top + ((100 - pct) / 100) * graphH;
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fill();
        });

        // X axis labels
        ctx.fillStyle = '#6b7280';
        ctx.font = '20px sans-serif';
        ctx.textAlign = 'center';
        const step = Math.max(1, Math.floor(measurements.length / 6));
        for (let i = 0; i < measurements.length; i += step) {
            const x = padding.left + (i / (measurements.length - 1 || 1)) * graphW;
            ctx.save();
            ctx.translate(x, h - padding.bottom + 15);
            ctx.rotate(-0.5);
            ctx.fillText(formatShortDate(measurements[i].timestamp), 0, 0);
            ctx.restore();
        }

        // Title
        ctx.fillStyle = '#1f2937';
        ctx.font = 'bold 26px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('% naplnenia v čase', w / 2, 22);
    }
</script>

<!-- ============================================ -->
<!-- STYLES                                      -->
<!-- ============================================ -->
<style>
    .dashboard-page {
        padding: 1.5rem;
        max-width: 1200px;
        margin: 0 auto;
    }
    
    .page-header {
        margin-bottom: 1.5rem;
    }
    
    .page-title {
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--color-text-primary, #1f2937);
        margin-bottom: 0.5rem;
    }

    .controls-row {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 1.5rem;
        flex-wrap: wrap;
    }

    .sensor-select {
        padding: 0.5rem 1rem;
        border: 2px solid var(--color-border, #e5e7eb);
        border-radius: 8px;
        font-size: 1rem;
        min-width: 250px;
        background: white;
    }

    .sensor-select:focus {
        outline: none;
        border-color: var(--color-primary, #4361ee);
    }

    .btn {
        padding: 0.5rem 1rem;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        border: none;
        font-size: 0.875rem;
        transition: all 0.15s;
    }
    
    .btn-primary {
        background: var(--color-primary, #4361ee);
        color: white;
    }

    .btn-primary:hover {
        background: var(--color-secondary, #3a0ca3);
    }
    
    .btn-secondary {
        background: var(--color-bg-secondary, #f9fafb);
        color: var(--color-text-primary, #1f2937);
        border: 1px solid var(--color-border, #e5e7eb);
    }

    .btn-secondary:hover {
        background: var(--color-bg-tertiary, #f3f4f6);
    }

    .controls-right {
        margin-left: auto;
    }

    /* Graphs */
    .graphs-section {
        display: grid;
        grid-template-columns: 1fr;
        gap: 1.5rem;
        margin-bottom: 2rem;
    }

    .graph-card {
        background: white;
        border: 1px solid var(--color-border, #e5e7eb);
        border-radius: 12px;
        padding: 1.5rem;
        overflow: hidden;
    }

    .graph-card canvas {
        width: 100%;
        height: 200px;
        display: block;
    }

    /* Command editor */
    .command-editor {
        background: white;
        border: 1px solid var(--color-border, #e5e7eb);
        border-radius: 12px;
        padding: 1.5rem;
        margin-bottom: 1.5rem;
    }

    .command-editor h3 {
        margin-bottom: 0.75rem;
        font-size: 1.125rem;
    }

    .command-editor textarea {
        width: 100%;
        min-height: 100px;
        padding: 0.75rem;
        border: 2px solid var(--color-border, #e5e7eb);
        border-radius: 8px;
        font-family: monospace;
        resize: vertical;
        box-sizing: border-box;
    }

    .command-editor .todo-badge {
        display: inline-block;
        background: #fef3c7;
        color: #92400e;
        padding: 0.25rem 0.75rem;
        border-radius: 999px;
        font-size: 0.75rem;
        font-weight: 600;
        margin-left: 0.5rem;
    }

    /* Danger section */
    .danger-section {
        background: white;
        border: 2px solid #fecaca;
        border-radius: 12px;
        padding: 1.5rem;
    }

    .danger-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 1rem;
    }

    .danger-header h3 {
        color: #dc2626;
        font-size: 1.125rem;
    }

    .danger-icon {
        font-size: 1.5rem;
    }

    .failure-list {
        list-style: none;
        padding: 0;
    }

    .failure-item {
        padding: 0.75rem;
        background: #fef2f2;
        border-radius: 8px;
        margin-bottom: 0.5rem;
        color: #991b1b;
        font-size: 0.875rem;
    }

    .no-failures {
        color: var(--color-text-secondary, #6b7280);
        text-align: center;
        padding: 1rem;
        font-style: italic;
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
        font-size: 3rem;
        margin-bottom: 0.5rem;
    }

    @media (max-width: 768px) {
        .controls-row {
            flex-direction: column;
            align-items: stretch;
        }

        .controls-right {
            margin-left: 0;
        }

        .sensor-select {
            min-width: auto;
        }
    }
</style>

<!-- ============================================ -->
<!-- TEMPLATE                                    -->
<!-- ============================================ -->
<div class="dashboard-page">
    <div class="page-header">
        <h1 class="page-title">📊 Dashboard</h1>
        <p style="color: var(--color-text-secondary, #6b7280);">Vitaj späť, {$user?.username}!</p>
    </div>
    
    {#if loading}
        <div class="loading-container">
            <div class="loading-spinner"></div>
            <p>Načítavam dashboard...</p>
        </div>
    {:else if error}
        <div class="error-container">
            <p style="color: #dc2626;">{error}</p>
            <button class="btn btn-primary" on:click={loadSensors}>Skúsiť znova</button>
        </div>
    {:else if sensors.length === 0}
        <div class="empty-state">
            <div class="empty-icon">📡</div>
            <h2>Zatiaľ nemáte žiadne senzory</h2>
            <p>Kontaktujte administrátora pre vytvorenie senzora.</p>
        </div>
    {:else}
        <!-- Controls row -->
        <div class="controls-row">
            <select class="sensor-select" bind:value={selectedSensorId} on:change={handleSensorChange}>
                {#each sensors as sensor (sensor._id)}
                    <option value={sensor._id}>{sensor.name} {sensor.location ? `(${sensor.location})` : ''}</option>
                {/each}
            </select>

            <button class="btn btn-secondary" on:click={() => showCommandEditor = !showCommandEditor}>
                📤 Odoslať príkazy senzoru
            </button>

            {#if $isAdmin}
                <div class="controls-right">
                    <button class="btn btn-primary" on:click={() => goto('/sensors')}>
                        ⚙️ Spravovať senzory
                    </button>
                </div>
            {/if}
        </div>

        <!-- Command editor (TODO) -->
        {#if showCommandEditor}
            <div class="command-editor">
                <h3>📤 Príkazy pre senzor <span class="todo-badge">TODO</span></h3>
                <p style="color: var(--color-text-secondary, #6b7280); margin-bottom: 0.5rem; font-size: 0.875rem;">
                    Táto funkcia bude v budúcnosti umožňovať administrátorom posielať príkazy na senzor cez MQTT.
                </p>
                <textarea placeholder="Sem zadaj príkaz pre senzor..." disabled></textarea>
            </div>
        {/if}

        <!-- Graphs -->
        {#if loadingMeasurements}
            <div class="loading-container">
                <div class="loading-spinner"></div>
                <p>Načítavam merania...</p>
            </div>
        {:else if measurements.length === 0}
            <div class="empty-state">
                <div class="empty-icon">📈</div>
                <h2>Zatiaľ žiadne merania</h2>
                <p>Pre tento senzor ešte neboli zaznamenané žiadne merania.</p>
            </div>
        {:else}
            <div class="graphs-section">
                <div class="graph-card">
                    <canvas bind:this={distanceCanvas}></canvas>
                </div>
                <div class="graph-card">
                    <canvas bind:this={percentCanvas}></canvas>
                </div>
            </div>
        {/if}

        <!-- Danger / failures section -->
        <div class="danger-section">
            <div class="danger-header">
                <span class="danger-icon">⚠️</span>
                <h3>Poruchy a upozornenia</h3>
            </div>
            <div class="no-failures">
                Žiadne poruchy neboli detekované. Detekcia porúch bude doplnená v budúcnosti.
            </div>
        </div>
    {/if}
</div>
