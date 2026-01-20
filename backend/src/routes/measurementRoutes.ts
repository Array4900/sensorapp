import express from 'express';
import { addMeasurement } from '../controllers/measurementController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Meranie môže pridávať zariadenie pomocou svojho API kľúča,
// preto táto cesta nevyžaduje bežné overenie tokenom.
router.post('/', addMeasurement);


export default router;