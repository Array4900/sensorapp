import mongoose from 'mongoose';

const sentNotificationSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            index: true
        },
        title: {
            type: String,
            required: true
        },
        body: {
            type: String,
            required: true
        },
        url: {
            type: String,
            default: '/dashboard'
        },
        category: {
            type: String,
            enum: ['threshold', 'daily', 'manual'],
            required: true
        },
        sensorName: {
            type: String,
            default: ''
        },
        deliveredCount: {
            type: Number,
            default: 0
        },
        removedCount: {
            type: Number,
            default: 0
        },
        targetedSubscriptions: {
            type: Number,
            default: 0
        }
    },
    { timestamps: true, collection: 'sent_notifications' }
);

export default mongoose.model('SentNotification', sentNotificationSchema);