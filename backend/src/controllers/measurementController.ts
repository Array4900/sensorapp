import { Request, Response } from 'express';
import Sensor from "../models/Sensor.js";
import Measurement from '../models/Measurement.js';

interface AuthRequest extends Request {
    user?: { username: string; role: string };
}

export const addMeasurement = async (req: Request, res: Response) => {
    try {
        // 1. Získanie API kľúča z hlavičky požiadavky
        const apiKey = req.headers['x-api-key'];
        const { value } = req.body; // { "value": 24.5 }

        if (!apiKey) {
            return res.status(401).json({ message: "Chýba API kľúč zariadenia." });
        }

        // 2. Overenie, či senzor s týmto kľúčom existuje
        const sensor = await Sensor.findOne({ apiKey });

        if (!sensor) {
            return res.status(403).json({ message: "Neplatný API kľúč. Zariadenie nie je registrované." });
        }

        // 3. Vytvorenie a uloženie merania
        const newMeasurement = new Measurement({
            sensor: sensor._id, // Prepojenie na konkrétny senzor (1:N)
            value: value,
            timestamp: new Date()
        });

        await newMeasurement.save();

        // 4. Odpoveď pre ESP32
        return res.status(201).json({ message: "Dáta úspešne uložené." });

    } catch (err) {
        console.error("Chyba pri ukladaní merania:", err);
        return res.status(500).json({ message: "Interná chyba servera." });
    }
};