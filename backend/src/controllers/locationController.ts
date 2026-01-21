import { Request, Response } from 'express';
import Location from '../models/Location.js';
import Sensor from '../models/Sensor.js';

interface AuthRequest extends Request {
    user?: { username: string; role: string };
}

// Create a new location
export const createLocation = async (req: AuthRequest, res: Response) => {
    try {
        const { name, description } = req.body;

        if (!name) {
            return res.status(400).json({ message: 'Location name is required' });
        }

        // Check if user already has a location with this name
        const existingLocation = await Location.findOne({ 
            name, 
            owner: req.user?.username 
        });

        if (existingLocation) {
            return res.status(400).json({ message: 'You already have a location with this name' });
        }

        const newLocation = new Location({
            name,
            description: description || '',
            owner: req.user?.username
        });

        await newLocation.save();
        return res.status(201).json({ message: 'Location created successfully', location: newLocation });
    } catch (error) {
        console.error('Error creating location:', error);
        return res.status(500).json({ message: 'Internal server error', error });
    }
};

// Get all locations for the current user
export const getLocations = async (req: AuthRequest, res: Response) => {
    try {
        const locations = await Location.find({ owner: req.user?.username });
        return res.status(200).json({ locations });
    } catch (error) {
        console.error('Error fetching locations:', error);
        return res.status(500).json({ message: 'Internal server error', error });
    }
};

// Get a specific location by ID
export const getLocationById = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const location = await Location.findById(id);

        if (!location) {
            return res.status(404).json({ message: 'Location not found' });
        }

        // Check ownership
        if (location.owner !== req.user?.username) {
            return res.status(403).json({ message: 'Access denied' });
        }

        return res.status(200).json({ location });
    } catch (error) {
        console.error('Error fetching location:', error);
        return res.status(500).json({ message: 'Internal server error', error });
    }
};

// Update a location
export const updateLocation = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;

        const existingLocation = await Location.findById(id);
        if (!existingLocation) {
            return res.status(404).json({ message: 'Location not found' });
        }

        // Check ownership
        if (existingLocation.owner !== req.user?.username) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Check if the new name already exists for this user (if name is being changed)
        if (name && name !== existingLocation.name) {
            const duplicateName = await Location.findOne({ 
                name, 
                owner: req.user?.username,
                _id: { $ne: id }
            });
            if (duplicateName) {
                return res.status(400).json({ message: 'You already have a location with this name' });
            }
        }

        const location = await Location.findByIdAndUpdate(
            id,
            { name, description },
            { new: true }
        );

        return res.status(200).json({ message: 'Location updated successfully', location });
    } catch (error) {
        console.error('Error updating location:', error);
        return res.status(500).json({ message: 'Internal server error', error });
    }
};

// Delete a location
export const deleteLocation = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        const existingLocation = await Location.findById(id);
        if (!existingLocation) {
            return res.status(404).json({ message: 'Location not found' });
        }

        // Check ownership
        if (existingLocation.owner !== req.user?.username) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Check if any sensors are using this location
        const sensorsUsingLocation = await Sensor.countDocuments({ location: id });
        if (sensorsUsingLocation > 0) {
            return res.status(400).json({ 
                message: `Cannot delete location. ${sensorsUsingLocation} sensor(s) are still assigned to this location.`
            });
        }

        await Location.findByIdAndDelete(id);
        return res.status(200).json({ message: 'Location deleted successfully' });
    } catch (error) {
        console.error('Error deleting location:', error);
        return res.status(500).json({ message: 'Internal server error', error });
    }
};
