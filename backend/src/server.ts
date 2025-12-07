import express from "express";
import connectToDatabase from './config/db.js';
import {loginUser, registerUser} from './controllers/authController.js';

import cors from 'cors';

const app = express();
app.use(cors());

app.use(express.json()); // povolit pre kazdy origin

// app.use(cors({
//     origin: 'http://localhost:5173', // Svelte
//     credentials: true
// }));

try {
    await connectToDatabase();
    let port = 5000;
    app.listen(port , '0.0.0.0',() => {
        console.log("Server running on port " + port);
    });
} catch (error) {
    console.error("Database connection failed:", error);
    process.exit(1);
}

app.post("/api/register", async (req, res) => {
    try {
        //const newUser = await User.create(req.body);
        await registerUser(req, res);
    } catch (error) {
        res.status(400).send({ error: "Error creating user", details: error });
    }
});

app.post("/api/login", async (req, res) => {
    try {
        await loginUser(req, res);
    } catch (error) {
        res.status(400).send({ error: "Error logging in", details: error });
    }
})


