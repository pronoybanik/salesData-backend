import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponst";
import httpStatus from 'http-status';
import { UserService } from "./auth.service";


const createUser = catchAsync(async (req, res, next) => {
    const result = await UserService.createUserIntoDB(req.body);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'User create successfully',
        data: result,
    });
});

const loginUser = catchAsync(async (req, res, next) => {
    const result = await UserService.loginUser(req.body);
    res.status(200).json(result);
});

export const UserController = {
    createUser,
    loginUser
};
