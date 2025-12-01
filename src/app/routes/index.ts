import { Router } from "express";
import { SalesRoutes } from "../modules/Sales/sales.route";
import { AuthRoutes } from "../modules/Auth/auth.route";

const router = Router();

const moduleRouters = [
    {
        path: "/auth",
        router: AuthRoutes

    },
    {
        path: "/sales",
        router: SalesRoutes
    }
];

moduleRouters.forEach((route) => router.use(route.path, route.router))

export default router;