import mongoose, { Collection } from "mongoose";
import { UserRole } from "../utils/roleEnum.js";
import bcrypt from "bcrypt";

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
    { timestamps: true, collection: 'users' }
);


userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 10);
    next();
});

userSchema.methods.comparePassword = async function (candidatePassword: string, hashedPassword: string): Promise<boolean> {
    if (!candidatePassword) throw new Error("candidate password missing");
    if (!hashedPassword) throw new Error("stored password hash missing");
    return bcrypt.compare(candidatePassword, hashedPassword);
};


export default mongoose.model("User", userSchema);