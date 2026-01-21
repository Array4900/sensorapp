import express from "express";
import connectToDatabase from './config/db.js';
import cors from 'cors';
import dotenv from "dotenv";

import authRoutes from './routes/authRoute.js';
import sensorRoutes from './routes/sensorRoutes.js';
import measurementRoutes from './routes/measurementRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import locationRoutes from './routes/locationRoutes.js';

const app = express();
app.use(cors( {
    origin: '*'
}));

dotenv.config();
console.log("Moja URI:", process.env.MONGO_URI);
console.log("Moja PORT:", process.env.PORT);
console.log("DEBUG: Používam secret:", process.env.JWT_SECRET ? "Kľúč načítaný" : "KĽÚČ CHÝBA (UNDEFINED)!");
app.use(express.json());

try {
    await connectToDatabase();
    let port = parseInt(process.env.PORT as string, 10);
    app.listen( port , '0.0.0.0',() => {
        console.log("Server running on port " + port);
    });
} catch (error) {
    console.error("Database connection failed:", error);
    process.exit(1);
}

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/sensors', sensorRoutes);
app.use('/api/measurements', measurementRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/locations', locationRoutes);


