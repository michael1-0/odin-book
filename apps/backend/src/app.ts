import express from "express";
import type { Express } from "express";
import { setGlobalOptions } from "express-zod-safe";
import indexRouter from "./routes/indexRoutes.ts";
import {
  errorHandler,
  notFound,
  validationErrorHandler,
} from "./middlewares/errorMiddleware.ts";
import cookieParser from "cookie-parser";

const app: Express = express();

setGlobalOptions({ handler: validationErrorHandler });

app.use(express.json());
app.use(cookieParser());
app.use("/api", indexRouter);
app.use(notFound);
app.use(errorHandler);

export default app;
