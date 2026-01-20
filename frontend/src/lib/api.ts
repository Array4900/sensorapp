/**
 * API Service - Centralized API calls
 * Uses auth token from auth store for authenticated requests
 */

import { authFetch } from './stores/auth';

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
    location: string;
    type: string;
}

// ============================================
// SENSOR API
// ============================================

export async function getSensors(): Promise<Sensor[]> {
    const response = await authFetch('/sensors');
    if (!response.ok) {
        throw new Error('Failed to fetch sensors');
    }
    const data = await response.json();
    return data.sensors;
}

export async function getSensorById(id: string): Promise<Sensor> {
    const response = await authFetch(`/sensors/${id}`);
    if (!response.ok) {
        throw new Error('Failed to fetch sensor');
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

export async function updateSensor(id: string, sensorData: Partial<CreateSensorData & { isActive: boolean }>): Promise<Sensor> {
    const response = await authFetch(`/sensors/${id}`, {
        method: 'PUT',
        body: JSON.stringify(sensorData)
    });
    if (!response.ok) {
        throw new Error('Failed to update sensor');
    }
    const data = await response.json();
    return data.sensor;
}

export async function deleteSensor(id: string): Promise<void> {
    const response = await authFetch(`/sensors/${id}`, {
        method: 'DELETE'
    });
    if (!response.ok) {
        throw new Error('Failed to delete sensor');
    }
}

export async function getSensorMeasurements(sensorId: string): Promise<Measurement[]> {
    const response = await authFetch(`/sensors/${sensorId}/measurements`);
    if (!response.ok) {
        throw new Error('Failed to fetch measurements');
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
        throw new Error('Failed to fetch users');
    }
    const data = await response.json();
    return data.users;
}

export async function getAllSensors(): Promise<Sensor[]> {
    const response = await authFetch('/admin/sensors');
    if (!response.ok) {
        throw new Error('Failed to fetch sensors');
    }
    const data = await response.json();
    return data.sensors;
}

export async function getUserSensors(username: string): Promise<Sensor[]> {
    const response = await authFetch(`/admin/users/${username}/sensors`);
    if (!response.ok) {
        throw new Error('Failed to fetch user sensors');
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
        throw new Error('Failed to delete sensor');
    }
}
