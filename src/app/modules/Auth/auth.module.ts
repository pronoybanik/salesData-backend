import { model, Schema } from "mongoose";
import { TUser } from "./auth.interface";

const userSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true,
    },
    name: {
        type: String,
        require: true,
    },
    number: {
        type: String,
        require: true,
    },
    password: {
        type: String,
        required: true,
        select: 0,
    },
}, {
    timestamps: true
})


export const UserModel = model<TUser>('User', userSchema);
