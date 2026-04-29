import webpush from 'web-push';
import PushSubscription from '../models/PushSubscription.js';
import SentNotification from '../models/SentNotification.js';

export interface PushPayload {
    title: string;
    body: string;
    url?: string;
    icon?: string;
    badge?: string;
}

export interface NotificationDeliveryResult {
    delivered: number;
    removed: number;
    targetedSubscriptions: number;
}

export interface StoredNotificationOptions {
    category: 'threshold' | 'daily' | 'manual';
    sensorName?: string;
}

export interface StoredPushSubscription {
    endpoint: string;
    expirationTime?: number | null;
    keys: {
        p256dh: string;
        auth: string;
    };
}

let isConfigured = false;

const DEFAULT_NOTIFICATION_ICON = '/icon-192x192.png';
const DEFAULT_NOTIFICATION_BADGE = '/icon-192x192.png';

export function configurePushNotifications(): void {
    if (isConfigured) {
        return;
    }

    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const contact = process.env.VAPID_EMAIL;

    if (!publicKey || !privateKey || !contact) {
        console.warn('Push notifications are disabled because VAPID environment variables are missing.');
        return;
    }

    webpush.setVapidDetails(contact, publicKey, privateKey);
    isConfigured = true;
}

export function pushNotificationsConfigured(): boolean {
    return isConfigured;
}

export async function sendPushMessage(subscription: StoredPushSubscription, payload: PushPayload): Promise<void> {
    if (!isConfigured) {
        throw new Error('Push notifications are not configured.');
    }

    await webpush.sendNotification(
        subscription,
        JSON.stringify({
            ...payload,
            icon: payload.icon || DEFAULT_NOTIFICATION_ICON,
            badge: payload.badge || DEFAULT_NOTIFICATION_BADGE
        })
    );
}

export async function sendNotificationToUser(
    username: string,
    payload: PushPayload,
    options: StoredNotificationOptions
): Promise<NotificationDeliveryResult> {
    if (!isConfigured) {
        throw new Error('Push notifications are not configured.');
    }

    const subscriptions = await PushSubscription.find({ username }).lean();
    const result: NotificationDeliveryResult = {
        delivered: 0,
        removed: 0,
        targetedSubscriptions: subscriptions.length
    };

    if (subscriptions.length === 0) {
        return result;
    }

    await Promise.all(
        subscriptions.map(async (subscription) => {
            try {
                if (!subscription.keys?.p256dh || !subscription.keys?.auth) {
                    await PushSubscription.deleteOne({ endpoint: subscription.endpoint });
                    result.removed += 1;
                    return;
                }

                await sendPushMessage(
                    {
                        endpoint: subscription.endpoint,
                        expirationTime: subscription.expirationTime,
                        keys: subscription.keys
                    },
                    payload
                );

                result.delivered += 1;
            } catch (error) {
                const statusCode = (error as { statusCode?: number }).statusCode;
                if (statusCode === 404 || statusCode === 410) {
                    await PushSubscription.deleteOne({ endpoint: subscription.endpoint });
                    result.removed += 1;
                    return;
                }

                throw error;
            }
        })
    );

    if (result.delivered > 0) {
        await SentNotification.create({
            username,
            title: payload.title,
            body: payload.body,
            url: payload.url || '/dashboard',
            category: options.category,
            sensorName: options.sensorName || '',
            deliveredCount: result.delivered,
            removedCount: result.removed,
            targetedSubscriptions: result.targetedSubscriptions
        });
    }

    return result;
}