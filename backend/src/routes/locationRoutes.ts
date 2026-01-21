import express from 'express';
import { 
    createLocation, 
    getLocations, 
    getLocationById, 
    updateLocation, 
    deleteLocation 
} from '../controllers/locationController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// All location routes require authentication
router.use(authenticateToken);

router.post('/', createLocation);
router.get('/', getLocations);
router.get('/:id', getLocationById);
router.put('/:id', updateLocation);
router.delete('/:id', deleteLocation);

export default router;
