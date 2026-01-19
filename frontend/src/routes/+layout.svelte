<!--
  Root Layout Component - Main application shell
  
  This layout provides:
  - Responsive navigation sidebar
  - Top header with user menu
  - Main content area with children snippet
  - Footer with author info
  
  Uses Svelte 5 runes for reactive state management
-->

<script lang="ts">
    import type { Snippet } from 'svelte';
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import { user, isAuthenticated, isAdmin, logout, authReady } from '$lib/stores/auth';
    import '../static/layout.css';
    
    // ============================================
    // PROPS (Svelte 5 Runes)
    // ============================================
    
    /** Children snippet - page content */
    let { children }: { children: Snippet } = $props();
    
    // ============================================
    // REACTIVE STATE (Svelte 5 Runes)
    // ============================================
    
    /** Sidebar open/closed state */
    let sidebarOpen = $state(false);
    
    /** User dropdown menu state */
    let userMenuOpen = $state(false);
    
    // ============================================
    // NAVIGATION ITEMS
    // ============================================
    
    /** Navigation item type for better type safety */
    interface NavItem {
        href: string;
        label: string;
        icon: string;
        requiresAuth?: boolean;
    }
    
    /** Main navigation links */
    const navItems: NavItem[] = [
        { href: '/', label: 'Domov', icon: '🏠', requiresAuth: false },
        { href: '/dashboard', label: 'Dashboard', icon: '📊', requiresAuth: true },
        { href: '/sensors', label: 'Senzory', icon: '📡', requiresAuth: true },
    ];
    
    /** Admin-only navigation links */
    const adminNavItems: NavItem[] = [
        { href: '/admin', label: 'Administrácia', icon: '⚙️' },
    ];
    
    // ============================================
    // EVENT HANDLERS
    // ============================================
    
    /** Toggle sidebar visibility */
    function toggleSidebar(): void {
        console.log('toggleSidebar called, current state:', sidebarOpen);
        sidebarOpen = !sidebarOpen;
        console.log('new state:', sidebarOpen);
    }
    
    /** Close sidebar (mobile) */
    function closeSidebar(): void {
        sidebarOpen = false;
    }
    
    /** Toggle user dropdown menu */
    function toggleUserMenu(): void {
        userMenuOpen = !userMenuOpen;
    }
    
    /** Handle logout action */
    function handleLogout(): void {
        logout();
        userMenuOpen = false;
        goto('/');
    }
    
    /** Navigate to a page */
    function navigateTo(href: string): void {
        goto(href);
        closeSidebar();
    }
    
    /** Check if current route is active */
    function isActive(href: string): boolean {
        if (href === '/') {
            return $page.url.pathname === '/';
        }
        return $page.url.pathname.startsWith(href);
    }
    
    // Close menus when clicking outside
    function handleClickOutside(event: MouseEvent): void {
        const target = event.target as HTMLElement;
        if (!target.closest('.user-menu-container')) {
            userMenuOpen = false;
        }
    }
</script>

<!-- Click outside handler -->
<svelte:window onclick={handleClickOutside} />

<div class="app-container">
    <!-- ============================================ -->
    <!-- SIDEBAR NAVIGATION                          -->
    <!-- ============================================ -->
    <aside class="sidebar" class:open={sidebarOpen}>
        <!-- Sidebar Header with Logo -->
        <div class="sidebar-header">
            <div class="logo">
                <span class="logo-icon">📡</span>
                <span class="logo-text">SensorApp</span>
            </div>
            <!-- Close button (mobile only) -->
            <button class="close-btn" onclick={closeSidebar} aria-label="Zavrieť menu">
                ✕
            </button>
        </div>
        
        <!-- Main Navigation -->
        <nav class="sidebar-nav">
            <ul class="nav-list">
                {#each navItems as item}
                    <!-- Show all items, but indicate if auth required -->
                    {#if !item.requiresAuth || $isAuthenticated}
                        <li class="nav-item">
                            <button 
                                type="button"
                                class="nav-link" 
                                class:active={isActive(item.href)}
                                onclick={() => navigateTo(item.href)}
                            >
                                <span class="nav-icon">{item.icon}</span>
                                <span class="nav-label">{item.label}</span>
                            </button>
                        </li>
                    {/if}
                {/each}
                
                <!-- Admin Navigation (only for admins) -->
                {#if $isAdmin}
                    <li class="nav-divider"></li>
                    {#each adminNavItems as item}
                        <li class="nav-item">
                            <button 
                                type="button"
                                class="nav-link" 
                                class:active={isActive(item.href)}
                                onclick={() => navigateTo(item.href)}
                            >
                                <span class="nav-icon">{item.icon}</span>
                                <span class="nav-label">{item.label}</span>
                            </button>
                        </li>
                    {/each}
                {/if}
            </ul>
        </nav>
        
        <!-- Sidebar Footer -->
        <div class="sidebar-footer">
            {#if $isAuthenticated && $user}
                <div class="user-info-sidebar">
                    <span class="user-avatar">👤</span>
                    <div class="user-details">
                        <span class="user-name">{$user.username}</span>
                        <span class="user-role">{$user.role === 'ADMIN' ? 'Administrátor' : 'Používateľ'}</span>
                    </div>
                </div>
            {:else}
                <button type="button" class="sidebar-login-btn" onclick={() => navigateTo('/login')}>
                    Prihlásiť sa
                </button>
            {/if}
        </div>
    </aside>
    
    <!-- Sidebar Overlay (mobile) -->
    {#if sidebarOpen}
        <button type="button" class="sidebar-overlay" onclick={closeSidebar} aria-label="Zavrieť menu"></button>
    {/if}
    
    <!-- ============================================ -->
    <!-- MAIN CONTENT AREA                           -->
    <!-- ============================================ -->
    <div class="main-wrapper">
        <!-- Top Header -->
        <header class="top-header">
            <!-- Hamburger Menu Button -->
            <button type="button" class="hamburger-btn" onclick={toggleSidebar} aria-label="Otvoriť menu">
                <span class="hamburger-line"></span>
                <span class="hamburger-line"></span>
                <span class="hamburger-line"></span>
            </button>
            
            <!-- Page Title -->
            <h1 class="page-title">
                {#if $page.url.pathname === '/'}
                    Domov
                {:else if $page.url.pathname.startsWith('/dashboard')}
                    Dashboard
                {:else if $page.url.pathname.startsWith('/sensors')}
                    Senzory
                {:else if $page.url.pathname.startsWith('/profile')}
                    Profil
                {:else if $page.url.pathname.startsWith('/admin')}
                    Administrácia
                {:else if $page.url.pathname === '/login'}
                    Prihlásenie
                {:else if $page.url.pathname === '/register'}
                    Registrácia
                {:else}
                    SensorApp
                {/if}
            </h1>
            
            <!-- Header Right Section -->
            <div class="header-right">
                {#if $isAuthenticated && $user}
                    <!-- User Menu -->
                    <div class="user-menu-container">
                        <button 
                            type="button"
                            class="user-menu-trigger" 
                            onclick={(e) => { e.stopPropagation(); toggleUserMenu(); }}
                        >
                            <span class="user-avatar-small">👤</span>
                            <span class="user-name-header">{$user.username}</span>
                            <span class="dropdown-arrow" class:open={userMenuOpen}>▼</span>
                        </button>
                        
                        {#if userMenuOpen}
                            <div class="user-dropdown">
                                <button type="button" class="dropdown-item" onclick={() => { navigateTo('/profile'); userMenuOpen = false; }}>
                                    <span class="dropdown-icon">👤</span>
                                    Profil
                                </button>
                                <button type="button" class="dropdown-item" onclick={() => { navigateTo('/dashboard'); userMenuOpen = false; }}>
                                    <span class="dropdown-icon">📊</span>
                                    Dashboard
                                </button>
                                <div class="dropdown-divider"></div>
                                <button type="button" class="dropdown-item logout" onclick={handleLogout}>
                                    <span class="dropdown-icon">🚪</span>
                                    Odhlásiť sa
                                </button>
                            </div>
                        {/if}
                    </div>
                {:else}
                    <!-- Login/Register Buttons -->
                    <div class="auth-buttons">
                        <button type="button" class="btn btn-outline" onclick={() => goto('/login')}>
                            Prihlásiť sa
                        </button>
                        <button type="button" class="btn btn-primary" onclick={() => goto('/register')}>
                            Registrácia
                        </button>
                    </div>
                {/if}
            </div>
        </header>
        
        <!-- Main Content -->
        <main class="main-content">
            {#if $authReady}
                {@render children()}
            {:else}
                <!-- Loading state while verifying auth -->
                <div class="loading-container">
                    <div class="loading-spinner"></div>
                    <p>Načítavam...</p>
                </div>
            {/if}
        </main>
        
        <!-- Footer -->
        <footer class="app-footer">
            <p>© 2026 SensorApp | Autor: Maroš Cifra | VAII Semestrálna práca</p>
        </footer>
    </div>
</div>

