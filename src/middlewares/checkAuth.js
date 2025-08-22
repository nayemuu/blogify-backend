import User from "../models/userModel.js";
import { AppError } from "../utils/appError.js";
import { catchAsync } from "../utils/catchAsync.js";
import jwt from "jsonwebtoken";

export const generateToken = (payload, expiresIn, secret) => {
  return jwt.sign(payload, expiresIn, secret);
};

export const checkAuth = catchAsync(async (req, res, next) => {
  //   Step 1 - Check User has token or not
  if (!req.headers["authorization"]) {
    throw new AppError("Unauthorized", 401);
  }
  console.log("authorization = ", req.headers["authorization"]);

  const bearerToken = req.headers["authorization"];
  const token = bearerToken.split(" ")[1];
  if (!token) {
    throw new AppError("Unauthorized", 401);
  }
  //   Step 2 - Verify Token
  // check token is valid JWT Token or not
  const decodedData = await jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  console.log("decodedData = ", decodedData);

  //   Step 3 - Check if User Still exist
  const targetedUser = await User.findById(decodedData.id);

  if (!targetedUser) {
    throw new AppError(
      "The user belonging to this token does no longer exist",
      401
    );
  }

  //   Step 4 - If use changed password after generated this token
  if (targetedUser.isPasswordChanged(decodedData.iat)) {
    throw new AppError(
      "User recentlly changed password! Please log in again",
      401
    );
  }

  next();
});
