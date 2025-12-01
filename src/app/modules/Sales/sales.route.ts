import express from 'express';
import { OrderController } from './sales.controller';
const router = express.Router();

router.get('/', OrderController.getAllOrders);

router.post("/", OrderController.createOrder);


export const SalesRoutes = router;