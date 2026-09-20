import type {
  ErrorRequestHandler,
  Request,
  Response,
  NextFunction,
} from "express";
import type { ErrorRequestHandler as ValidationErrorHandler } from "express-zod-safe";

import { Prisma } from "../db/generated/prisma/client.ts";
import { AppError } from "../errors/AppError.ts";

function notFound(req: Request, res: Response, next: NextFunction) {
  next(new AppError(`Route ${req.originalUrl} not found`, 404));
}

const errorHandler: ErrorRequestHandler = (error, req, res, next) => {
  void next;

  let statusCode = 500;
  let message = "Internal server error";

  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
  } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case "P2025":
        statusCode = 404;
        message = "Resource not found";
        break;
      case "P2003":
        statusCode = 404;
        message = "Referenced record not found";
        break;
      case "P2002":
        statusCode = 409;
        message = "Record already exists";
        break;
    }
  }

  if (statusCode >= 500) {
    console.error("[errorHandler]", {
      method: req.method,
      path: req.originalUrl,
      error,
    });
  }

  res.status(statusCode).json({
    error: {
      code: statusCode,
      message,
    },
  });
};

const validationErrorHandler: ValidationErrorHandler = (errors, _req, res) => {
  const message = errors
    .map(({ type, errors: { issues } }) =>
      issues.map((issue) => `${type}: ${issue.message}`).join(", "),
    )
    .join(", ");

  res.status(400).json({
    error: {
      code: 400,
      message: `${message.charAt(0).toUpperCase()}${message.slice(1)}`,
    },
  });
};

export { notFound, errorHandler, validationErrorHandler };
