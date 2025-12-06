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
