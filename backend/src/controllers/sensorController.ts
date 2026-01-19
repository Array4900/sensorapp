import { Request, Response } from 'express';
import Sensor from '../models/Sensor.js';
import { UserRole } from '../utils/roleEnum.js';

interface AuthRequest extends Request {
    user?: { username: string; role: string };
}

export const createSensor = async (req: AuthRequest, res: Response) => {
    try {
        const { name, location, type } = req.body;

        if (!name || !location || !type) {
            return res.status(400).json({ message: 'Missing required fields: name, location, type' });
        }

        const newSensor = new Sensor({
            name,
            location,
            type,
            owner: req.user?.username // Store owner reference
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
        const sensors = await Sensor.find();
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

        const sensor = await Sensor.findByIdAndUpdate(
            id,
            { name, location, type, isActive },
            { new: true }
        );

        if (!sensor) {
            return res.status(404).json({ message: 'Sensor not found' });
        }

        return res.status(200).json({ message: 'Sensor updated successfully', sensor });
    } catch (error) {
        console.error('Error updating sensor:', error);
        return res.status(500).json({ message: 'Internal server error', error });
    }
};

export const deleteSensor = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const sensor = await Sensor.findByIdAndDelete(id);

        if (!sensor) {
            return res.status(404).json({ message: 'Sensor not found' });
        }

        return res.status(200).json({ message: 'Sensor deleted successfully' });
    } catch (error) {
        console.error('Error deleting sensor:', error);
        return res.status(500).json({ message: 'Internal server error', error });
    }
};