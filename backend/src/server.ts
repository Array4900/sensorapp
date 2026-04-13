import express from "express";
import connectToDatabase from './config/db.js';
import cors from 'cors';
import dotenv from "dotenv";
import mqtt from 'mqtt';

import authRoutes from './routes/authRoute.js';
import sensorRoutes from './routes/sensorRoutes.js';
import measurementRoutes from './routes/measurementRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { startTokenCleanupScheduler } from './utils/tokenBlacklist.js';
import Sensor from './models/Sensor.js';
import Measurement from './models/Measurement.js';

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

    // Spusti pravidelné čistenie expirovaných tokenov z blacklistu
    startTokenCleanupScheduler();

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

// ============================================
// MQTT Subscription - sensor/merania
// ============================================
const MQTT_BROKER = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883';
const MQTT_TOPIC_MERANIA = 'sensor/merania';
const MQTT_TOPIC_TEST = 'sensor/test';
const MQTT_TOPIC_ACK_PREFIX = 'sensor/ack/';  // + apiKey

const mqttClient = mqtt.connect(MQTT_BROKER);

mqttClient.on('connect', () => {
    console.log(`MQTT: Pripojený k brokeru ${MQTT_BROKER}`);
    mqttClient.subscribe([MQTT_TOPIC_MERANIA, MQTT_TOPIC_TEST], (err) => {
        if (err) {
            console.error('MQTT: Chyba pri subscribovaní:', err);
        } else {
            console.log(`MQTT: Subscribnutý na topicy "${MQTT_TOPIC_MERANIA}", "${MQTT_TOPIC_TEST}"`);
        }
    });
});

mqttClient.on('message', async (topic: string, message: Buffer) => {
    // ── Test / handshake ──
    if (topic === MQTT_TOPIC_TEST) {
        try {
            const payload = JSON.parse(message.toString());
            const { apiKey } = payload;

            if (!apiKey) {
                console.warn('MQTT TEST: Chýba apiKey:', payload);
                return;
            }

            const sensor = await Sensor.findOne({ apiKey });
            if (!sensor) {
                console.warn('MQTT TEST: Neplatný API kľúč:', apiKey);
                mqttClient.publish(`${MQTT_TOPIC_ACK_PREFIX}${apiKey}`, JSON.stringify({
                    status: 'error',
                    message: 'Neplatný API kľúč'
                }));
                return;
            }

            // Odošli ACK späť na topic sensor/ack/<apiKey>
            mqttClient.publish(`${MQTT_TOPIC_ACK_PREFIX}${apiKey}`, JSON.stringify({
                status: 'ok',
                sensorName: sensor.name
            }));
            console.log(`MQTT TEST: ACK odoslaný pre senzor "${sensor.name}"`);
        } catch (err) {
            console.error('MQTT TEST: Chyba pri spracovaní:', err);
        }
        return;
    }

    // ── Merania ──
    if (topic === MQTT_TOPIC_MERANIA) {
        try {
            const payload = JSON.parse(message.toString());
            const { apiKey, distance } = payload;

            if (!apiKey || distance === undefined) {
                console.warn('MQTT: Neplatná správa - chýba apiKey alebo distance:', payload);
                return;
            }

            const sensor = await Sensor.findOne({ apiKey });
            if (!sensor) {
                console.warn('MQTT: Neplatný API kľúč:', apiKey);
                return;
            }

            const newMeasurement = new Measurement({
                sensor: sensor._id,
                value: parseFloat(distance),
                unit: 'cm',
                timestamp: new Date()
            });

            await newMeasurement.save();
            console.log(`MQTT: Meranie uložené - senzor: ${sensor.name}, vzdialenosť: ${distance} cm`);
        } catch (err) {
            console.error('MQTT: Chyba pri spracovaní správy:', err);
        }
    }
});

mqttClient.on('error', (err: Error) => {
    console.error('MQTT: Chyba pripojenia:', err);
});


