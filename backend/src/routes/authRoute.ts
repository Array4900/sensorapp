import express from 'express';
import { registerUser, loginUser } from '../controllers/authController.js';

const router = express.Router();

router.post('/register', async (req, res) => {
    try {
        await registerUser(req, res);
    } catch (error) {
        res.status(400).json({ error: 'Error creating user', details: error });
    }
});

router.post('/login', async (req, res) => {
    try {
        await loginUser(req, res);
    } catch (error) {
        res.status(400).json({ error: 'Error logging in', details: error });
    }
});

export default router;