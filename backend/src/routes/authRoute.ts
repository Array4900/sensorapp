import express from 'express';
import { registerUser, loginUser, changePassword } from '../controllers/authController.js';

const router = express.Router();

// create
router.post('/register', async (req, res) => {
    try {
        await registerUser(req, res);
    } catch (error) {
        res.status(400).json({ error: 'Error creating user', details: error });
    }
});
// read
router.post('/login', async (req, res) => {
    try {
        await loginUser(req, res);
    } catch (error) {
        res.status(400).json({ error: 'Error logging in', details: error });
    }
});

// update
router.post('/changePassword', async (req, res) => {
    try {
        await changePassword(req, res);
    } catch (error) {
        res.status(400).json({ error: 'Error changing password', details: error });
    }
});

export default router;