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
  const user = await User.findById(decoded.id).select("_id status");
  // console.log("user = ", user);

  if (!user) {
    throw new AppError(
      "The user belonging to this token no longer exists",
      401
    );
  }

  // Step 4 - Check User Status

  /**
   * Extra safety check for "pending" users.
   *
   * Normally, users with a "pending" status should never receive an access token
   * because they must verify their email before logging in. However, this check
   * acts as a safeguard in case a pending token is somehow issued (e.g., due to
   * a bug, replay attack, or other edge case).
   *
   * If a pending user attempts to access a protected route, deny access and
   * prompt them to complete the registration/verification process.
   */
  if (user.status === "pending") {
    throw new AppError(
      "Your account is not verified. Please complete the registration process and log in again.",
      403
    );
  }

  if (user.status === "inactive") {
    throw new AppError(
      "Your account is inactive. Please contact support to reactivate it.",
      403
    );
  }

  if (user.status === "deleted") {
    throw new AppError(
      "Your account has been deleted. Please register again to access the service.",
      403
    );
  }

  // Step 5 - Check if password was changed after token issued
  if (user.isPasswordChanged(decoded.iat)) {
    throw new AppError("Password changed recently. Please log in again.", 401);
  }

  // console.log("yoo");
  // Attach user to request object for further middleware
  req.user = { id: user._id };
  next();
});
