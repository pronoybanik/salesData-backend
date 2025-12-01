import express, { type Application, type Request, type Response } from "express"
import cors from 'cors';
import router from "./app/routes";
const app: Application = express();


app.use(express.json());
app.use(cors());

//application route
app.use("/api/v1", router);

app.get("/", (req: Request, res: Response) => {
    res.send({
        message: "sales Management  server 3001"
    })
});


export default app;