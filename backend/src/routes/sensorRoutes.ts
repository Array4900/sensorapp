import express from 'express';
import { createSensor, getSensors, getSensorById, updateSensor, deleteSensor, getSensorMeasurements } from '../controllers/sensorController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// All sensor routes require authentication
router.use(authenticateToken);

router.post('/', createSensor);
router.get('/', getSensors);
router.get('/:id', getSensorById);
router.get('/:id/measurements', getSensorMeasurements);
router.put('/:id', updateSensor);
router.delete('/:id', deleteSensor);

export default router;