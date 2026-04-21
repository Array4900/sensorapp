import mongoose from 'mongoose';

const pushSubscriptionSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            index: true
        },
        endpoint: {
            type: String,
            required: true,
            unique: true
        },
        expirationTime: {
            type: Number,
            default: null
        },
        keys: {
            p256dh: {
                type: String,
                required: true
            },
            auth: {
                type: String,
                required: true
            }
        },
        userAgent: {
            type: String,
            default: ''
        }
    },
    { timestamps: true, collection: 'push_subscriptions' }
);

export default mongoose.model('PushSubscription', pushSubscriptionSchema);