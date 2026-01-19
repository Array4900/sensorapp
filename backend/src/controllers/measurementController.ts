import { Request, Response } from 'express';
import Measurement from '../models/Measurement.js';

interface AuthRequest extends Request {
    user?: { username: string; role: string };
}

export const createMeasurement = async (req: AuthRequest, res: Response) => {
    try {
        const { sensor, value, unit } = req.body;

        if (!sensor || value === undefined || !unit) {
            return res.status(400).json({ message: 'Missing required fields: sensor, value, unit' });
        }

        const newMeasurement = new Measurement({
            sensor,
            value,
            unit,
            timestamp: new Date()
        });

        await newMeasurement.save();
        return res.status(201).json({ message: 'Measurement created successfully', measurement: newMeasurement });
    } catch (error) {
        console.error('Error creating measurement:', error);
        return res.status(500).json({ message: 'Internal server error', error });
    }
};

export const getMeasurements = async (req: AuthRequest, res: Response) => {
    try {
        const measurements = await Measurement.find().populate('sensor');
        return res.status(200).json({ measurements });
    } catch (error) {
        console.error('Error fetching measurements:', error);
        return res.status(500).json({ message: 'Internal server error', error });
    }
};

export const getMeasurementsBySensor = async (req: AuthRequest, res: Response) => {
    try {
        const { sensorId } = req.params;
        const measurements = await Measurement.find({ sensor: sensorId });

        if (measurements.length === 0) {
            return res.status(404).json({ message: 'No measurements found for this sensor' });
        }

        return res.status(200).json({ measurements });
    } catch (error) {
        console.error('Error fetching measurements:', error);
        return res.status(500).json({ message: 'Internal server error', error });
    }
};

export const getMeasurementById = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const measurement = await Measurement.findById(id).populate('sensor');

        if (!measurement) {
            return res.status(404).json({ message: 'Measurement not found' });
        }

        return res.status(200).json({ measurement });
    } catch (error) {
        console.error('Error fetching measurement:', error);
        return res.status(500).json({ message: 'Internal server error', error });
    }
};

export const updateMeasurement = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { value, unit } = req.body;

        const measurement = await Measurement.findByIdAndUpdate(
            id,
            { value, unit },
            { new: true }
        ).populate('sensor');

        if (!measurement) {
            return res.status(404).json({ message: 'Measurement not found' });
        }

        return res.status(200).json({ message: 'Measurement updated successfully', measurement });
    } catch (error) {
        console.error('Error updating measurement:', error);
        return res.status(500).json({ message: 'Internal server error', error });
    }
};

export const deleteMeasurement = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const measurement = await Measurement.findByIdAndDelete(id);

        if (!measurement) {
            return res.status(404).json({ message: 'Measurement not found' });
        }

        return res.status(200).json({ message: 'Measurement deleted successfully' });
    } catch (error) {
        console.error('Error deleting measurement:', error);
        return res.status(500).json({ message: 'Internal server error', error });
    }
};