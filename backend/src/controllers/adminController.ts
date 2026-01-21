import { Request, Response } from 'express';
import User from '../models/User.js';
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

// Middleware to check admin role
export const requireAdmin = (req: AuthRequest, res: Response, next: Function) => {
    if (req.user?.role !== UserRole.ADMIN) {
        return res.status(403).json({ message: 'Admin access required' });
    }
    next();
};

// Get all users
export const getAllUsers = async (req: AuthRequest, res: Response) => {
    try {
        const users = await User.find({}, { password: 0 }); // Exclude password
        return res.status(200).json({ users });
    } catch (error) {
        console.error('Error fetching users:', error);
        return res.status(500).json({ message: 'Internal server error', error });
    }
};

// Get all sensors (for admin - includes owner info)
export const getAllSensors = async (req: AuthRequest, res: Response) => {
    try {
        const sensors = await Sensor.find().populate('location');
        return res.status(200).json({ sensors });
    } catch (error) {
        console.error('Error fetching sensors:', error);
        return res.status(500).json({ message: 'Internal server error', error });
    }
};

// Get all locations (for admin dashboard)
export const getAllLocations = async (req: AuthRequest, res: Response) => {
    try {
        const locations = await Location.find();
        return res.status(200).json({ locations });
    } catch (error) {
        console.error('Error fetching locations:', error);
        return res.status(500).json({ message: 'Internal server error', error });
    }
};

// Get sensors by user
export const getSensorsByUser = async (req: AuthRequest, res: Response) => {
    try {
        const { username } = req.params;
        const sensors = await Sensor.find({ owner: username }).populate('location');
        return res.status(200).json({ sensors });
    } catch (error) {
        console.error('Error fetching sensors:', error);
        return res.status(500).json({ message: 'Internal server error', error });
    }
};

// Get locations by user
export const getLocationsByUser = async (req: AuthRequest, res: Response) => {
    try {
        const { username } = req.params;
        const locations = await Location.find({ owner: username });
        return res.status(200).json({ locations });
    } catch (error) {
        console.error('Error fetching locations:', error);
        return res.status(500).json({ message: 'Internal server error', error });
    }
};

// Delete user and all their data
export const deleteUser = async (req: AuthRequest, res: Response) => {
    try {
        const { username } = req.params;
        
        // Don't allow deleting yourself
        if (username === req.user?.username) {
            return res.status(400).json({ message: 'Cannot delete your own account via admin panel' });
        }

        // Find the user
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Find all sensors belonging to this user
        const userSensors = await Sensor.find({ owner: username });
        const sensorIds = userSensors.map(s => s._id);

        // Delete all measurements for user's sensors
        await Measurement.deleteMany({ sensor: { $in: sensorIds } });

        // Delete all sensors
        await Sensor.deleteMany({ owner: username });

        // Delete all locations
        const deletedLocations = await Location.deleteMany({ owner: username });

        // Delete the user
        await User.deleteOne({ username });

        return res.status(200).json({ 
            message: 'User and all associated data deleted successfully',
            deleted: {
                sensors: userSensors.length,
                locations: deletedLocations.deletedCount,
                user: username
            }
        });
    } catch (error) {
        console.error('Error deleting user:', error);
        return res.status(500).json({ message: 'Internal server error', error });
    }
};

// Delete a specific sensor (admin override)
export const adminDeleteSensor = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        
        const sensor = await Sensor.findById(id);
        if (!sensor) {
            return res.status(404).json({ message: 'Sensor not found' });
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

// Transfer sensor ownership to another user
export const transferSensorOwnership = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { newOwner } = req.body;

        if (!newOwner) {
            return res.status(400).json({ message: 'New owner username is required' });
        }

        // Check if the sensor exists
        const sensor = await Sensor.findById(id);
        if (!sensor) {
            return res.status(404).json({ message: 'Sensor not found' });
        }

        // Check if the new owner exists
        const newOwnerUser = await User.findOne({ username: newOwner });
        if (!newOwnerUser) {
            return res.status(404).json({ message: 'New owner user not found' });
        }

        // Check if trying to transfer to the same owner
        if (sensor.owner === newOwner) {
            return res.status(400).json({ message: 'Sensor already belongs to this user' });
        }

        // Generate new API key for security
        const newApiKey = generateApiKey();

        // Update sensor: change owner, set location to null, generate new API key
        const updatedSensor = await Sensor.findByIdAndUpdate(
            id,
            {
                owner: newOwner,
                location: null,
                apiKey: newApiKey
            },
            { new: true }
        ).populate('location');

        return res.status(200).json({
            message: `Sensor transferred to ${newOwner} successfully. New API key generated.`,
            sensor: updatedSensor
        });
    } catch (error) {
        console.error('Error transferring sensor:', error);
        return res.status(500).json({ message: 'Internal server error', error });
    }
};
