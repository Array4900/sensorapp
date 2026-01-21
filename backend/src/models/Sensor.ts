import mongoose from "mongoose";

const sensorSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true
        },
        location: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Location',
            required: false
        },
        type: {
            type: String,
            required: true
        },
        owner: {
            type: String,
            required: true
        },
        // Unikatny API kluc pre senzor, aby sa zabranilo neautorizovanemu
        // pridavaniu merani.
        apiKey: {
            type: String,
            required: true,
            unique: true
        },
        isActive: {
            type: Boolean,
            default: true
        }
    },
    { timestamps: true, collection: 'sensors' }
);

export default mongoose.model("Sensor", sensorSchema);