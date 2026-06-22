import express from "express";
import type { Express } from "express";
import indexRouter from "./routes/indexRouter.ts";
import { errorHandler, notFound } from "./middlewares/errorMiddleware.ts";

const app: Express = express();

app.use(express.json());
app.use("/api", indexRouter);
app.use(notFound);
app.use(errorHandler);

export default app;
