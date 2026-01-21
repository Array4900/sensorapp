import { Request, Response } from 'express';
import Sensor from '../models/Sensor.js';
import Measurement from '../models/Measurement.js';
import Location from '../models/Location.js';
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

        if (!name || !type) {
            return res.status(400).json({ message: 'Missing required fields: name, type' });
        }

        // Validate location if provided
        if (location) {
            const locationDoc = await Location.findById(location);
            if (!locationDoc) {
                return res.status(400).json({ message: 'Location not found' });
            }
            // Check if the location belongs to the user
            if (locationDoc.owner !== req.user?.username) {
                return res.status(403).json({ message: 'You can only assign sensors to your own locations' });
            }
        }

        const apiKey = generateApiKey();

        const newSensor = new Sensor({
            name,
            location: location || null,
            type,
            owner: req.user?.username,
            apiKey
        });

        await newSensor.save();
        
        // Populate location before returning
        await newSensor.populate('location');
        
        return res.status(201).json({ message: 'Sensor created successfully', sensor: newSensor });
    } catch (error) {
        console.error('Error creating sensor:', error);
        return res.status(500).json({ message: 'Internal server error', error });
    }
};

export const getSensors = async (req: AuthRequest, res: Response) => {
    try {
        const { locationId } = req.query;
        
        // Users see only their own sensors, admins in sensors view also see only their own
        const query: any = { owner: req.user?.username };
        
        // Filter by location if provided
        if (locationId) {
            if (locationId === 'none') {
                query.location = null;
            } else {
                query.location = locationId;
            }
        }
        
        const sensors = await Sensor.find(query).populate('location');
        return res.status(200).json({ sensors });
    } catch (error) {
        console.error('Error fetching sensors:', error);
        return res.status(500).json({ message: 'Internal server error', error });
    }
};

export const getSensorById = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const sensor = await Sensor.findById(id).populate('location');

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

        // Validate location if provided
        if (location) {
            const locationDoc = await Location.findById(location);
            if (!locationDoc) {
                return res.status(400).json({ message: 'Location not found' });
            }
            // Check if the location belongs to the user
            if (locationDoc.owner !== req.user?.username) {
                return res.status(403).json({ message: 'You can only assign sensors to your own locations' });
            }
        }

        const updateData: any = { name, type, isActive };
        // Handle location - allow setting to null or a valid location ID
        if (location === null || location === '') {
            updateData.location = null;
        } else if (location) {
            updateData.location = location;
        }

        const sensor = await Sensor.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        ).populate('location');

        return res.status(200).json({ message: 'Sensor updated successfully', sensor });
    } catch (error) {
        console.error('Error updating sensor:', error);
        return res.status(500).json({ message: 'Internal server error', error });
    }
};

// odstranenie senzoru = odstranenie vsetkych jeho merani a potom samotneho senzoru
export const deleteSensor = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        
        // vlastnictvo overenie
        const existingSensor = await Sensor.findById(id);
        if (!existingSensor) {
            return res.status(404).json({ message: 'Sensor not found' });
        }

        if (req.user?.role !== UserRole.ADMIN && existingSensor.owner !== req.user?.username) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // odstran vsetky merania s id daneho senzora
        await Measurement.deleteMany({ sensor: id });
        
        // odstran samotny senzor
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