<script>
    import { user } from '$lib/stores/auth';
</script>

<div class="page-content">
    <h1>Home Page</h1>
    <p>Welcome to the application!</p>

    {#if $user}
        <div class="profile-section">
            <h2>Welcome back, {$user.username}!</h2>
            <p>You are currently logged in.</p>
        </div>
    {:else}
        <div class="profile-section">
            <h2>Welcome Guest!</h2>
            <p>Please log in to access all features.</p>
        </div>
    {/if}

    <div class="card">
        <h3>Application Features</h3>
        <ul>
            <li>Collapsible navigation bar</li>
            <li>User authentication system</li>
            <li>Profile management</li>
            <li>Measurements tracking</li>
        </ul>
    </div>
</div>