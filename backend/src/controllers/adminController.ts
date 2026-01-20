import { Request, Response } from 'express';
import User from '../models/User.js';
import Sensor from '../models/Sensor.js';
import Measurement from '../models/Measurement.js';
import { UserRole } from '../utils/roleEnum.js';

interface AuthRequest extends Request {
    user?: { username: string; role: string };
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
        const sensors = await Sensor.find();
        return res.status(200).json({ sensors });
    } catch (error) {
        console.error('Error fetching sensors:', error);
        return res.status(500).json({ message: 'Internal server error', error });
    }
};

// Get sensors by user
export const getSensorsByUser = async (req: AuthRequest, res: Response) => {
    try {
        const { username } = req.params;
        const sensors = await Sensor.find({ owner: username });
        return res.status(200).json({ sensors });
    } catch (error) {
        console.error('Error fetching sensors:', error);
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

        // Delete the user
        await User.deleteOne({ username });

        return res.status(200).json({ 
            message: 'User and all associated data deleted successfully',
            deleted: {
                sensors: userSensors.length,
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
