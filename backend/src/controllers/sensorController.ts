import { Request, Response } from 'express';
import Sensor from '../models/Sensor.js';
import Measurement from '../models/Measurement.js';
import { UserRole } from '../utils/roleEnum.js';
import crypto from 'crypto';

interface AuthRequest extends Request {
    user?: { username: string; role: string };
}

// Generate a unique API key for sensors
function generateApiKey(): string {
    return 'sk_' + crypto.randomBytes(24).toString('hex');
}

export const createSensor = async (req: AuthRequest, res: Response) => {
    try {
        const { name, location, type } = req.body;

        if (!name || !location || !type) {
            return res.status(400).json({ message: 'Missing required fields: name, location, type' });
        }

        const apiKey = generateApiKey();

        const newSensor = new Sensor({
            name,
            location,
            type,
            owner: req.user?.username, // Store owner reference
            apiKey
        });

        await newSensor.save();
        return res.status(201).json({ message: 'Sensor created successfully', sensor: newSensor });
    } catch (error) {
        console.error('Error creating sensor:', error);
        return res.status(500).json({ message: 'Internal server error', error });
    }
};

export const getSensors = async (req: AuthRequest, res: Response) => {
    try {
        // Admins see all sensors, regular users see only their own
        const query = req.user?.role === UserRole.ADMIN 
            ? {} 
            : { owner: req.user?.username };
        
        const sensors = await Sensor.find(query);
        return res.status(200).json({ sensors });
    } catch (error) {
        console.error('Error fetching sensors:', error);
        return res.status(500).json({ message: 'Internal server error', error });
    }
};

export const getSensorById = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const sensor = await Sensor.findById(id);

        if (!sensor) {
            return res.status(404).json({ message: 'Sensor not found' });
        }

        // Check ownership (unless admin)
        if (req.user?.role !== UserRole.ADMIN && sensor.owner !== req.user?.username) {
            return res.status(403).json({ message: 'Access denied' });
        }

        return res.status(200).json({ sensor });
    } catch (error) {
        console.error('Error fetching sensor:', error);
        return res.status(500).json({ message: 'Internal server error', error });
    }
};

export const updateSensor = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { name, location, type, isActive } = req.body;

        // First check ownership
        const existingSensor = await Sensor.findById(id);
        if (!existingSensor) {
            return res.status(404).json({ message: 'Sensor not found' });
        }

        if (req.user?.role !== UserRole.ADMIN && existingSensor.owner !== req.user?.username) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const sensor = await Sensor.findByIdAndUpdate(
            id,
            { name, location, type, isActive },
            { new: true }
        );

        return res.status(200).json({ message: 'Sensor updated successfully', sensor });
    } catch (error) {
        console.error('Error updating sensor:', error);
        return res.status(500).json({ message: 'Internal server error', error });
    }
};

export const deleteSensor = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        
        // First check ownership
        const existingSensor = await Sensor.findById(id);
        if (!existingSensor) {
            return res.status(404).json({ message: 'Sensor not found' });
        }

        if (req.user?.role !== UserRole.ADMIN && existingSensor.owner !== req.user?.username) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Delete all measurements for this sensor
        await Measurement.deleteMany({ sensor: id });
        
        // Delete the sensor
        await Sensor.findByIdAndDelete(id);

        return res.status(200).json({ message: 'Sensor and its measurements deleted successfully' });
    } catch (error) {
        console.error('Error deleting sensor:', error);
        return res.status(500).json({ message: 'Internal server error', error });
    }
};

// Get measurements for a specific sensor
export const getSensorMeasurements = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const sensor = await Sensor.findById(id);

        if (!sensor) {
            return res.status(404).json({ message: 'Sensor not found' });
        }

        // Check ownership (unless admin)
        if (req.user?.role !== UserRole.ADMIN && sensor.owner !== req.user?.username) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const measurements = await Measurement.find({ sensor: id }).sort({ timestamp: -1 });
        return res.status(200).json({ measurements });
    } catch (error) {
        console.error('Error fetching measurements:', error);
        return res.status(500).json({ message: 'Internal server error', error });
    }
};