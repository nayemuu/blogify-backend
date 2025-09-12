import validator from "validator";
import User from "../models/userModel.js";
import { generateOtp } from "../utils/otpUtils.js";
import { OTP } from "../models/otpModel.js";
import { AppError } from "../utils/appError.js";

export const sentOTP = async (data) => {
  const { id, email, otpType, expiresIn } = data || {};

  // 1. Validate OTP type
  const allowedOtpTypes = ["email_verification", "password_reset", "login"];
  if (!otpType || !allowedOtpTypes.includes(otpType)) {
    throw new AppError("Invalid OTP type", 400);
  }

  // 2. Validate expiresIn
  let expiresTime = 5 * 60 * 1000; // default to 5 minutes
  if (expiresIn !== undefined) {
    if (
      typeof expiresIn !== "number" ||
      isNaN(expiresIn) ||
      expiresIn < 60 * 1000 ||
      expiresIn > 60 * 60 * 1000
    ) {
      throw new AppError(
        "Invalid expiresIn value. Must be 1–60 minutes (ms).",
        400
      );
    }
    expiresTime = expiresIn;
  }

  // 3. Get user ID
  let userId;
  if (id) {
    userId = id;
  } else {
    if (!email || !validator.isEmail(email)) {
      throw new AppError("Valid email is required", 400);
    }

    const user = await User.findOne({ email }).select("_id");
    if (!user) {
      throw new AppError("No account found with this email address", 404);
    }

    userId = user._id;
  }

  // 4. Rate limiting (prevent OTP flood)
  const recentOtp = await OTP.findOne({ user: userId });
  if (recentOtp && recentOtp.issuedAt > new Date(Date.now() - 30 * 1000)) {
    throw new AppError(
      "OTP was recently sent. Please wait before trying again.",
      429
    );
  }

  // 5. Generate OTP
  const otpCode = generateOtp(); // e.g., 6-digit number

  // 6. Upsert OTP: One document per user
  await OTP.findOneAndUpdate(
    { user: userId },
    {
      otpCode,
      otpType,
      issuedAt: new Date(),
      expiresAt: new Date(Date.now() + expiresTime),
    },
    {
      upsert: true, // ✅ Create document if one doesn't exist
      new: true, // ✅ Return the updated/new document
      setDefaultsOnInsert: true, // ✅ Apply schema defaults on insert
    }
  );

  return otpCode;
};
