const express = require("express");
const app = express();

app.use(express.json());

app.post("/data", (req, res) => {
    console.log("Received:", req.body);
    res.sendStatus(200);
});

app.listen(3000 , '0.0.0.0',() => {
    console.log("Server running on port 3000");
});