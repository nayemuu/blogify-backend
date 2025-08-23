import User from "../models/userModel.js";
import { AppError } from "../utils/appError.js";
import { catchAsync } from "../utils/catchAsync.js";
import jwt from "jsonwebtoken";

/**
 * @middleware checkAuth
 * @description Middleware to protect routes by verifying the JWT token.
 *
 */

export const checkAuth = catchAsync(async (req, res, next) => {
  //   Step 1 - Checks for Authorization header with Bearer token.

  // console.log("authorization = ", req.headers);

  if (!req.headers["authorization"]) {
    throw new AppError("Unauthorized - No token provided", 401);
  }

  const bearerToken = req.headers["authorization"];
  const token = bearerToken.split(" ")[1];
  if (!token) {
    throw new AppError("Unauthorized - Token missing", 401);
  }

  // console.log("token = ", token);

  //  Step 2 - Verify Token and handle malformed/invalid tokens
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  } catch (err) {
    // This includes malformed, expired, or otherwise invalid tokens
    throw new AppError("Unauthorized - Invalid or expired token", 401);
  }

  // Step 3 - Check if user still exists
  const user = await User.findById(decoded.id);
  if (!user) {
    throw new AppError(
      "The user belonging to this token no longer exists",
      401
    );
  }

  // Step 4 - Check User Status (e.g. isActive, isBanned)

  //   if (!user.isActive) {
  //   throw new AppError("Unauthorized - User account is inactive", 403);
  // }

  // Step 5 - Check if password was changed after token issued
  if (user.isPasswordChanged(decoded.iat)) {
    throw new AppError("Password changed recently. Please log in again.", 401);
  }

  // console.log("yoo");
  // Attach user to request object for further middleware
  // req.user = user;
  next();
});
