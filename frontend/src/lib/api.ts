/**
 * API Service - Centralized API calls
 * Uses auth token from auth store for authenticated requests
 */

import { authFetch } from './stores/auth';

// ============================================
// TYPES
// ============================================

export interface Location {
    _id: string;
    name: string;
    description: string;
    owner: string;
    createdAt: string;
    updatedAt: string;
}

export interface Sensor {
    _id: string;
    name: string;
    location: Location | null;
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
    location?: string;
    type: string;
}

export interface UpdateSensorData {
    name?: string;
    location?: string;
    type?: string;
    isActive?: boolean;
}

export interface CreateLocationData {
    name: string;
    description?: string;
}

export interface UpdateLocationData {
    name?: string;
    description?: string;
}

// ============================================
// LOCATION API
// ============================================

export async function getLocations(): Promise<Location[]> {
    const response = await authFetch('/locations');
    if (!response.ok) {
        throw new Error('Failed to fetch locations');
    }
    const data = await response.json();
    return data.locations;
}

export async function getLocationById(id: string): Promise<Location> {
    const response = await authFetch(`/locations/${id}`);
    if (!response.ok) {
        throw new Error('Failed to fetch location');
    }
    const data = await response.json();
    return data.location;
}

export async function createLocation(locationData: CreateLocationData): Promise<Location> {
    const response = await authFetch('/locations', {
        method: 'POST',
        body: JSON.stringify(locationData)
    });
    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to create location');
    }
    const data = await response.json();
    return data.location;
}

export async function updateLocation(id: string, locationData: UpdateLocationData): Promise<Location> {
    const response = await authFetch(`/locations/${id}`, {
        method: 'PUT',
        body: JSON.stringify(locationData)
    });
    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to update location');
    }
    const data = await response.json();
    return data.location;
}

export async function deleteLocation(id: string): Promise<void> {
    const response = await authFetch(`/locations/${id}`, {
        method: 'DELETE'
    });
    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete location');
    }
}

// ============================================
// SENSOR API
// ============================================

export async function getSensors(locationId?: string): Promise<Sensor[]> {
    const url = locationId ? `/sensors?locationId=${locationId}` : '/sensors';
    const response = await authFetch(url);
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

export async function getAllLocations(): Promise<Location[]> {
    const response = await authFetch('/admin/locations');
    if (!response.ok) {
        throw new Error('Failed to fetch locations');
    }
    const data = await response.json();
    return data.locations;
}

export async function getUserSensors(username: string): Promise<Sensor[]> {
    const response = await authFetch(`/admin/users/${username}/sensors`);
    if (!response.ok) {
        throw new Error('Failed to fetch user sensors');
    }
    const data = await response.json();
    return data.sensors;
}

export async function getUserLocations(username: string): Promise<Location[]> {
    const response = await authFetch(`/admin/users/${username}/locations`);
    if (!response.ok) {
        throw new Error('Failed to fetch user locations');
    }
    const data = await response.json();
    return data.locations;
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
