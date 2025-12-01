import config from "../../config";
import AppError from "../../middlewares/AppError";
import { TUser } from "./auth.interface";
import { UserModel } from "./auth.module";
import httpStatus from 'http-status';
import { createToken } from "./auth.utils";

const createUserIntoDB = async (Payload: TUser) => {
    const result = await UserModel.create(Payload)
    return result;
}

const loginUser = async (payload: TUser) => {

    // checking if the user exists - need to select password field explicitly
    const user = await UserModel.findOne({ email: payload.email }).select('+password');

    // console.log("user", { user });

    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, 'This user is not found !');
    }

    //checking if the password is correct
    if (payload?.password !== user?.password) {
        throw new AppError(httpStatus.FORBIDDEN, 'Password does not match!');
    }


    const jwtPayload = {
        userId: user._id.toString(),

    };

    const accessToken = createToken(
        jwtPayload,
        config.jwt_access_secret as string,
        config.jwt_access_expires_in as string,
    );

    return {
        token: accessToken,
        expire: 7200
    };
};

export const UserService = {
    createUserIntoDB,
    loginUser
}