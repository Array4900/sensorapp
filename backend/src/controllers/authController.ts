import { Request, Response } from "express";

import User from "../models/User.js";
import { UserRole } from "../utils/roleEnum.js";

export const registerUser = async (req: Request, res: Response) => {
    try {
        const { username, password, role } = req.body;

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
            role: role || UserRole.USER // defaultná rola je USER
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

        // úspešné prihlásenie
        return res.status(200).json({
            message: "Login successful.",
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
