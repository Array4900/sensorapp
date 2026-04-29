import express from 'express';
import { addMeasurement } from '../controllers/measurementController.js';
import { measurementIngestRateLimiter } from '../middleware/rateLimitMiddleware.js';

const router = express.Router();

// Meranie môže pridávať zariadenie pomocou svojho API kľúča,
// preto táto cesta nevyžaduje bežné overenie tokenom.
router.post('/', measurementIngestRateLimiter, addMeasurement);


export default router;