import { OrderModel } from "./salers.module";
import { TOrder } from "./sales.interface";
import AppError from '../../middlewares/AppError';
import httpStatus from 'http-status';


const createOrderIntoDB = async (Payload: TOrder) => {
    const result = await OrderModel.create(Payload);
    return result;
};

type TGetOrdersOptions = {
    startDate?: string;
    endDate?: string;
    priceMin?: number | string;
    email?: string;
    phone?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc' | string;
};

const escapeRegExp = (str: string) => str.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&');

const getAllOrdersFromDB = async (options?: TGetOrdersOptions) => {
    try {
        const {
            startDate,
            endDate,
            priceMin,
            email,
            phone,
            sortBy = 'date',
            sortOrder = 'dsc',
        } = options || {};

        const match: any = {};

        // date range
        if (startDate || endDate) {
            match.date = {};
            if (startDate) {
                const sd = new Date(startDate);
                if (!isNaN(sd.getTime())) match.date.$gte = sd;
            }
            if (endDate) {
                const ed = new Date(endDate);
                if (!isNaN(ed.getTime())) {
                    // include end of the day for the provided endDate
                    ed.setHours(23, 59, 59, 999);
                    match.date.$lte = ed;
                }
            }
            // if both were invalid, remove date
            if (Object.keys(match.date).length === 0) delete match.date;
        }

        // price filter
        if (priceMin !== undefined && priceMin !== null && priceMin !== '') {
            const p = typeof priceMin === 'string' ? parseFloat(priceMin) : priceMin;
            if (!Number.isNaN(p)) match.price = { $gte: p };
        }

        // email / phone filters (partial, case-insensitive)
        if (email) {
            const safe = escapeRegExp(email);
            match.customerEmail = { $regex: new RegExp(safe, 'i') };
        }
        if (phone) {
            const safe = escapeRegExp(phone);
            match.customerPhone = { $regex: new RegExp(safe, 'i') };
        }

        // Build aggregation pipeline for total sales per day
        const totalSalesPipeline: any[] = [];
        if (Object.keys(match).length) {
            totalSalesPipeline.push({ $match: match });
        }

        totalSalesPipeline.push(
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
                    totalSale: { $sum: '$price' },
                },
            },
            // sort by day (ascending by default)
            { $sort: { _id: sortOrder === 'desc' ? -1 : 1 } },
            // project as required: day + totalSale
            { $project: { _id: 0, day: '$_id', totalSale: 1 } }
        );

        const TotalSales = await OrderModel.aggregate(totalSalesPipeline);

        // Determine sorting for the documents list
        const sortDir = sortOrder === 'desc' ? -1 : 1;
        const sortObj: any = {};
        // default to date field
        sortObj[sortBy || 'date'] = sortDir;
        // ensure deterministic order by _id as tiebreaker
        sortObj._id = 1;

        const salesDocs = await OrderModel.find(match).sort(sortObj).exec();

        const Sales = salesDocs.map((s: any) => ({
            _id: s._id.toString(),
            date: s.date instanceof Date ? s.date.toISOString() : new Date(s.date).toISOString(),
            price: s.price,
            customerEmail: s.customerEmail,
            customerPhone: s.customerPhone,
            __v: s.__v,
        }));

        return {
            results: {
                TotalSales,
                Sales,
            },
        };
    } catch (error: any) {
        throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, `Failed to get sales overview: ${error.message}`);
    }
};

export const OrderService = {
    createOrderIntoDB,
    getAllOrdersFromDB
};

