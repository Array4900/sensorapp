/**
 * API Service - Centralized API calls for SensorApp
 * Uses auth token from auth store for authenticated requests
 */

import { authFetch } from './stores/auth';

async function readErrorMessage(response: Response, fallback: string): Promise<string> {
    const contentType = response.headers.get('content-type') || '';

    try {
        if (contentType.includes('application/json')) {
            const data = await response.json();
            if (typeof data?.message === 'string' && data.message.trim().length > 0) {
                return data.message;
            }
        } else {
            const text = await response.text();
            if (text.trim().length > 0) {
                return text;
            }
        }
    } catch {
        return fallback;
    }

    return fallback;
}

// ============================================
// TYPES
// ============================================

export interface Sensor {
    _id: string;
    name: string;
    location: string;
    type: string;
    owner: string;
    apiKey: string;
    qrCode: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface Measurement {
    _id: string;
    sensor: string;
    value: number;
    unit?: string;
    timestamp: string;
    createdAt: string;
}

export interface User {
    _id: string;
    username: string;
    role: 'USER' | 'ADMIN';
    createdAt: string;
    updatedAt: string;
}

export interface CreateSensorData {
    name: string;
    location?: string;
    owner?: string;
}

export interface UpdateSensorData {
    name?: string;
    location?: string;
    isActive?: boolean;
}

export interface SendPushNotificationData {
    title: string;
    body: string;
    url?: string;
    username?: string;
}

export interface SentNotification {
    _id: string;
    title: string;
    body: string;
    url: string;
    category: 'threshold' | 'daily' | 'manual';
    sensorName: string;
    deliveredCount: number;
    removedCount: number;
    targetedSubscriptions: number;
    createdAt: string;
    updatedAt: string;
}

// ============================================
// SENSOR API
// ============================================

export async function getSensors(): Promise<Sensor[]> {
    const response = await authFetch('/sensors');
    if (!response.ok) {
        throw new Error(await readErrorMessage(response, 'Nepodarilo sa načítať senzory'));
    }
    const data = await response.json();
    return data.sensors;
}

export async function getSensorById(id: string): Promise<Sensor> {
    const response = await authFetch(`/sensors/${id}`);
    if (!response.ok) {
        throw new Error(await readErrorMessage(response, 'Nepodarilo sa načítať senzor'));
    }
    const data = await response.json();
    return data.sensor;
}

export async function createSensor(sensorData: CreateSensorData): Promise<Sensor> {
    const response = await authFetch('/sensors', {
        method: 'POST',
        body: JSON.stringify(sensorData)
    });
    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to create sensor');
    }
    const data = await response.json();
    return data.sensor;
}

export async function updateSensor(id: string, sensorData: UpdateSensorData): Promise<Sensor> {
    const response = await authFetch(`/sensors/${id}`, {
        method: 'PUT',
        body: JSON.stringify(sensorData)
    });
    if (!response.ok) {
        throw new Error(await readErrorMessage(response, 'Nepodarilo sa upraviť senzor'));
    }
    const data = await response.json();
    return data.sensor;
}

export async function deleteSensor(id: string): Promise<void> {
    const response = await authFetch(`/sensors/${id}`, {
        method: 'DELETE'
    });
    if (!response.ok) {
        throw new Error(await readErrorMessage(response, 'Nepodarilo sa vymazať senzor'));
    }
}

export async function getSensorMeasurements(sensorId: string): Promise<Measurement[]> {
    const response = await authFetch(`/sensors/${sensorId}/measurements`);
    if (!response.ok) {
        throw new Error(await readErrorMessage(response, 'Nepodarilo sa načítať merania'));
    }
    const data = await response.json();
    return data.measurements;
}

// ============================================
// ADMIN API
// ============================================

export async function getAllUsers(): Promise<User[]> {
    const response = await authFetch('/admin/users');
    if (!response.ok) {
        throw new Error(await readErrorMessage(response, 'Nepodarilo sa načítať používateľov'));
    }
    const data = await response.json();
    return data.users;
}

export async function getAllSensors(): Promise<Sensor[]> {
    const response = await authFetch('/admin/sensors');
    if (!response.ok) {
        throw new Error(await readErrorMessage(response, 'Nepodarilo sa načítať senzory'));
    }
    const data = await response.json();
    return data.sensors;
}

export async function getUserSensors(username: string): Promise<Sensor[]> {
    const response = await authFetch(`/admin/users/${username}/sensors`);
    if (!response.ok) {
        throw new Error(await readErrorMessage(response, 'Nepodarilo sa načítať senzory používateľa'));
    }
    const data = await response.json();
    return data.sensors;
}

export async function deleteUser(username: string): Promise<void> {
    const response = await authFetch(`/admin/users/${username}`, {
        method: 'DELETE'
    });
    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete user');
    }
}

export async function adminDeleteSensor(id: string): Promise<void> {
    const response = await authFetch(`/admin/sensors/${id}`, {
        method: 'DELETE'
    });
    if (!response.ok) {
        throw new Error(await readErrorMessage(response, 'Nepodarilo sa vymazať senzor'));
    }
}

export async function transferSensorOwnership(sensorId: string, newOwner: string): Promise<Sensor> {
    const response = await authFetch(`/admin/sensors/${sensorId}/transfer`, {
        method: 'PUT',
        body: JSON.stringify({ newOwner })
    });
    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to transfer sensor');
    }
    const data = await response.json();
    return data.sensor;
}

export async function sendPushNotification(payload: SendPushNotificationData): Promise<{ delivered: number; removed: number; targetedSubscriptions: number }> {
    const response = await authFetch('/push/send', {
        method: 'POST',
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        throw new Error(await readErrorMessage(response, 'Nepodarilo sa odoslať notifikáciu'));
    }

    return response.json();
}

export async function getSentNotifications(): Promise<SentNotification[]> {
    const response = await authFetch('/push/history');

    if (!response.ok) {
        throw new Error(await readErrorMessage(response, 'Nepodarilo sa načítať históriu notifikácií'));
    }

    const data = await response.json();
    return data.notifications;
}
