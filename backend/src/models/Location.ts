import mongoose from "mongoose";

const locationSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true
        },
        description: {
            type: String,
            required: false,
            default: ''
        }, 
        owner: {
            type: String,
            required: true
        }
    },
    { timestamps: true, collection: 'locations' }
);

// Compound index to ensure unique names per user (not globally unique)
locationSchema.index({ name: 1, owner: 1 }, { unique: true });

export default mongoose.model("Location", locationSchema);