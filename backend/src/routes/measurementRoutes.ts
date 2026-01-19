import express from 'express';
import { createMeasurement, getMeasurements, getMeasurementsBySensor, getMeasurementById, updateMeasurement, deleteMeasurement } from '../controllers/measurementController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// All measurement routes require authentication
router.use(authenticateToken);

router.post('/', createMeasurement);
router.get('/', getMeasurements);
router.get('/sensor/:sensorId', getMeasurementsBySensor);
router.get('/:id', getMeasurementById);
router.put('/:id', updateMeasurement);
router.delete('/:id', deleteMeasurement);

export default router;