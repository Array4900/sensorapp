import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface AuthRequest extends Request {
    user?: { username: string; role: string };
}

// Middleware na autentifikaciu JWT tokenu
// Pouziva sa na chranenie endpointov, ktore vyzaduju prihlaseneho uzivatela
// Pokial by token nebol validny (user by si zmenil rolu na ADMIN v tokene atd.), pristup bude zamietnuty
export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
    const token = req.headers['authorization']?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Token required' });
    }

    try {
        const secret = process.env.JWT_SECRET as string; // TREBA MAT NASTAVENE V ENV
        // const secret = supersecret123; // pre local testing
        const decoded = jwt.verify(token, secret) as { username: string; role: string };
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ message: 'Invalid token' });
    }
};