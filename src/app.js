import express from "express";
import cors from "cors";
import morgan from "morgan";
import v1Routes from "./routes/v1Routes.js";
import { AppError } from "./utils/appError.js";
import { checkAuth } from "./middlewares/checkAuth.js";
import path from "path";
import { fileURLToPath } from "url";

//create express app
const app = express();

//morgan for show endpoits hit status and processing time
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

/**
 * express.urlencoded() parses data with Content-Type: application/x-www-form-urlencoded.
 * express.json() parses data with Content-Type: application/json.
 * Neither can parse Content-Type: multipart/form-data.
 * Use a middleware like multer or formidable for multipart handling.
 */

// Parse request bodies with Content-Type: application/json
app.use(express.json());

// Parse request bodies with Content-Type: application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

/**
 * --------------------------------------------------------------------
 * Getting __dirname in ES Modules:
 * --------------------------------------------------------------------
 * - In CommonJS, Node.js provides __dirname and __filename by default.
 * - In ES Modules (`"type": "module"` in package.json), they are not defined.
 * - We can reconstruct them using `import.meta.url`:
 *    1. `import.meta.url` → gives the current module's file URL.
 *    2. `fileURLToPath()` → converts the file URL to a normal path.
 *    3. `path.dirname()` → extracts the directory name.
 */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * --------------------------------------------------------------------
 * Public folder location (choose one approach):
 * --------------------------------------------------------------------
 * 1. Relative to the current module → `${__dirname}/public`
 *    - Use this if `public` is next to the current file.
 *
 * 2. Relative to the project root → `process.cwd()/public`
 *    - Use this if `public` always lives at the project root,
 *      regardless of which file sets up Express.
 */
const publicPath = path.join(process.cwd(), "public");

/**
 * --------------------------------------------------------------------
 * Serve static assets
 * --------------------------------------------------------------------
 * Express will serve HTML, CSS, JS, images, etc. from the chosen
 * "public" folder. Requests to `/` will automatically map to files inside it.
 */
app.use(express.static(publicPath));

//cors
app.use(cors());

app.post("/", (req, res) => {
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
