import express from "express";
import connectToDatabase from './config/db.js';
import cors from 'cors';
import dotenv from "dotenv";
import mqtt from 'mqtt';

import authRoutes from './routes/authRoute.js';
import sensorRoutes from './routes/sensorRoutes.js';
import measurementRoutes from './routes/measurementRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import pushRoutes from './routes/pushRoutes.js';
import { startTokenCleanupScheduler } from './utils/tokenBlacklist.js';
import { configurePushNotifications } from './utils/pushNotifications.js';
import { handleThresholdNotification, startDailySensorNotificationScheduler } from './utils/sensorNotifications.js';
import Sensor from './models/Sensor.js';
import Measurement from './models/Measurement.js';

const allowedOrigins = new Set([
    'https://sahur.sk',
    'https://www.sahur.sk',
    'https://api.sahur.sk',
    'http://localhost:3000'
]);

const corsOptions: cors.CorsOptions = {
    origin(origin, callback) {
        if (!origin || allowedOrigins.has(origin)) {
            callback(null, true);
            return;
        }

        callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 204
};

const app = express();
app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));

dotenv.config();
console.log("Moja URI:", process.env.MONGO_URI);
console.log("Moja PORT:", process.env.PORT);
console.log(process.env.JWT_SECRET ? "Kľúč JWT načítaný" : "KĽÚČ JWT CHÝBA (UNDEFINED)!");
configurePushNotifications();
app.use(express.json());

try {
    await connectToDatabase();

    // Spusti pravidelné čistenie expirovaných tokenov z blacklistu
    startTokenCleanupScheduler();
    startDailySensorNotificationScheduler();

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
app.use('/api/push', pushRoutes);


// ============================================
// MQTT Subscription - pre AJ_SR04M to bude sensor/+/ULTRASONIC_AJ_SR04M_GEN1
// ============================================
const MQTT_BROKER: string = process.env.MQTT_BROKER_URL as string;
const MQTT_TOPIC: string = process.env.MQTT_TOPIC as string;
const MQTT_TOPIC_ACK_PREFIX = 'sensor/+/ack/';  // + apiKey

const MQTT_OPTIONS = {
    username: process.env.MQTT_USER,
    password: process.env.MQTT_PASSWORD,
    clientId: `api_server_${Math.random().toString(16).slice(3)}`, // Unikátne ID
    clean: true,
    reconnectPeriod: 5000
};

const mqttClient = mqtt.connect(MQTT_BROKER, MQTT_OPTIONS);

mqttClient.on('connect', () => {
    console.log(`MQTT: Pripojený k brokeru ${MQTT_BROKER}`);
    mqttClient.subscribe([MQTT_TOPIC], (err) => {
        if (err) {
            console.error('MQTT: Chyba pri subscribovaní:', err);
        } else {
            console.log(`MQTT: Subscribnutý na topic "${MQTT_TOPIC}"`);
        }
    });
});

mqttClient.on('message', async (topic: string, message: Buffer) => {
    // Toto sa vypíše VŽDY, keď príde správa
    console.log(`📩 DEBUG: Prišla správa na topic [${topic}]`);
    
    const parts = topic.split('/');
    const macFromTopic = parts[1];

    try {
        const payload = JSON.parse(message.toString());
        const { apiKey, distance, temperatureC } = payload;

        // Validácia existencie senzora
        const sensor = await Sensor.findOne({ apiKey: apiKey, macAddress: macFromTopic });
        
        if (!sensor) {
            console.warn(`!! MQTT: Neznámy senzor (Kľúč: ${apiKey}, MAC: ${macFromTopic})`);
            return;
        }

        const distanceCm = parseFloat(distance);
        

        const newMeasurement = new Measurement({
            sensor: sensor._id,
            value: distanceCm,
            unit: 'cm',
            temperatureC: temperatureC,
            timestamp: new Date()
        });

        await newMeasurement.save();
        console.log(`✅ MQTT: Meranie uložené pre ${sensor.name}: ${distanceCm} cm`);

        // ACK posielajte na statický topic bez pluska
        const ackTopic = `sensor/${macFromTopic}/ack`;
        mqttClient.publish(ackTopic, JSON.stringify({ status: 'ok' }));

    } catch (err) {
        console.error('MQTT: Chyba spracovania JSONu:', err);
    }
});

mqttClient.on('error', (err: Error) => {
    console.error('MQTT: Chyba pripojenia:', err);
});


