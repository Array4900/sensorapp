import mongoose from "mongoose";

async function connectToDatabase() {
    try {
        await mongoose.connect(process.env.MONGO_URI as string);
        //await mongoose.connect("mongodb://localhost:27017/sensorapp")
        console.log("Podarilo sa pripojiť k MONGODB - sensorapp.");
    } catch (err) {
        console.error("CHYBA: Nepodarilo sa pripojiť k MONGODB!", err);
    }
}

export default connectToDatabase