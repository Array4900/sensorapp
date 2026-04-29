import type { Request, Response } from 'express';
import Sensor from '../models/Sensor.js';
import Measurement from '../models/Measurement.js';
import { UserRole } from '../utils/roleEnum.js';
import crypto from 'crypto';
import QRCode from 'qrcode';

import { SensorType } from '../utils/sensorTypes.js';

interface AuthRequest extends Request {
    user?: { username: string; role: string };
}

// Generate a unique API key for sensors
function generateApiKey(): string {
    return 'sk_' + crypto.randomBytes(24).toString('hex');
}

export const getSensorTypes = async (_req: AuthRequest, res: Response) => {
    try {
        return res.status(200).json({
            sensorTypes: [
                {
                    id: SensorType.ULTRASONIC_AJ_SR04M_GEN1,
                    label: 'Ultrazvukový hladinomer AJ_SR04 (Gen 1)',
                    params: ['tankHeight']
                }
            ]
        });
    } catch (error) {
        console.error('Error fetching sensor types:', error);
        return res.status(500).json({ message: 'Internal server error', error });
    }
};

export const createSensor = async (req: AuthRequest, res: Response) => {
    try {
        // Iba admin môže vytvoriť senzor
        if (req.user?.role !== UserRole.ADMIN) {
            return res.status(403).json({ message: 'Iba administrátor môže vytvoriť senzor.' });
        }

        const { name, macAddress, owner, type, tankHeight } = req.body;


        if (!name) {
            return res.status(400).json({ message: 'Názov senzora je povinný.' });
        }

        if (!macAddress) {
            return res.status(400).json({ message: 'MAC adresa senzora je povinná.' });
        } else if (!/^([0-9A-Fa-f]{2}[:]){5}([0-9A-Fa-f]{2})$/.test(macAddress)) {
            return res.status(400).json({ message: 'Neplatný formát MAC adresy. Očakáva sa formát XX:XX:XX:XX:XX:XX.' });
        } 

        if (!Object.values(SensorType).includes(type)) {
            return res.status(400).json({ message: 'Neplatný typ senzora.' });
        }

        if (type === SensorType.ULTRASONIC_AJ_SR04M_GEN1) {
            if (tankHeight === undefined || tankHeight === null || Number.isNaN(Number(tankHeight))) {
                return res.status(400).json({ message: 'Výška nádrže je pri tomto senzore povinná.' });
            }

            if (Number(tankHeight) <= 0) {
                return res.status(400).json({ message: 'Výška nádrže musí byť väčšia ako 0.' });
            }

        }

        const apiKey = generateApiKey();

        // Vygeneruj QR kód z API kľúča ako base64 PNG
        const qrCode = await QRCode.toDataURL(apiKey);

        const newSensor = new Sensor({
            name,
            macAddress,
            type,
            tankHeight: Number(tankHeight),
            owner: owner || req.user?.username,
            apiKey,
            qrCode
        });

        await newSensor.save();
        
        return res.status(201).json({ message: 'Senzor úspešne vytvorený.', sensor: newSensor });
    } catch (error) {
        console.error('Error creating sensor:', error);
        return res.status(500).json({ message: 'Internal server error', error });
    }
};

export const getSensors = async (req: AuthRequest, res: Response) => {
    try {
        // Users see only their own sensors
        const query: any = { owner: req.user?.username };
        
        const sensors = await Sensor.find(query);
        return res.status(200).json({ sensors });
    } catch (error) {
        console.error('Error fetching sensors:', error);
        return res.status(500).json({ message: 'Internal server error', error });
    }
};

export const getSensorById = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const sensor = await Sensor.findById(id);

        if (!sensor) {
            return res.status(404).json({ message: 'Sensor not found' });
        }

        // Check ownership (unless admin)
        if (req.user?.role !== UserRole.ADMIN && sensor.owner !== req.user?.username) {
            return res.status(403).json({ message: 'Access denied' });
        }

        return res.status(200).json({ sensor });
    } catch (error) {
        console.error('Error fetching sensor:', error);
        return res.status(500).json({ message: 'Internal server error', error });
    }
};

export const updateSensor = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { name, tankHeight, isActive } = req.body;

        // First check ownership
        const existingSensor = await Sensor.findById(id);
        if (!existingSensor) {
            return res.status(404).json({ message: 'Sensor not found' });
        }

        if (req.user?.role !== UserRole.ADMIN && existingSensor.owner !== req.user?.username) {
            return res.status(403).json({ message: 'Access denied' });
        }

        if (Number(tankHeight) <= 0) {
            return res.status(400).json({ message: 'Výška nádrže musí byť väčšia ako 0.' });
        }   

        const updateData: any = { name, tankHeight, isActive };
        if (tankHeight !== undefined) {
            updateData.tankHeight = tankHeight;
        }

        const sensor = await Sensor.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        );

        return res.status(200).json({ message: 'Sensor updated successfully', sensor });
    } catch (error) {
        console.error('Error updating sensor:', error);
        return res.status(500).json({ message: 'Internal server error', error });
    }
};

// odstranenie senzoru = odstranenie vsetkych jeho merani a potom samotneho senzoru
export const deleteSensor = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        
        // vlastnictvo overenie
        const existingSensor = await Sensor.findById(id);
        if (!existingSensor) {
            return res.status(404).json({ message: 'Sensor not found' });
        }

        if (existingSensor.owner !== req.user?.username) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // odstran vsetky merania s id daneho senzora
        await Measurement.deleteMany({ sensor: id });
        
        // odstran samotny senzor
        await Sensor.findByIdAndDelete(id);

        return res.status(200).json({ message: 'Sensor and its measurements deleted successfully' });
    } catch (error) {
        console.error('Error deleting sensor:', error);
        return res.status(500).json({ message: 'Internal server error', error });
    }
};

// Get measurements for a specific sensor
export const getSensorMeasurements = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const sensor = await Sensor.findById(id);

        if (!sensor) {
            return res.status(404).json({ message: 'Sensor not found' });
        }

        // Check ownership
        if (req.user?.role !== UserRole.ADMIN && sensor.owner !== req.user?.username) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const page = Math.max(Number.parseInt(String(req.query.page || '1'), 10) || 1, 1);
        const limit = Math.max(Number.parseInt(String(req.query.limit || '20'), 10) || 20, 1);
        const skip = (page - 1) * limit;

        const [measurements, total] = await Promise.all([
            Measurement.find({ sensor: id }).sort({ timestamp: -1 }).skip(skip).limit(limit),
            Measurement.countDocuments({ sensor: id })
        ]);

        return res.status(200).json({ measurements, total, page, limit });
    } catch (error) {
        console.error('Error fetching measurements:', error);
        return res.status(500).json({ message: 'Internal server error', error });
    }
};

export const deleteSensorMeasurements = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { measurementIds } = req.body as { measurementIds?: string[] };

        if (!Array.isArray(measurementIds) || measurementIds.length === 0) {
            return res.status(400).json({ message: 'Aspoň jedno ID merania je povinné.' });
        }

        const sensor = await Sensor.findById(id);
        if (!sensor) {
            return res.status(404).json({ message: 'Sensor not found' });
        }

        if (req.user?.role !== UserRole.ADMIN && sensor.owner !== req.user?.username) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const uniqueMeasurementIds = [...new Set(measurementIds.filter((value) => typeof value === 'string' && value.trim().length > 0))];

        if (uniqueMeasurementIds.length === 0) {
            return res.status(400).json({ message: 'Aspoň jedno platné ID merania je povinné.' });
        }

        const result = await Measurement.deleteMany({
            _id: { $in: uniqueMeasurementIds },
            sensor: id
        });

        return res.status(200).json({
            message: 'Merania boli úspešne vymazané.',
            deletedCount: result.deletedCount || 0
        });
    } catch (error) {
        console.error('Error deleting measurements:', error);
        return res.status(500).json({ message: 'Internal server error', error });
    }
};