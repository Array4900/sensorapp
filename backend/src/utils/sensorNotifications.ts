import Measurement from '../models/Measurement.js';
import Sensor from '../models/Sensor.js';
import { pushNotificationsConfigured, sendNotificationToUser } from './pushNotifications.js';

type ThresholdLevel = 'none' | 'warning' | 'almost_full' | 'critical';

const DAILY_NOTIFICATION_TIMEZONE = 'Europe/Bratislava';
const DAILY_NOTIFICATION_HOUR = 9;
const DAILY_CHECK_INTERVAL_MS = 60 * 1000;
const THRESHOLD_NOTIFICATION_COOLDOWN_MS = 3 * 60 * 60 * 1000;

function resolveThresholdLevel(distanceCm: number): ThresholdLevel {
    if (distanceCm <= 25) {
        return 'critical';
    }

    if (distanceCm <= 30) {
        return 'almost_full';
    }

    if (distanceCm <= 50) {
        return 'warning';
    }

    return 'none';
}

function getThresholdSeverity(level: ThresholdLevel): number {
    switch (level) {
        case 'warning':
            return 1;
        case 'almost_full':
            return 2;
        case 'critical':
            return 3;
        default:
            return 0;
    }
}

function getThresholdBody(level: Exclude<ThresholdLevel, 'none'>): string {
    switch (level) {
        case 'warning':
            return 'Žumpa sa pomaly plní!';
        case 'almost_full':
            return 'Žumpa je skoro úplne plná';
        case 'critical':
            return 'Kritická udalosť: Žumpu je potrebné vypustiť!';
    }
}

function formatDistance(distanceCm: number): string {
    return Number.isInteger(distanceCm) ? `${distanceCm}` : distanceCm.toFixed(1);
}

function getBratislavaDateParts(now: Date = new Date()): { dateKey: string; hour: number; minute: number } {
    const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: DAILY_NOTIFICATION_TIMEZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });

    const parts = formatter.formatToParts(now);
    const lookup = Object.fromEntries(parts.map((part) => [part.type, part.value]));

    return {
        dateKey: `${lookup.year}-${lookup.month}-${lookup.day}`,
        hour: Number.parseInt(lookup.hour || '0', 10),
        minute: Number.parseInt(lookup.minute || '0', 10)
    };
}

export async function handleThresholdNotification(sensorDocument: any, distanceCm: number): Promise<void> {
    if (!sensorDocument.owner || !pushNotificationsConfigured()) {
        return;
    }

    const currentLevel = resolveThresholdLevel(distanceCm);
    const previousLevel = (sensorDocument.lastThresholdNotificationLevel || 'none') as ThresholdLevel;
    const lastSentAt = sensorDocument.lastThresholdNotificationSentAt
        ? new Date(sensorDocument.lastThresholdNotificationSentAt)
        : null;
    const now = new Date();

    if (currentLevel === 'none') {
        if (previousLevel !== 'none' || sensorDocument.lastThresholdNotificationSentAt) {
            sensorDocument.lastThresholdNotificationLevel = 'none';
            sensorDocument.lastThresholdNotificationSentAt = null;
            await sensorDocument.save();
        }

        return;
    }

    const severityIncreased = getThresholdSeverity(currentLevel) > getThresholdSeverity(previousLevel);
    const levelChanged = currentLevel !== previousLevel;
    const cooldownExpired = !lastSentAt || now.getTime() - lastSentAt.getTime() >= THRESHOLD_NOTIFICATION_COOLDOWN_MS;
    const shouldNotify = previousLevel === 'none' || severityIncreased || levelChanged || cooldownExpired;

    if (!shouldNotify) {
        return;
    }

    await sendNotificationToUser(
        sensorDocument.owner,
        {
            title: sensorDocument.name,
            body: getThresholdBody(currentLevel),
            url: '/dashboard'
        },
        {
            category: 'threshold',
            sensorName: sensorDocument.name
        }
    );

    sensorDocument.lastThresholdNotificationLevel = currentLevel;
    sensorDocument.lastThresholdNotificationSentAt = now;
    await sensorDocument.save();
}

async function sendDailyNotificationForSensor(sensorDocument: any, dateKey: string): Promise<void> {
    const latestMeasurement = await Measurement.findOne({ sensor: sensorDocument._id }).sort({ timestamp: -1 }).lean();
    if (!latestMeasurement) {
        return;
    }

    await sendNotificationToUser(
        sensorDocument.owner,
        {
            title: `${sensorDocument.name} - Stav senzora k ${latestMeasurement.timestamp.toLocaleString('sk-SK', { timeZone: DAILY_NOTIFICATION_TIMEZONE })}`,
            body: `Aktuálna vzdialenosť je ${formatDistance(latestMeasurement.value)} cm. \n` +
            `teplota je ${latestMeasurement.temperatureC !== undefined && latestMeasurement.temperatureC !== null ? formatDistance(latestMeasurement.temperatureC) + ' °C' : 'neznáma'}`,
            url: '/dashboard'
        },
        {
            category: 'daily',
            sensorName: sensorDocument.name
        }
    );

    sensorDocument.lastDailyNotificationDate = dateKey;
    await sensorDocument.save();
}

export async function processDailySensorNotifications(now: Date = new Date()): Promise<void> {
    const { dateKey, hour } = getBratislavaDateParts(now);

    if (hour < DAILY_NOTIFICATION_HOUR) {
        return;
    }

    const sensors = await Sensor.find({ isActive: true });

    for (const sensorDocument of sensors) {
        if (!sensorDocument.owner || sensorDocument.lastDailyNotificationDate === dateKey) {
            continue;
        }

        try {
            await sendDailyNotificationForSensor(sensorDocument, dateKey);
        } catch (error) {
            console.error(`Denná notifikácia zlyhala pre senzor ${sensorDocument.name}:`, error);
        }
    }
}

export function startDailySensorNotificationScheduler(): void {
    processDailySensorNotifications().catch((error) => {
        console.error('Počiatočné spracovanie denných notifikácií zlyhalo:', error);
    });

    setInterval(() => {
        processDailySensorNotifications().catch((error) => {
            console.error('Pravidelné spracovanie denných notifikácií zlyhalo:', error);
        });
    }, DAILY_CHECK_INTERVAL_MS);
}