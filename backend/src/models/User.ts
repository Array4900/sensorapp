import mongoose from "mongoose";
import { UserRole } from "../utils/roleEnum.js";

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
        },
        password: {
            type: String,
            required: true
        },
        role: {
            type: String,
            enum: Object.values(UserRole),
            default: UserRole.USER
        }
    },
    { timestamps: true }
);

export default mongoose.model("User", userSchema);


userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();

    const bcrypt = await import("bcrypt");
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

userSchema.methods.comparePassword = async function (candidatePassword: string) {
    const bcrypt = await import("bcrypt");
    return bcrypt.compare(candidatePassword, this.password);
}
