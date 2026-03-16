/**
 * Service Worker Registration
 * This file handles the registration of the service worker for PWA functionality
 */

export function registerServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    // Register the service worker
    navigator.serviceWorker
      .register('/service-worker.js', {
        scope: '/'
      })
      .then((registration) => {
        console.log('Service Worker registered successfully:', registration);

        // Check for updates periodically
        setInterval(() => {
          registration.update();
        }, 60000); // Check every minute
      })
      .catch((error) => {
        console.error('Service Worker registration failed:', error);
      });

    // Listen for controller change (new SW activated)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('Service Worker controller changed - new version activated');
    });
  }
}

/**
 * Check if the app is running as a PWA
 */
export function isPWA(): boolean {
  if (typeof window !== 'undefined') {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://')
    );
  }
  return false;
}

/**
 * Prompt user to install the app (if not installed)
 */
export function canInstall(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined') {
      let deferredPrompt: any;

      window.addEventListener('beforeinstallprompt', (e: any) => {
        e.preventDefault();
        deferredPrompt = e;
        resolve(true);
      });

      setTimeout(() => {
        resolve(false);
      }, 1000);
    } else {
      resolve(false);
    }
  });
}
