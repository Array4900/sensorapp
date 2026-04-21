import { browser } from '$app/environment';
import { env } from '$env/dynamic/public';

const API_BASE = '/api';
const PUBLIC_VAPID_KEY = env.PUBLIC_VAPID_PUBLIC_KEY || '';
const SERVICE_WORKER_VERSION = 'v5';
const SERVICE_WORKER_URL = `/service-worker.js?v=${SERVICE_WORKER_VERSION}`;

function getAuthHeaders(token: string): HeadersInit {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  };
}

function ensureBrowserSupport(): void {
  if (!browser) {
    throw new Error('Push notifications are only available in the browser.');
  }

  if (!('serviceWorker' in navigator)) {
    throw new Error('Service workers are not supported in this browser.');
  }

  if (!('PushManager' in window)) {
    throw new Error('Push notifications are not supported in this browser.');
  }
}

function base64UrlToUint8Array(value: string): Uint8Array {
  const padding = '='.repeat((4 - (value.length % 4)) % 4);
  const normalized = (value + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(normalized);
  const output = new Uint8Array(raw.length);

  for (let index = 0; index < raw.length; index += 1) {
    output[index] = raw.charCodeAt(index);
  }

  return output;
}

async function saveSubscription(token: string, subscription: PushSubscription): Promise<void> {
  const response = await fetch(`${API_BASE}/push/subscriptions`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify({ subscription: subscription.toJSON() })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Nepodarilo sa uložiť odber notifikácií.');
  }
}

export function isPushSupported(): boolean {
  return browser && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!browser || !('Notification' in window)) {
    return 'unsupported';
  }

  return Notification.permission;
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!browser || !('serviceWorker' in navigator)) {
    return null;
  }

  return navigator.serviceWorker.register(SERVICE_WORKER_URL, {
    scope: '/',
    updateViaCache: 'none'
  });
}

export async function hasPushSubscription(): Promise<boolean> {
  if (!isPushSupported()) {
    return false;
  }

  const registration = await registerServiceWorker();
  const subscription = await registration?.pushManager.getSubscription();
  return Boolean(subscription);
}

export async function syncExistingPushSubscription(token: string): Promise<boolean> {
  if (!token || !isPushSupported()) {
    return false;
  }

  const registration = await registerServiceWorker();
  const subscription = await registration?.pushManager.getSubscription();

  if (!subscription) {
    return false;
  }

  await saveSubscription(token, subscription);
  return true;
}

export async function subscribeToPush(token: string): Promise<boolean> {
  ensureBrowserSupport();

  if (!token) {
    throw new Error('Chýba autentifikačný token.');
  }

  if (!PUBLIC_VAPID_KEY) {
    throw new Error('Chýba verejný VAPID kľúč pre frontend.');
  }

  const registration = await registerServiceWorker();
  if (!registration) {
    throw new Error('Nepodarilo sa zaregistrovať service worker.');
  }

  const currentPermission = getNotificationPermission();
  if (currentPermission === 'denied') {
    throw new Error('Notifikácie sú v prehliadači zablokované.');
  }

  const permission = currentPermission === 'granted'
    ? currentPermission
    : await Notification.requestPermission();

  if (permission !== 'granted') {
    throw new Error('Používateľ nepovolil zobrazovanie notifikácií.');
  }

  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: base64UrlToUint8Array(PUBLIC_VAPID_KEY) as any
    });
  }

  await saveSubscription(token, subscription);
  return true;
}

export async function unsubscribeFromPush(token: string): Promise<boolean> {
  if (!token || !isPushSupported()) {
    return false;
  }

  const registration = await registerServiceWorker();
  const subscription = await registration?.pushManager.getSubscription();

  if (!subscription) {
    return false;
  }

  await fetch(`${API_BASE}/push/subscriptions`, {
    method: 'DELETE',
    headers: getAuthHeaders(token),
    body: JSON.stringify({ endpoint: subscription.endpoint })
  });

  return subscription.unsubscribe();
}