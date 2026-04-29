import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const trustedOrigins = (process.env.TRUSTED_ORIGINS || 'http://localhost:3000,http://127.0.0.1:3000,https://sahur.sk,https://www.sahur.sk')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

/** @type {import('@sveltejs/kit').Config} */
const config = {
    preprocess: vitePreprocess(),

    kit: {
        // adapter-node je správna voľba pre Docker
        adapter: adapter(),
        
        // NASTAVENIE PRE CLOUDFLARE TUNNEL
        csrf: {
            trustedOrigins,
        }
    }
};

export default config;