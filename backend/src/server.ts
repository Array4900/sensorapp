import express from "express";
import connectToDatabase from './config/db.js';
import {registerUser} from './controllers/authController.js';

const app = express();

app.use(express.json());

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

app.post("/api/user", async (req, res) => {
    try {
        //const newUser = await User.create(req.body);
        await registerUser(req, res);
        res.status(200).json(res);
    } catch (error) {
        res.status(400).send({ error: "Error creating user", details: error });
    }
});


