import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
	plugins: [
		sveltekit(),
		VitePWA({
			mode: 'auto',
			strategies: 'injectManifest',
			srcDir: 'src',
			filename: 'service-worker.js',
			manifest: {
				name: 'Sensor App',
				short_name: 'Sensors',
				description: 'A Progressive Web App for managing sensors and measurements',
				theme_color: '#6366f1',
				background_color: '#ffffff',
				display: 'standalone',
				start_url: '/',
				scope: '/',
				icons: [
					{
						src: '/icon-192.png',
						sizes: '192x192',
						type: 'image/png',
						purpose: 'any'
					},
					{
						src: '/icon-512.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'any'
					},
					{
						src: '/icon-maskable-192.png',
						sizes: '192x192',
						type: 'image/png',
						purpose: 'maskable'
					},
					{
						src: '/icon-maskable-512.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'maskable'
					}
				]
			},
			injectManifest: {
				globPatterns: ['client/**/*.{js,css,html,svg,png,jpg,jpeg,gif,woff,woff2,ttf,eot}']
			},
			devOptions: {
				enabled: true,
				navigateFallback: 'index.html'
			}
		})
	]
});
