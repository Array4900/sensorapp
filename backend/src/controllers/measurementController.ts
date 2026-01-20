import { Request, Response } from 'express';
import Sensor from "../models/Sensor.js";
import Measurement from '../models/Measurement.js';

interface AuthRequest extends Request {
    user?: { username: string; role: string };
}

export const addMeasurement = async (req: Request, res: Response) => {
    try {
        // ziskanie api z hlavicky requestu
        const apiKey = req.headers['x-api-key'];
        // ziskanie params z body poziadavky
        const { value } = req.body; // { "value": 24.5 }
        const { unit } = req.body; // { "unit": "mm" }

        if (!apiKey) {
            return res.status(401).json({ message: "Api key missing in header {x-api-key}." });
        }

        // overenie existencie senzora so zadaným API kľúčom
        const sensor = await Sensor.findOne({ apiKey });

        if (!sensor) {
            return res.status(403).json({ message: "Invalid API key. Device is not registered." });
        }

        // 3. Vytvorenie a uloženie merania
        const newMeasurement = new Measurement({
            sensor: sensor._id, // Prepojenie na konkrétny senzor (1:N)
            value: value,
            unit: unit,
            timestamp: new Date()
        });

        await newMeasurement.save();

        // 4. Odpoveď pre zariadenie (senzor) posielajúce dáta, napr ESP32
        return res.status(201).json({ message: "Data successfully saved." });

    } catch (err) {
        console.error("Error saving measurement:", err);
        return res.status(500).json({ message: "Internal server error." });
    }
};