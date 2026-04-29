import mongoose from "mongoose";
import { SensorType } from "../utils/sensorTypes.js";

const sensorSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true
        },
        type: {
            type: String,
            required: true,
            enum: Object.values(SensorType),
            default: SensorType.ULTRASONIC_AJ_SR04M_GEN1,
        },
        tankHeight: {
            type: Number,
            required: true,
        },
        owner: {
            type: String,
            required: true
        },
        macAddress: {
            type: String,
            required: true,
            unique: true
        },
        // Unikatny API kluc pre senzor, aby sa zabranilo neautorizovanemu
        // pridavaniu merani.
        apiKey: {
            type: String,
            required: true,
            unique: true
        },
        // QR kod API klucu ulozeny ako base64 PNG obrázok
        qrCode: {
            type: String,
            required: false,
            default: ''
        },
        isActive: {
            type: Boolean,
            default: true
        },
        lastThresholdNotificationLevel: {
            type: String,
            enum: ['none', 'warning', 'almost_full', 'critical'],
            default: 'none'
        },
        lastDailyNotificationDate: {
            type: String,
            default: ''
        }
    },
    { timestamps: true, collection: 'sensors' }
);

export default mongoose.model("Sensor", sensorSchema);