import validator from "validator";
import {
  createUser,
  authenticateUser,
  forgotPasswordService,
  updatePassword,
  refreshTokenService,
  verifyEmailService,
} from "../services/authService.js";
import { AppError } from "../utils/appError.js";
import { catchAsync } from "../utils/catchAsync.js";
import { generateToken } from "../utils/tokenUtils.js";

export const register = catchAsync(async (req, res, next) => {
  const { name, email, picture, password } = req.body;

  const { user, otpCode } = await createUser({
    name,
    email,
    picture,
    password,
  });

  res.status(201).json({
    status: "success",
    message:
      "User successfully registered. An OTP has been sent to your email. Please verify within 5 minutes.",
    data: {
      id: user._id,
      email: user.email,
    },
  });
});

/**
 * @desc Verify user email with OTP
 * @route POST /api/v1/auth/verify-email
 * @access Public
 */
export const verifyEmailController = catchAsync(async (req, res, next) => {
  const { email, otpCode } = req.body || {};

  await verifyEmailService({ email, otpCode });

  res.status(200).json({
    status: "success",
    message: "Your email has been successfully verified. You can now log in.",
  });
});

export const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    throw new AppError("Please provide email and password.", 400);
  }

  const user = await authenticateUser(email, password);

  const access = generateToken(
    { id: user._id, type: "access" },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN,
    }
  );

  const refresh = generateToken(
    { id: user._id, type: "refresh" },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_JWT_EXPIRES_IN,
    }
  );

  res.status(200).json({
    status: "success",
    data: {
      tokens: { access, refresh },
    },
  });
});

export const forgotPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body || {};

  const otpCode = await forgotPasswordService(email);

  if (process.env.NODE_ENV !== "production") {
    return res.status(200).json({
      status: "success",
      message: "OTP has been sent to your email (development mode)",
      otpCode, // only expose in dev/test
    });
  }

  res.status(200).json({
    status: "success",
    message: "OTP has been sent to your email",
  });
});

export const resetPassword = catchAsync(async (req, res, next) => {
  await updatePassword(req.body);

  res.status(200).json({
    status: "success",
    message:
      "Your password has been reset successfully. Please log in with your new password.",
  });
});

export const refreshToken = catchAsync(async (req, res, next) => {
  const { refreshToken } = req.body || {};

  const accessToken = await refreshTokenService(refreshToken);

  res.status(200).json({
    status: "success",
    accessToken,
  });
});

export const logout = catchAsync(async (req, res, next) => {
  const { refreshToken } = req.body || {};

  // console.log("refreshToken = ", refreshToken);

  res.status(200).json({
    status: "success",
  });
});
