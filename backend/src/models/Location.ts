import mongoose from "mongoose";

const locationSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true
        },
        description: {
            type: String,
            required: false
        },
        coordinates: {
            type: {
                latitude: { type: Number, required: true },
                longitude: { type: Number, required: true }
            },
            required: true
        }, 
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        }
    },
    { timestamps: true, collection: 'locations' }
);