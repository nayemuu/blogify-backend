import express from "express";
import cors from "cors";
import morgan from "morgan";

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

// Not Found Route Handling Middleware
app.use(async (req, res, next) => {
  res.status(404).json({
    message: "Route Not Found",
  });
});

// error handling middleware
function errorHandler(err, req, res, next) {
  // logger.error(err);
  res.status(err.status || 500);
  res.send({ message: err.message });
}

app.use(errorHandler);

export default app;
