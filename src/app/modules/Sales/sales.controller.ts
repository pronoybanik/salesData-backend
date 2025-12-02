import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponst";
import httpStatus from 'http-status';
import { OrderService } from "./sales.service";

const createOrder = catchAsync(async (req, res, next) => {
    const result = await OrderService.createOrderIntoDB(req.body);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'User Order successfully',
        data: result,
    });
});

const createBulkOrders = catchAsync(async (req, res, next) => {
    const result = await OrderService.createBulkOrdersIntoDB(req.body);

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: `${result.length} orders created successfully`,
        data: result,
    });
});

const getAllOrders = catchAsync(async (req, res, next) => {
    const {
        startDate,
        endDate,
        priceMin,
        email,
        phone,
        sortBy,
        sortOrder,
        before,
        after,
    } = req.query || {};

    // pass query params through to the service; service will validate/ignore invalid values
    const options = {
        startDate: startDate as string | undefined,
        endDate: endDate as string | undefined,
        priceMin: priceMin as string | undefined,
        email: email as string | undefined,
        phone: phone as string | undefined,
        sortBy: sortBy as string | undefined,
        sortOrder: sortOrder as string | undefined,
        before: before as string | undefined,
        after: after as string | undefined,
    };

    const result = await OrderService.getAllOrdersFromDB(options as any);

    res.status(200).json(result);
});

export const OrderController = {
    createOrder,
    createBulkOrders,
    getAllOrders 
}
