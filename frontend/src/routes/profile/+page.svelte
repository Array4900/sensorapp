<script>
    import { user } from '$lib/stores/auth';
</script>

<div class="page-content">
    <h1>Profil</h1>

    {#if $user}
        <div class="profile-section">
            <h2>Tvoj profil</h2>
            <div class="card">
                <p><strong>Username:</strong> {$user.username}</p>
                <p><strong>Status:</strong> Logged In</p>
                <p><strong>Member Since:</strong> January 2024</p>
            </div>

            <div class="card tooltip" style="margin-top: 20px;">
                <h3>Account Statistics</h3>
                <p>Active for 30 days</p>
                <span class="tooltip-text">Your account activity and statistics</span>
            </div>
        </div>
    {:else}
        <div class="profile-section">
            <h2>Musíš sa prihlásiť</h2>
            <div class="card">
                <p>Prosím prihlás sa do svojho profilu.</p>
                <p>Môžeš tak urobiť TU.</p>
            </div>
        </div>
    {/if}
</div>