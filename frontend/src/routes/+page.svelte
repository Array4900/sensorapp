<!--
  Home Page - domovska stranka aplikacie
  Uses Svelte 5 runes for reactive state
-->
<script lang="ts">
    import { goto } from '$app/navigation';
    import { user, isAuthenticated } from '$lib/stores/auth';
    
    // ============================================
    // FEATURE DATA
    // ============================================
    
    /** Application features for display */
    const features = [
        {
            icon: '📊',
            title: 'Vizualizácia dát',
            description: 'Interaktívne grafy a dashboardy pre sledovanie meraní v reálnom čase.'
        },
        {
            icon: '📡',
            title: 'Správa senzorov',
            description: 'Jednoduché pridávanie a konfigurácia IoT senzorov.'
        },
        {
            icon: '📈',
            title: 'Historické dáta',
            description: 'Prehľadná história meraní s možnosťou exportu a analýzy.'
        },
        {
            icon: '🔔',
            title: 'Notifikácie',
            description: 'Upozornenia pri prekročení nastavených limitov.'
        },

    ] as const;
    
    /** Use case examples */
    const useCases = [
        { icon: '🏠', title: 'Domácnosť', desc: 'Monitorovanie teploty, vlhkosti a sledovanie hladiny žumpy' }
    ] as const;
</script>

<!-- ============================================ -->
<!-- STYLY CSS                              -->
<!-- ============================================ -->
<style>
    /* Container for home page content */
    .home-page {
        max-width: 1200px;
        margin: 0 auto;
    }
    
    /* Hero Section - Main welcome area */
    .hero {
        text-align: center;
        padding: var(--space-12) var(--space-6);
        background: linear-gradient(135deg, var(--color-primary-light), var(--color-bg-secondary));
        border-radius: var(--radius-xl);
        margin-bottom: var(--space-8);
    }
    
    .hero-title {
        font-size: var(--font-size-3xl);
        font-weight: 700;
        color: var(--color-text-primary);
        margin-bottom: var(--space-4);
        line-height: 1.2;
    }
    
    .hero-title span {
        /* Gradient text for emphasis */
        background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }
    
    .hero-description {
        font-size: var(--font-size-lg);
        color: var(--color-text-secondary);
        max-width: 600px;
        margin: 0 auto var(--space-6);
        line-height: 1.6;
    }
    
    .hero-buttons {
        display: flex;
        gap: var(--space-4);
        justify-content: center;
        flex-wrap: wrap;
    }
    
    .hero-btn {
        padding: var(--space-3) var(--space-6);
        font-size: var(--font-size-base);
        font-weight: 600;
        border-radius: var(--radius-md);
        cursor: pointer;
        transition: all var(--transition-fast);
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        gap: var(--space-2);
    }
    
    .hero-btn-primary {
        background-color: var(--color-primary);
        color: white;
        border: none;
    }
    
    .hero-btn-primary:hover {
        background-color: var(--color-primary-hover);
        transform: translateY(-2px);
        box-shadow: var(--shadow-lg);
    }
    
    .hero-btn-secondary {
        background-color: transparent;
        color: var(--color-primary);
        border: 2px solid var(--color-primary);
    }
    
    .hero-btn-secondary:hover {
        background-color: var(--color-primary-light);
    }
    
    /* Welcome Back Section (for logged in users) */
    .welcome-back {
        background: var(--color-bg-primary);
        border-radius: var(--radius-xl);
        padding: var(--space-8);
        margin-bottom: var(--space-8);
        border: 1px solid var(--color-border);
        text-align: center;
    }
    
    .welcome-back h2 {
        font-size: var(--font-size-2xl);
        margin-bottom: var(--space-4);
        color: var(--color-text-primary);
    }
    
    .welcome-back p {
        color: var(--color-text-secondary);
        margin-bottom: var(--space-6);
    }
    
    .quick-actions {
        display: flex;
        gap: var(--space-4);
        justify-content: center;
        flex-wrap: wrap;
    }
    
    .quick-action-btn {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--space-2);
        padding: var(--space-4) var(--space-6);
        background: var(--color-bg-tertiary);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-lg);
        cursor: pointer;
        transition: all var(--transition-fast);
    }
    
    .quick-action-btn:hover {
        border-color: var(--color-primary);
        background: var(--color-primary-light);
        transform: translateY(-2px);
    }
    
    .quick-action-icon {
        font-size: var(--font-size-2xl);
    }
    
    .quick-action-label {
        font-weight: 500;
        color: var(--color-text-primary);
    }
    
    /* Features Section */
    .section-title {
        font-size: var(--font-size-2xl);
        font-weight: 700;
        text-align: center;
        margin-bottom: var(--space-2);
        color: var(--color-text-primary);
    }
    
    .section-subtitle {
        text-align: center;
        color: var(--color-text-secondary);
        margin-bottom: var(--space-8);
    }
    
    .features-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: var(--space-6);
        margin-bottom: var(--space-12);
    }
    
    .feature-card {
        background: var(--color-bg-primary);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-lg);
        padding: var(--space-6);
        transition: all var(--transition-fast);
    }
    
    .feature-card:hover {
        border-color: var(--color-primary);
        transform: translateY(-4px);
        box-shadow: var(--shadow-lg);
    }
    
    .feature-icon {
        font-size: 2.5rem;
        margin-bottom: var(--space-4);
    }
    
    .feature-title {
        font-size: var(--font-size-lg);
        font-weight: 600;
        margin-bottom: var(--space-2);
        color: var(--color-text-primary);
    }
    
    .feature-description {
        color: var(--color-text-secondary);
        font-size: var(--font-size-sm);
        line-height: 1.6;
    }
    
    /* Use Cases Section */
    .use-cases {
        background: var(--color-bg-primary);
        border-radius: var(--radius-xl);
        padding: var(--space-8);
        margin-bottom: var(--space-8);
        border: 1px solid var(--color-border);
    }
    
    .use-cases-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: var(--space-6);
    }
    
    .use-case {
        text-align: center;
        padding: var(--space-4);
    }
    
    .use-case-icon {
        font-size: 3rem;
        margin-bottom: var(--space-3);
    }
    
    .use-case-title {
        font-weight: 600;
        margin-bottom: var(--space-2);
        color: var(--color-text-primary);
    }
    
    .use-case-desc {
        font-size: var(--font-size-sm);
        color: var(--color-text-secondary);
    }
    
    /* CTA Section */
    .cta-section {
        background: var(--sidebar-bg);
        border-radius: var(--radius-xl);
        padding: var(--space-10);
        text-align: center;
        color: white;
    }
    
    .cta-title {
        font-size: var(--font-size-2xl);
        font-weight: 700;
        margin-bottom: var(--space-4);
    }
    
    .cta-description {
        opacity: 0.9;
        margin-bottom: var(--space-6);
        max-width: 500px;
        margin-left: auto;
        margin-right: auto;
    }
    
    .cta-btn {
        background: white;
        color: var(--color-primary);
        padding: var(--space-3) var(--space-8);
        font-size: var(--font-size-base);
        font-weight: 600;
        border: none;
        border-radius: var(--radius-md);
        cursor: pointer;
        transition: all var(--transition-fast);
    }
    
    .cta-btn:hover {
        transform: scale(1.05);
        box-shadow: var(--shadow-lg);
    }
    
    /* Responsive adjustments */
    @media (max-width: 768px) {
        .hero-title {
            font-size: var(--font-size-2xl);
        }
        
        .hero-description {
            font-size: var(--font-size-base);
        }
        
        .features-grid {
            grid-template-columns: 1fr;
        }
    }
</style>

<!-- ============================================ -->
<!-- PAGE CONTENT                                -->
<!-- ============================================ -->

<div class="home-page">
    {#if $isAuthenticated && $user}
        <!-- ============================================ -->
        <!-- LOGGED IN USER VIEW                         -->
        <!-- ============================================ -->
        <section class="welcome-back">
            <h2>Vitaj späť, {$user.username}! 👋</h2>
            <p>Čo by si chcel dnes robiť?</p>
            
            <div class="quick-actions">
                <button type="button" class="quick-action-btn" onclick={() => goto('/dashboard')}>
                    <span class="quick-action-icon">📊</span>
                    <span class="quick-action-label">Dashboard</span>
                </button>
                <button type="button" class="quick-action-btn" onclick={() => goto('/sensors')}>
                    <span class="quick-action-icon">📡</span>
                    <span class="quick-action-label">Moje senzory</span>
                </button>
                <button type="button" class="quick-action-btn" onclick={() => goto('/profile')}>
                    <span class="quick-action-icon">👤</span>
                    <span class="quick-action-label">Profil</span>
                </button>
                {#if $user.role === 'ADMIN'}
                    <button type="button" class="quick-action-btn" onclick={() => goto('/admin')}>
                        <span class="quick-action-icon">⚙️</span>
                        <span class="quick-action-label">Administrácia</span>
                    </button>
                {/if}
            </div>
        </section>
    {:else}
        <!-- ============================================ -->
        <!-- GUEST VIEW - HERO SECTION                   -->
        <!-- ============================================ -->
        <section class="hero">
            <h1 class="hero-title">
                Vizualizujte dáta z vašich <span>IoT senzorov</span>
            </h1>
            <p class="hero-description">
                Moderná webová aplikácia pre záznam, prezeranie a analýzu nameraných dát. 
                Jednoduché rozhranie pre domácnosti aj komerčné využitie.
            </p>
            <div class="hero-buttons">
                <button type="button" class="hero-btn hero-btn-primary" onclick={() => goto('/register')}>
                    🚀 Začať zadarmo
                </button>
                <button type="button" class="hero-btn hero-btn-secondary" onclick={() => goto('/login')}>
                    Prihlásiť sa
                </button>
            </div>
        </section>
    {/if}
    
    <!-- ============================================ -->
    <!-- FEATURES SECTION                            -->
    <!-- ============================================ -->
    <section>
        <h2 class="section-title">Funkcie aplikácie</h2>
        <p class="section-subtitle">Všetko čo potrebujete pre správu IoT senzorov</p>
        
        <div class="features-grid">
            {#each features as feature}
                <div class="feature-card">
                    <div class="feature-icon">{feature.icon}</div>
                    <h3 class="feature-title">{feature.title}</h3>
                    <p class="feature-description">{feature.description}</p>
                </div>
            {/each}
        </div>
    </section>
    
    <!-- ============================================ -->
    <!-- USE CASES SECTION                           -->
    <!-- ============================================ -->
    <section class="use-cases">
        <h2 class="section-title">Príklady využitia</h2>
        <p class="section-subtitle">Flexibilné riešenie pre rôzne scenáre</p>
        
        <div class="use-cases-grid">
            {#each useCases as useCase}
                <div class="use-case">
                    <div class="use-case-icon">{useCase.icon}</div>
                    <h3 class="use-case-title">{useCase.title}</h3>
                    <p class="use-case-desc">{useCase.desc}</p>
                </div>
            {/each}
        </div>
    </section>
    
    <!-- ============================================ -->
    <!-- CTA SECTION (Only for guests)               -->
    <!-- ============================================ -->
    {#if !$isAuthenticated}
        <section class="cta-section">
            <h2 class="cta-title">Pripravení začať?</h2>
            <p class="cta-description">
                Vytvorte si účet zadarmo a začnite sledovať vaše senzory ešte dnes.
            </p>
            <button type="button" class="cta-btn" onclick={() => goto('/register')}>
                Vytvoriť účet
            </button>
        </section>
    {/if}
</div>

