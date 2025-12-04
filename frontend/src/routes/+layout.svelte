<script>
    let open = true; // sidebar state
    let user = null; // user state
</script>

<button class="burger" on:click={() => (open = !open)}>
    ☰
</button>

<header>
    <nav class="navbar">
        <h1 class="logo">Sensor App</h1>

        <ul class="nav-links">
            <li><a href="/">Domov</a></li>
            <li><a href="/sensors">Senzory</a></li>
            <li><a href="/profile">Profil</a></li>
        </ul>
    </nav>
</header>

<main>
    <slot />
</main>

<footer>
    <p>© 2025 Sensor App</p>
</footer>

<!-- Import layout CSS -->
<link rel="stylesheet" href="src/static/layout.css">
