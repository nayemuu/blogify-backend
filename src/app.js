import express from "express";
import cors from "cors";
import morgan from "morgan";
import v1Routes from "./routes/v1Routes.js";
import { AppError } from "./utils/appError.js";
import { checkAuth } from "./middlewares/checkAuth.js";

//create express app
const app = express();

//morgan for show endpoits hit status and processing time
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

//parse json request body
app.use(express.json());

//parse form data
app.use(express.urlencoded({ extended: true }));

//cors
app.use(cors());

app.post("/", checkAuth, (req, res) => {
  res.status(200).json({
    status: "success",
    // data:data//
  });
});

//api v1 routes
app.use("/api/v1", v1Routes);

// Not Found Route Handling Middleware
app.use(async (req, res, next) => {
  // approach 1 //bad approach
  // res.status(404).json({
  //   status: "fail",
  //   message: `Can't find ${req.originalUrl} url on the server`,
  // });

  // approach 2
  // const err = new Error(`Can't find ${req.originalUrl} url on the server`);
  // err.status = "fail";
  // err.statusCode = 404;
  // next(err);
  // because of setting status and statusCode, we did not throw new Error directly

  // approach 3 // better and reuseable version from approach 2
  throw new AppError(`Can't find ${req.originalUrl} url on the server`, 404);
});

// error handling middleware
function errorHandler(error, req, res, next) {
  console.log("error = ", error);

  error.statusCode = error.statusCode || 500;
  error.status = error.status || "error";

  res.status(error.statusCode).json({
    status: error.status,
    message: error.message,
  });
}

app.use(errorHandler);

export default app;
