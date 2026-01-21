import { Request, Response } from 'express';
import { UserRole } from '../utils/roleEnum.js';

interface AuthRequest extends Request {
    user?: { username: string; role: string };
}

// Middleware to check admin role
export const requireAdmin = (req: AuthRequest, res: Response, next: Function) => {
    if (req.user?.role !== UserRole.ADMIN) {
        return res.status(403).json({ message: 'Admin access required' });
    }
    next();
};