import { Request, Response } from "express";
import jwt from 'jsonwebtoken';

import User from "../models/User.js";
import { UserRole } from "../utils/roleEnum.js";

interface AuthRequest extends Request {
    user?: { username: string; role: string };
}

export const registerUser = async (req: Request, res: Response) => {
    try {
        const { username, password } = req.body;

        // Ak by náhodou zlyhalo overenie na frontende (používateľ je špekulant)
        if ( !username || !password) {
            return res.status(400).json({
                message: "Musíš vyplniť všetky povinné polia (Používateľské meno, heslo)."
            });
        }

        // Pozri, či užívateľské meno nie je obsadené
        const usernameExists = await User.findOne({ username });
        if (usernameExists) {
            return res.status(409).json({
                message: "Používateľské meno je už zabrané."
            });
        }

        // Vytvor objekt nového užívateľa
        const newUser = new User({
            username,
            password,           // heslo sa zahashuje v User modeli pomocou hooku 'pre save'
            role: UserRole.USER // defaultná rola je USER
        });

        // ulož užívateľa do MONGODB
        await newUser.save();

        return res.status(201).json({
            message: "User created successfully.",
            user: {
                username: newUser.username,
                role: newUser.role
            }
        });

    } catch (err) {
        console.error("Registrácia zlyhala.", err);
        return res.status(500).json({
            message: "Internal server error."
        });
    }
};

export const loginUser = async (req: Request, res: Response) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                message: "Musíš vyplniť všetky povinné polia (Používateľské meno, heslo)."
            });
        }

        // nájdi užívateľa v DB podľa username
        // TU JE READ
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({
                message: "Neplatné prihlasovacie údaje."
            });
        }

        // over heslo
        const isPasswordValid = await User.schema.methods.comparePassword(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                message: "Neplatné prihlasovacie údaje."
            });
        }

        // Vygeneruj JWT token
        const secret = process.env.JWT_SECRET || 'supersecret123';
        const token = jwt.sign(
            { username: user.username, role: user.role },
            secret,
            { expiresIn: '24h' }
        );

        // úspešné prihlásenie
        return res.status(200).json({
            message: "Login successful.",
            token: token,
            user: {
                username: user.username,
                role: user.role
            }
        });

    } catch (err) {
        console.error("Prihlásenie zlyhalo.", err);
        return res.status(500).json({
            message: "Internal server error."
        });
    }
};

export const changePassword = async (req: AuthRequest, res: Response) => {
    try {
        const { username } = req.user || {};
        console.log("Changing password for user:", username);
        const { oldPassword, newPassword } = req.body;
        // nájdi užívateľa v DB podľa username
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }
        // over staré heslo
        const isOldPasswordValid = await User.schema.methods.comparePassword(oldPassword, user.password);
        if (!isOldPasswordValid) {
            return res.status(401).json({ message: "Old password is incorrect." });
        }
        // nastav nové heslo a ulož
        user.password = newPassword; // heslo sa zahashuje v User modeli pomocou hooku 'pre save'
        await user.save();
        return res.status(200).json({ message: "Password changed successfully." });
    } catch (err) {
        console.error("Changing password failed.", err);
        return res.status(500).json({ message: "Internal server error." });
    }
};

/**
 * Verify token - validates the JWT token is still valid
 * Used by frontend to check if stored token is still good on page refresh
 */
export const verifyToken = async (req: AuthRequest, res: Response) => {
    try {
        // If we get here, the token was already validated by authenticateToken middleware
        const { username, role } = req.user || {};
        
        if (!username) {
            return res.status(401).json({ message: "Invalid token" });
        }

        // Optionally verify user still exists in database
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ message: "User no longer exists" });
        }

        return res.status(200).json({ 
            valid: true,
            user: {
                username: user.username,
                role: user.role
            }
        });
    } catch (err) {
        console.error("Token verification failed.", err);
        return res.status(500).json({ message: "Internal server error." });
    }
};