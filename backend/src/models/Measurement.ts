import mongoose from "mongoose";

const measurementSchema = new mongoose.Schema(
    {
        sensor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Sensor',
            required: true
        },
        value: {
            type: Number,
            required: true
        },
        unit: {
            type: String,
            default: ''
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    },
    { timestamps: true, collection: 'measurements' }
);

export default mongoose.model("Measurement", measurementSchema);