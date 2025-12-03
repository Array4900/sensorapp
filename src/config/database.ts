import mongoose from "mongoose";

export async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGO_URI as string);
        console.log("Podarilo sa pripojiť k MONGODB");
    } catch (err) {
        console.error("CHYBA: Nepodarilo sa pripojiť k MONGODB!", err);
    }
}