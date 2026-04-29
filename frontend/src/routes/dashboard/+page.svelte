<!--
  Dashboard Page - Sensor data visualization with graphs
-->
<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { isAuthenticated, isAdmin, user } from '$lib/stores/auth';
    import { isOnline } from '$lib/stores/offline';
    import { getSensors, getSensorMeasurements, getSentNotifications, type Sensor, type Measurement, type SentNotification } from '$lib/api';

    interface LegendItem {
        label: string;
        value: string;
        accent: string;
    }

    // ============================================
    // STATE
    // ============================================
    
    let sensors: Sensor[] = [];
    let selectedSensorId: string = '';
    let measurements: Measurement[] = [];
    let loading = true;
    let loadingMeasurements = false;
    let error = '';
    let offline = false;
    let notifications: SentNotification[] = [];

    // Canvas references
    let distanceCanvas: HTMLCanvasElement;
    let percentCanvas: HTMLCanvasElement;

    // Sensor config (pre výpočet % naplnenia)
    // NOTE: tankHeight is now dynamically taken from the selected sensor

    $: offline = !$isOnline;
    $: selectedSensor = sensors.find((sensor) => sensor._id === selectedSensorId) ?? null;
    $: distanceLegend = createDistanceLegend(measurements);
    $: percentLegend = createPercentLegend(measurements);
    
    // ============================================
    // LIFECYCLE
    // ============================================
    
    onMount(() => {
        if (!$isAuthenticated) {
            goto('/login');
            return;
        }

        const handleResize = () => {
            if (measurements.length > 0) {
                requestAnimationFrame(() => {
                    drawDistanceGraph();
                    drawPercentGraph();
                });
            }
        };

        window.addEventListener('resize', handleResize);

        void loadSensors();

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    });
    
    // ============================================
    // FUNCTIONS
    // ============================================
    
    async function loadSensors() {
        loading = true;
        error = '';
        try {
            sensors = await getSensors();

            try {
                notifications = await getSentNotifications();
            } catch (notificationError) {
                notifications = [];
            }

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

    function formatNotificationCategory(category: SentNotification['category']): string {
        if (category === 'threshold') return 'Prahové upozornenie';
        if (category === 'daily') return 'Denný prehľad';
        return 'Manuálne odoslanie';
    }

    function calculatePercent(distanceCm: number): number {
        // Vzdialenosť od senzora k hladine → čím menšia vzdialenosť, tým viac naplnená
        const tankHeight = selectedSensor?.tankHeight || 200; // fallback to 200 if not set
        const filled = tankHeight - distanceCm;
        const percent = (filled / tankHeight) * 100;
        return Math.max(0, Math.min(100, parseFloat(percent.toFixed(1))));
    }

    function createDistanceLegend(data: Measurement[]): LegendItem[] {
        if (data.length === 0) {
            return [];
        }

        const values = data.map((measurement) => measurement.value);
        const latest = values[values.length - 1];

        return [
            { label: 'Posledné meranie', value: `${latest.toFixed(1)} cm`, accent: '#2563eb' },
            { label: 'Minimum', value: `${Math.min(...values).toFixed(1)} cm`, accent: '#0f766e' },
            { label: 'Maximum', value: `${Math.max(...values).toFixed(1)} cm`, accent: '#b45309' },
            { label: 'Vzorky', value: `${data.length}`, accent: '#475569' }
        ];
    }

    function createPercentLegend(data: Measurement[]): LegendItem[] {
        if (data.length === 0) {
            return [];
        }

        const values = data.map((measurement) => calculatePercent(measurement.value));
        const latest = values[values.length - 1];
        const tankHeight = selectedSensor?.tankHeight || 200;

        return [
            { label: 'Aktuálne naplnenie', value: `${latest.toFixed(1)}%`, accent: '#059669' },
            { label: 'Minimum', value: `${Math.min(...values).toFixed(1)}%`, accent: '#0f766e' },
            { label: 'Maximum', value: `${Math.max(...values).toFixed(1)}%`, accent: '#ca8a04' },
            { label: 'Kapacita nádrže', value: `${tankHeight} cm`, accent: '#475569' }
        ];
    }

    function setupCanvas(canvas: HTMLCanvasElement) {
        const context = canvas.getContext('2d');
        if (!context) {
            return null;
        }

        const width = Math.max(320, Math.floor(canvas.getBoundingClientRect().width));
        const height = width < 640 ? 280 : 340;
        const ratio = window.devicePixelRatio || 1;

        canvas.width = Math.floor(width * ratio);
        canvas.height = Math.floor(height * ratio);
        context.setTransform(ratio, 0, 0, ratio, 0, 0);
        context.clearRect(0, 0, width, height);

        return {
            context,
            width,
            height,
            padding: {
                top: 20,
                right: width < 640 ? 16 : 24,
                bottom: width < 640 ? 72 : 60,
                left: width < 640 ? 54 : 64
            }
        };
    }

    function drawGraphSurface(
        ctx: CanvasRenderingContext2D,
        width: number,
        height: number,
        accent: string
    ): void {
        const background = ctx.createLinearGradient(0, 0, 0, height);
        background.addColorStop(0, 'rgba(248, 250, 252, 0.98)');
        background.addColorStop(1, 'rgba(241, 245, 249, 0.9)');
        ctx.fillStyle = background;
        ctx.fillRect(0, 0, width, height);

        ctx.strokeStyle = 'rgba(148, 163, 184, 0.18)';
        ctx.lineWidth = 1;
        ctx.strokeRect(0.5, 0.5, width - 1, height - 1);

        ctx.fillStyle = accent;
        ctx.fillRect(0, 0, 8, height);
    }

    function drawLegendBubble(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        label: string,
        color: string
    ): void {
        ctx.save();
        ctx.font = '600 11px system-ui, sans-serif';
        const textWidth = ctx.measureText(label).width;
        const pillWidth = textWidth + 20;
        const pillHeight = 28;
        const left = Math.max(12, Math.min(x - pillWidth / 2, ctx.canvas.width / (window.devicePixelRatio || 1) - pillWidth - 12));
        const top = Math.max(12, y - 42);

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.roundRect(left, top, pillWidth, pillHeight, 14);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, left + pillWidth / 2, top + pillHeight / 2 + 0.5);
        ctx.restore();
    }

    function drawLineChart(options: {
        canvas: HTMLCanvasElement;
        values: number[];
        lineColor: string;
        fillColorTop: string;
        fillColorBottom: string;
        yFormatter: (value: number) => string;
        bubbleLabel: (value: number) => string;
        minValue?: number;
        maxValue?: number;
    }): void {
        if (options.values.length === 0) {
            return;
        }

        const result = setupCanvas(options.canvas);
        if (!result) {
            return;
        }

        const { context: ctx, width, height, padding } = result;
        const graphWidth = width - padding.left - padding.right;
        const graphHeight = height - padding.top - padding.bottom;
        const minimum = options.minValue ?? Math.max(0, Math.min(...options.values) - 10);
        const maximum = options.maxValue ?? Math.max(...options.values) + 10;
        const safeRange = maximum - minimum || 1;
        const step = Math.max(1, Math.ceil(measurements.length / (width < 640 ? 4 : 6)));

        drawGraphSurface(ctx, width, height, options.lineColor);

        ctx.save();
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.32)';
        ctx.setLineDash([4, 6]);
        for (let index = 0; index <= 5; index += 1) {
            const y = padding.top + (index / 5) * graphHeight;
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(padding.left + graphWidth, y);
            ctx.stroke();

            const labelValue = maximum - (index / 5) * safeRange;
            ctx.fillStyle = '#64748b';
            ctx.font = '500 11px system-ui, sans-serif';
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            ctx.fillText(options.yFormatter(labelValue), padding.left - 10, y);
        }
        ctx.restore();

        ctx.strokeStyle = 'rgba(71, 85, 105, 0.25)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padding.left, padding.top + graphHeight);
        ctx.lineTo(padding.left + graphWidth, padding.top + graphHeight);
        ctx.stroke();

        const points = options.values.map((value, index) => {
            const x = padding.left + (index / Math.max(options.values.length - 1, 1)) * graphWidth;
            const y = padding.top + ((maximum - value) / safeRange) * graphHeight;
            return { x, y, value };
        });

        const areaGradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + graphHeight);
        areaGradient.addColorStop(0, options.fillColorTop);
        areaGradient.addColorStop(1, options.fillColorBottom);

        ctx.beginPath();
        points.forEach((point, index) => {
            if (index === 0) {
                ctx.moveTo(point.x, point.y);
            } else {
                ctx.lineTo(point.x, point.y);
            }
        });
        ctx.lineTo(points[points.length - 1].x, padding.top + graphHeight);
        ctx.lineTo(points[0].x, padding.top + graphHeight);
        ctx.closePath();
        ctx.fillStyle = areaGradient;
        ctx.fill();

        ctx.beginPath();
        points.forEach((point, index) => {
            if (index === 0) {
                ctx.moveTo(point.x, point.y);
            } else {
                ctx.lineTo(point.x, point.y);
            }
        });
        ctx.strokeStyle = options.lineColor;
        ctx.lineWidth = 3;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.stroke();

        points.forEach((point, index) => {
            ctx.beginPath();
            ctx.fillStyle = '#ffffff';
            ctx.arc(point.x, point.y, index === points.length - 1 ? 5 : 3.5, 0, Math.PI * 2);
            ctx.fill();

            ctx.beginPath();
            ctx.fillStyle = options.lineColor;
            ctx.arc(point.x, point.y, index === points.length - 1 ? 3.5 : 2.5, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.fillStyle = '#64748b';
        ctx.font = '500 11px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        for (let index = 0; index < measurements.length; index += step) {
            const point = points[index];
            ctx.save();
            ctx.translate(point.x, height - padding.bottom + 18);
            ctx.rotate(width < 640 ? -0.65 : -0.45);
            ctx.fillText(formatShortDate(measurements[index].timestamp), 0, 0);
            ctx.restore();
        }

        const lastPoint = points[points.length - 1];
        drawLegendBubble(ctx, lastPoint.x, lastPoint.y, options.bubbleLabel(lastPoint.value), options.lineColor);
    }

    // ============================================
    // GRAPH DRAWING
    // ============================================

    function drawDistanceGraph() {
        if (!distanceCanvas || measurements.length === 0) return;

        drawLineChart({
            canvas: distanceCanvas,
            values: measurements.map((measurement) => measurement.value),
            lineColor: '#2563eb',
            fillColorTop: 'rgba(37, 99, 235, 0.28)',
            fillColorBottom: 'rgba(37, 99, 235, 0.03)',
            yFormatter: (value) => `${value.toFixed(0)} cm`,
            bubbleLabel: (value) => `${value.toFixed(1)} cm`
        });
    }

    function drawPercentGraph() {
        if (!percentCanvas || measurements.length === 0) return;

        drawLineChart({
            canvas: percentCanvas,
            values: measurements.map((measurement) => calculatePercent(measurement.value)),
            lineColor: '#059669',
            fillColorTop: 'rgba(5, 150, 105, 0.25)',
            fillColorBottom: 'rgba(5, 150, 105, 0.03)',
            yFormatter: (value) => `${value.toFixed(0)}%`,
            bubbleLabel: (value) => `${value.toFixed(1)}%`,
            minValue: 0,
            maxValue: 100
        });
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

    .status-banner {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 1rem;
        padding: 0.9rem 1rem;
        border: 1px solid rgba(217, 119, 6, 0.28);
        border-radius: 16px;
        background: linear-gradient(135deg, rgba(255, 247, 237, 0.96), rgba(254, 243, 199, 0.92));
        color: #9a3412;
        box-shadow: 0 16px 32px rgba(245, 158, 11, 0.12);
    }

    .status-banner strong {
        display: block;
        margin-bottom: 0.1rem;
        color: #7c2d12;
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
        padding: 0.75rem 1rem;
        border: 1px solid rgba(148, 163, 184, 0.4);
        border-radius: 14px;
        font-size: 1rem;
        min-width: 250px;
        background: rgba(255, 255, 255, 0.95);
        box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
    }

    .sensor-select:focus {
        outline: none;
        border-color: var(--color-primary, #4361ee);
    }

    .btn {
        padding: 0.7rem 1rem;
        border-radius: 12px;
        font-weight: 600;
        cursor: pointer;
        border: none;
        font-size: 0.875rem;
        transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
    }

    .btn:hover {
        transform: translateY(-1px);
    }
    
    .btn-primary {
        background: var(--color-primary, #4361ee);
        color: white;
        box-shadow: 0 14px 28px rgba(67, 97, 238, 0.22);
    }

    .btn-primary:hover {
        background: var(--color-secondary, #3a0ca3);
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
        background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.96));
        border: 1px solid rgba(148, 163, 184, 0.2);
        border-radius: 24px;
        padding: 1.25rem;
        overflow: hidden;
        box-shadow: 0 20px 40px rgba(15, 23, 42, 0.08);
    }

    .graph-card.distance {
        border-top: 4px solid #2563eb;
    }

    .graph-card.percent {
        border-top: 4px solid #059669;
    }

    .graph-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 1rem;
        margin-bottom: 1rem;
    }

    .graph-title-block h2 {
        margin: 0;
        font-size: 1.1rem;
        color: #0f172a;
    }

    .graph-title-block p {
        margin: 0.35rem 0 0;
        color: #64748b;
        font-size: 0.92rem;
    }

    .graph-chip {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        padding: 0.45rem 0.75rem;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.9);
        border: 1px solid rgba(148, 163, 184, 0.28);
        color: #334155;
        font-size: 0.82rem;
        font-weight: 700;
        white-space: nowrap;
    }

    .graph-legend {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
        margin-bottom: 1rem;
    }

    .legend-item {
        display: flex;
        align-items: center;
        gap: 0.7rem;
        min-width: 0;
        flex: 1 1 220px;
        padding: 0.85rem 1rem;
        border-radius: 18px;
        background: rgba(255, 255, 255, 0.82);
        border: 1px solid rgba(226, 232, 240, 0.95);
    }

    .legend-swatch {
        width: 0.8rem;
        height: 0.8rem;
        border-radius: 999px;
        flex-shrink: 0;
        box-shadow: 0 0 0 5px rgba(255, 255, 255, 0.92);
    }

    .legend-text {
        min-width: 0;
    }

    .legend-label {
        display: block;
        color: #64748b;
        font-size: 0.8rem;
        margin-bottom: 0.15rem;
    }

    .legend-value {
        display: block;
        color: #0f172a;
        font-size: 1rem;
        font-weight: 700;
    }

    .graph-card canvas {
        width: 100%;
        height: 340px;
        display: block;
        border-radius: 18px;
    }

    /* Danger section */
    .danger-section {
        background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(254, 242, 242, 0.92));
        border: 1px solid rgba(252, 165, 165, 0.65);
        border-radius: 24px;
        padding: 1.5rem;
        box-shadow: 0 18px 36px rgba(127, 29, 29, 0.08);
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

    .no-failures {
        color: var(--color-text-secondary, #6b7280);
        text-align: center;
        padding: 1rem;
        font-style: italic;
    }

    .notification-list {
        display: grid;
        gap: 0.9rem;
    }

    .notification-item {
        padding: 1rem 1.1rem;
        border-radius: 18px;
        background: rgba(255, 255, 255, 0.82);
        border: 1px solid rgba(252, 165, 165, 0.4);
    }

    .notification-item-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
        margin-bottom: 0.35rem;
        flex-wrap: wrap;
    }

    .notification-item-header strong {
        color: #7f1d1d;
    }

    .notification-meta {
        color: #991b1b;
        font-size: 0.82rem;
        font-weight: 600;
    }

    .notification-body {
        margin: 0;
        color: #450a0a;
        line-height: 1.5;
    }

    .notification-footnote {
        margin-top: 0.5rem;
        color: #7f1d1d;
        font-size: 0.8rem;
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
        .dashboard-page {
            padding: 1rem;
        }

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

        .graph-header {
            flex-direction: column;
        }

        .graph-card {
            padding: 1rem;
            border-radius: 20px;
        }

        .graph-card canvas {
            height: 280px;
        }

        .legend-item {
            flex-basis: 100%;
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

    {#if offline}
        <div class="status-banner">
            <span>⚠️</span>
            <div>
                <strong>Aplikácia je offline.</strong>
                <span>Zobrazuju sa naposledy uložené dáta a cacheované súbory.</span>
            </div>
        </div>
    {/if}
    
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
                    <option value={sensor._id}>{sensor.name} </option>
                {/each}
            </select>

            {#if $isAdmin}
                <div class="controls-right">
                    <button class="btn btn-primary" on:click={() => goto('/sensors')}>
                        ⚙️ Spravovať senzory
                    </button>
                </div>
            {/if}
        </div>

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
                <div class="graph-card distance">
                    <div class="graph-header">
                        <div class="graph-title-block">
                            <h2>Vývoj vzdialenosti hladiny</h2>
                            <p>{selectedSensor?.name} </p>
                        </div>
                        <div class="graph-chip">Modrá krivka • centimetre</div>
                    </div>
                    <div class="graph-legend">
                        {#each distanceLegend as item}
                            <div class="legend-item">
                                <span class="legend-swatch" style={`background:${item.accent}`}></span>
                                <div class="legend-text">
                                    <span class="legend-label">{item.label}</span>
                                    <span class="legend-value">{item.value}</span>
                                </div>
                            </div>
                        {/each}
                    </div>
                    <canvas bind:this={distanceCanvas}></canvas>
                </div>
                <div class="graph-card percent">
                    <div class="graph-header">
                        <div class="graph-title-block">
                            <h2>Naplnenie nádrže</h2>
                            <p>Prepočet z výšky nádrže {selectedSensor?.tankHeight || 200} cm s trendom v čase</p>
                        </div>
                        <div class="graph-chip">Zelená krivka • percentá</div>
                    </div>
                    <div class="graph-legend">
                        {#each percentLegend as item}
                            <div class="legend-item">
                                <span class="legend-swatch" style={`background:${item.accent}`}></span>
                                <div class="legend-text">
                                    <span class="legend-label">{item.label}</span>
                                    <span class="legend-value">{item.value}</span>
                                </div>
                            </div>
                        {/each}
                    </div>
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
            {#if notifications.length === 0}
                <div class="no-failures">
                    Zatiaľ nebola odoslaná žiadna notifikácia.
                </div>
            {:else}
                <div class="notification-list">
                    {#each notifications as notification (notification._id)}
                        <article class="notification-item">
                            <div class="notification-item-header">
                                <strong>{notification.title}</strong>
                                <span class="notification-meta">{formatDate(notification.createdAt)}</span>
                            </div>
                            <p class="notification-body">{notification.body}</p>
                            <div class="notification-footnote">
                                {formatNotificationCategory(notification.category)}
                                {#if notification.sensorName} • {notification.sensorName}{/if}
                                • doručené zariadenia: {notification.deliveredCount}
                            </div>
                        </article>
                    {/each}
                </div>
            {/if}
        </div>
    {/if}
</div>
