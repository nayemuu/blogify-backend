import express from "express";
import cors from "cors";
import morgan from "morgan";
import v1Routes from "./routes/v1Routes.js";

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

app.get("/", (req, res) => {
  res.status(200).json({
    status: "success",
    // data:data//
  });
});

//api v1 routes
app.use("/api/v1", v1Routes);

// Not Found Route Handling Middleware
app.use(async (req, res, next) => {
  res.status(404).json({
    status: "fail",
    message: `Can't find ${req.originalUrl} on the server`,
  });
});

// error handling middleware
function errorHandler(error, req, res, next) {
  // logger.error(error);

  error.statusCode = error.statusCode || 500;
  error.status = error.status || "error";

  res.status(statusCode).json({
    status: error.status,
    message: error.message,
  });
}

app.use(errorHandler);

export default app;
