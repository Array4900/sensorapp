import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { 
    requireAdmin, 
    getAllUsers, 
    getAllSensors,
    getAllLocations,
    getSensorsByUser,
    getLocationsByUser,
    deleteUser, 
    adminDeleteSensor 
} from '../controllers/adminController.js';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticateToken);
router.use(requireAdmin);

// User management
router.get('/users', getAllUsers);
router.delete('/users/:username', deleteUser);

// Sensor management  
router.get('/sensors', getAllSensors);
router.get('/users/:username/sensors', getSensorsByUser);
router.delete('/sensors/:id', adminDeleteSensor);

// Location management
router.get('/locations', getAllLocations);
router.get('/users/:username/locations', getLocationsByUser);

export default router;
