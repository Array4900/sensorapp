import type { Response } from 'express';
import PushSubscription from '../models/PushSubscription.js';
import SentNotification from '../models/SentNotification.js';
import type { AuthRequest } from '../middleware/authMiddleware.js';
import { pushNotificationsConfigured, sendNotificationToUser } from '../utils/pushNotifications.js';

function getSubscriptionPayload(body: unknown): { endpoint: string; expirationTime?: number | null; keys: { p256dh: string; auth: string } } | null {
    if (!body || typeof body !== 'object') {
        return null;
    }

    const subscription = (body as { subscription?: unknown }).subscription;
    if (!subscription || typeof subscription !== 'object') {
        return null;
    }

    const endpoint = (subscription as { endpoint?: unknown }).endpoint;
    const expirationTime = (subscription as { expirationTime?: unknown }).expirationTime;
    const keys = (subscription as { keys?: unknown }).keys;

    if (typeof endpoint !== 'string' || !endpoint || !keys || typeof keys !== 'object') {
        return null;
    }

    const p256dh = (keys as { p256dh?: unknown }).p256dh;
    const auth = (keys as { auth?: unknown }).auth;

    if (typeof p256dh !== 'string' || typeof auth !== 'string') {
        return null;
    }

    return {
        endpoint,
        expirationTime: typeof expirationTime === 'number' ? expirationTime : null,
        keys: { p256dh, auth }
    };
}

export const savePushSubscription = async (req: AuthRequest, res: Response) => {
    try {
        if (!pushNotificationsConfigured()) {
            return res.status(503).json({ message: 'Push notifications are not configured on the server.' });
        }

        const username = req.user?.username;
        const subscription = getSubscriptionPayload(req.body);

        if (!username || !subscription) {
            return res.status(400).json({ message: 'Invalid push subscription payload.' });
        }

        await PushSubscription.findOneAndUpdate(
            { endpoint: subscription.endpoint },
            {
                username,
                endpoint: subscription.endpoint,
                expirationTime: subscription.expirationTime ?? null,
                keys: subscription.keys,
                userAgent: req.get('user-agent') || ''
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        return res.status(201).json({ message: 'Push subscription saved successfully.' });
    } catch (error) {
        console.error('Saving push subscription failed.', error);
        return res.status(500).json({ message: 'Internal server error.' });
    }
};

export const deletePushSubscription = async (req: AuthRequest, res: Response) => {
    try {
        const username = req.user?.username;
        const endpoint = req.body?.endpoint;

        if (!username || typeof endpoint !== 'string' || endpoint.length === 0) {
            return res.status(400).json({ message: 'Endpoint is required.' });
        }

        await PushSubscription.deleteOne({ username, endpoint });
        return res.status(200).json({ message: 'Push subscription removed successfully.' });
    } catch (error) {
        console.error('Deleting push subscription failed.', error);
        return res.status(500).json({ message: 'Internal server error.' });
    }
};

export const sendPushNotification = async (req: AuthRequest, res: Response) => {
    try {
        if (!pushNotificationsConfigured()) {
            return res.status(503).json({ message: 'Push notifications are not configured on the server.' });
        }

        const { title, body, url, username } = req.body as {
            title?: string;
            body?: string;
            url?: string;
            username?: string;
        };

        if (!title || !body) {
            return res.status(400).json({ message: 'Title and body are required.' });
        }

        if (typeof username !== 'string' || username.trim().length === 0) {
            return res.status(400).json({ message: 'Pri manuálnom odoslaní je potrebné zadať používateľa.' });
        }

        const targetUsername = username.trim();
        const result = await sendNotificationToUser(targetUsername, { title, body, url }, { category: 'manual' });

        if (result.targetedSubscriptions === 0) {
            return res.status(404).json({ message: 'No push subscriptions found for the target user selection.' });
        }

        return res.status(200).json({
            message: 'Push notification processing finished.',
            delivered: result.delivered,
            removed: result.removed,
            targetedSubscriptions: result.targetedSubscriptions
        });
    } catch (error) {
        console.error('Sending push notification failed.', error);
        return res.status(500).json({ message: 'Internal server error.' });
    }
};

export const getSentNotificationHistory = async (req: AuthRequest, res: Response) => {
    try {
        const username = req.user?.username;

        if (!username) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const notifications = await SentNotification.find({ username })
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();

        return res.status(200).json({ notifications });
    } catch (error) {
        console.error('Fetching sent notification history failed.', error);
        return res.status(500).json({ message: 'Internal server error.' });
    }
};