import mongoose from "mongoose";

async function connectToDatabase() {
    try {
        await mongoose.connect(process.env.MONGO_URI as string || "mongodb://localhost:27017/");
        console.log("Podarilo sa pripojiť k MONGODB");
    } catch (err) {
        console.error("CHYBA: Nepodarilo sa pripojiť k MONGODB!", err);
    }
}

export default connectToDatabase