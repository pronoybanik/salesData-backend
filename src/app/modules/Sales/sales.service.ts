import { OrderModel } from "./salers.module";
import { TOrder } from "./sales.interface";
import AppError from '../../middlewares/AppError';
import httpStatus from 'http-status';
import { Types } from 'mongoose';


const createOrderIntoDB = async (Payload: TOrder) => {
    const result = await OrderModel.create(Payload);
    return result;
};

const createBulkOrdersIntoDB = async (Payloads: TOrder[]) => {
    if (!Array.isArray(Payloads) || Payloads.length === 0) {
        throw new AppError(httpStatus.BAD_REQUEST, 'Payload must be a non-empty array of orders');
    }
    const result = await OrderModel.insertMany(Payloads);
    return result;
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
            // sort by day ascending
            { $sort: { _id: 1 } },
            // project as required: day + totalSale
            { $project: { _id: 0, day: '$_id', totalSale: 1 } }
        );

        const TotalSales = await OrderModel.aggregate(totalSalesPipeline);

       
        const limit = 50;
        const sortDir = 1; 
        const { before, after } = options || {};
        const isBackward = !!before && !after;

        
        const paginationMatch = { ...match };

        const buildCursorFilter = (token: string, isAfter: boolean) => {
            try {
                const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf8')) as { v: any; id: string };
                let val = new Date(decoded.v); // Always date sorting

                const opPrimary = (isAfter ? (sortDir === 1 ? '$gt' : '$lt') : (sortDir === 1 ? '$lt' : '$gt'));
                const opId = opPrimary;

                return {
                    $or: [
                        { date: { [opPrimary]: val } },
                        { date: val, _id: { [opId]: new Types.ObjectId(decoded.id) } },
                    ],
                };
            } catch (e) {
                return null;
            }
        };

        if (after) {
            const cursorFilter = buildCursorFilter(after, true);
            if (cursorFilter) {
                paginationMatch.$and = paginationMatch.$and ? [...paginationMatch.$and, cursorFilter] : [cursorFilter];
            }
        } else if (before) {
            const cursorFilter = buildCursorFilter(before, false);
            if (cursorFilter) {
                paginationMatch.$and = paginationMatch.$and ? [...paginationMatch.$and, cursorFilter] : [cursorFilter];
            }
        }

        
        const querySortDir = isBackward ? -1 : 1;
        const querySort: any = {
            date: querySortDir,
            _id: querySortDir
        };

       
        const docs = await OrderModel.find(paginationMatch).sort(querySort).limit(limit + 1).exec();

        const hasMore = docs.length > limit;
        let pageDocs = hasMore ? docs.slice(0, limit) : docs;
       

        const Sales = pageDocs.map((s: any) => ({
            _id: s._id.toString(),
            date: s.date instanceof Date ? s.date.toISOString() : new Date(s.date).toISOString(),
            price: s.price,
            customerEmail: s.customerEmail,
            customerPhone: s.customerPhone,
            __v: s.__v,
        }));

    
        let beforeToken = null;
        let afterToken = null;

        if (pageDocs.length > 0) {
            const encodeToken = (item: any) => {
                const val = item.date instanceof Date ? item.date.toISOString() : new Date(item.date).toISOString();
                return Buffer.from(JSON.stringify({ v: val, id: item._id.toString() })).toString('base64');
            };

            const firstDoc = pageDocs[0];
            const lastDoc = pageDocs[pageDocs.length - 1];
            beforeToken = encodeToken(firstDoc);
            afterToken = encodeToken(lastDoc);
        }

        return {
            results: {
                TotalSales,
                Sales,
            },
            pagination: {
                before: beforeToken,
                after: afterToken,
                hasMore,
            },
        };
    } catch (error: any) {
        throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, `Failed to get sales overview: ${error.message}`);
    }
};

export const OrderService = {
    createOrderIntoDB,
    createBulkOrdersIntoDB,
    getAllOrdersFromDB
};

