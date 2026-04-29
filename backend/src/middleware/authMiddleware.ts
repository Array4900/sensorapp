import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { isTokenBlacklisted } from '../utils/tokenBlacklist.js';
import { getRequiredEnv } from '../utils/env.js';

export interface AuthRequest extends Request {
    user?: { username: string; role: string };
}

// Middleware na autentifikaciu JWT tokenu
// Pouziva sa na chranenie endpointov, ktore vyzaduju prihlaseneho uzivatela
// Pokial by token nebol validny (user by si zmenil rolu na ADMIN v tokene atd.), pristup bude zamietnuty
export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const token = req.headers['authorization']?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Token required' });
    }

    // Pozri ci sa nahodou uz token nenachadza na blacklistu (user bol logoutnuty)
    if (await isTokenBlacklisted(token)) {
        return res.status(401).json({ message: 'Token has been revoked' });
    }

    try {
        const secret = getRequiredEnv('JWT_SECRET');
        const decoded = jwt.verify(token, secret) as { username: string; role: string };
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ message: 'Invalid token' });
    }
};