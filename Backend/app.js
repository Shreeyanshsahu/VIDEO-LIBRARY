//every express app should have this file which will
//contain all the middlewares and routes

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import userRouter from "./routes/user.route.js";

const app = express();

// Middlewares
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


//should put logger before routes so that it can log all the requests and responses


import logger from "./logger.js";
import morgan from "morgan";
const morganFormat = ":method :url :status :response-time ms";
app.use(
  morgan(morganFormat, {
    stream: {
      write: (message) => {
        const logObject = {
          method: message.split(" ")[0],
          url: message.split(" ")[1],
          status: message.split(" ")[2],
          responseTime: message.split(" ")[3],
        };
        logger.info(JSON.stringify(logObject));
      },
    },
  })
);
// Error handling middleware
import { ApiError } from "./utils/ApiError.js";
app.use((err, req, res, next) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors
    });
  }
  return res.status(500).json({
    success: false,
    message: "Internal Server Error",
    errors: []
  });
});
// Routes
app.use("/api/v1/users", userRouter);





export { app };