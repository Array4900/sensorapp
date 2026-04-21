import { writable, type Readable } from 'svelte/store';
import { browser } from '$app/environment';

const CONNECTION_PROBE_URL = '/manifest.json';
const CONNECTION_PROBE_TIMEOUT_MS = 2500;

const onlineStore = writable(browser ? navigator.onLine : true);
let activeProbe: Promise<boolean> | null = null;

function setOnlineStatus(value: boolean): void {
    onlineStore.set(value);
}

async function probeConnection(force = false): Promise<boolean> {
    if (!browser) {
        return true;
    }

    if (!navigator.onLine && !force) {
        setOnlineStatus(false);
        return false;
    }

    if (activeProbe && !force) {
        return activeProbe;
    }

    activeProbe = (async () => {
        const controller = new AbortController();
        const timeoutId = window.setTimeout(() => controller.abort(), CONNECTION_PROBE_TIMEOUT_MS);

        try {
            const response = await fetch(`${CONNECTION_PROBE_URL}?t=${Date.now()}`, {
                method: 'HEAD',
                cache: 'no-store',
                signal: controller.signal
            });

            setOnlineStatus(response.ok);
            return response.ok;
        } catch {
            setOnlineStatus(false);
            return false;
        } finally {
            window.clearTimeout(timeoutId);
            activeProbe = null;
        }
    })();

    return activeProbe;
}

function createOnlineStore(): Readable<boolean> {
    if (browser) {
        const handleOnline = () => {
            void probeConnection(true);
        };

        const handleOffline = () => {
            setOnlineStatus(false);
        };

        const handleVisibility = () => {
            if (document.visibilityState === 'visible') {
                void probeConnection();
            }
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        window.addEventListener('focus', handleOnline);
        document.addEventListener('visibilitychange', handleVisibility);

        void probeConnection();
    }

    return {
        subscribe: onlineStore.subscribe
    };
}

export function markOnline(): void {
    if (browser) {
        setOnlineStatus(true);
    }
}

export function markOffline(): void {
    if (browser) {
        setOnlineStatus(false);
    }
}

export { probeConnection };
export const isOnline = createOnlineStore();
