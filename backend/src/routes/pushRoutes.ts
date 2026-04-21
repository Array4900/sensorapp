import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { requireAdmin } from '../middleware/adminMiddleWare.js';
import {
    deletePushSubscription,
    getSentNotificationHistory,
    savePushSubscription,
    sendPushNotification
} from '../controllers/pushController.js';

const router = express.Router();

router.use(authenticateToken);
router.post('/subscriptions', savePushSubscription);
router.delete('/subscriptions', deletePushSubscription);
router.get('/history', getSentNotificationHistory);
router.post('/send', requireAdmin, sendPushNotification);

export default router;