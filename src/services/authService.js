import validator from "validator";
import bcrypt from "bcrypt";
import { AppError } from "../utils/appError.js";
import User from "../models/userModel.js";
import { generateOtp } from "../utils/otpUtils.js";
import { OTP } from "../models/otpModel.js";
import { generateToken } from "../utils/tokenUtils.js";
import jwt from "jsonwebtoken";

export const createUser = async (userData) => {
  const { name, email, picture, password } = userData;

  //check if fields are empty
  if (!name || !email || !password) {
    throw new AppError("Please fill all fields.", 400);
  }

  //check name length
  if (
    !validator.isLength(name, {
      min: 2,
      max: 30,
    })
  ) {
    throw new AppError(
      "Plase make sure your name is between 2 and 30 characters.",
      400
    );
  }

  //check if email address is valid
  if (!validator.isEmail(email)) {
    throw new AppError(
      "Please make sure to provide a valid email address.",
      400
    );
  }

  //check if user already exist
  const isUserExists = await User.findOne({ email });
  if (isUserExists) {
    throw new AppError(
      "Please try again with a different email address, this email already exist.",
      409
    );
  }

  //check password length
  if (
    !validator.isLength(password, {
      min: 6,
      max: 20,
    })
  ) {
    throw new AppError(
      "Please make sure your password is between 6 and 20 characters.",
      400
    );
  }

  const newUser = await User.create({
    name,
    email,
    password,
  });

  // console.log("newUser = ", newUser);

  // Convert the Mongoose document into a plain JavaScript object
  const sanitizedUser = newUser.toObject();

  /**
   * @function toObject
   * @description Converts a Mongoose document into a plain JavaScript object.
   *
   * @why
   * Mongoose documents (e.g., `newUser`) are not plain objects — they are instances of
   * Mongoose's internal `Document` class and include:
   * - Built-in instance methods (`save()`, `populate()`, etc.)
   * - Virtual properties and getters/setters
   * - Internal metadata and symbols (e.g., `$__`, `_doc`)
   *
   * @benefits
   * Calling `.toObject()`:
   * - ✅ Converts the document to a plain JavaScript object
   * - ✅ Removes Mongoose-specific internals
   * - ✅ Allows safe manipulation (e.g., deleting sensitive fields like `password`)
   * - ✅ Prepares data for serialization or sending in API responses
   *
   * @usecase
   * Use `.toObject()` when you need to:
   * - Sanitize a user object before returning it to the frontend
   * - Clone a document without including internal methods or metadata
   * - Work with libraries expecting plain objects (e.g., `lodash`, `JSON.stringify`)
   *
   * @example
   * const userDoc = await User.findById(id);
   * const userObj = userDoc.toObject();
   * delete userObj.password;
   * return res.json(userObj);
   */

  delete sanitizedUser.password;
  delete sanitizedUser.isSuperUser;
  delete sanitizedUser.__v;

  // return replaceMongoIdInObject(sanitizedUser);
  return sanitizedUser;
};

export const authenticateUser = async (email, password) => {
  const user = await User.findOne({ email }).select("+password name email");

  if (!user) {
    throw new AppError("Invalid credentials.", 400);
  }

  const passwordMatches = await user.isPasswordValid(password, user.password);
  if (!passwordMatches) {
    throw new AppError("Invalid credentials.", 400);
  }

  // Convert Mongoose document to plain object
  const sanitizedUser = user.toObject(); // or user.toJSON()

  // Remove sensitive data
  delete sanitizedUser.password;

  return sanitizedUser;
};

export const forgotPasswordService = async (email) => {
  if (!email) {
    throw new AppError("Email address is required", 400);
  }

  if (!validator.isEmail(email)) {
    throw new AppError("Invalid email", 400);
  }

  const user = await User.findOne({ email }).select("_id");
  if (!user) {
    throw new AppError("No account found with this email address", 404);
  }

  const otpCode = generateOtp();

  // check if OTP already exists for this user
  const existingOtp = await OTP.findOne({ user: user._id });

  if (existingOtp) {
    // update existing OTP
    existingOtp.otpCode = otpCode;
    existingOtp.otpType = "password-reset";
    existingOtp.issuedAt = new Date(); // refresh issued time
    existingOtp.expiresAt = new Date(Date.now() + 5 * 60 * 1000); // extend by 5 min
    await existingOtp.save();
  } else {
    // create new OTP
    await OTP.create({
      user: user._id,
      otpCode,
      otpType: "password-reset",
      issuedAt: new Date(),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });
  }

  return otpCode;
};

export const updateUser = async (payload) => {
  const { email, name, password, picture, status } = payload;

  // 1. Email is required for lookup
  if (!email) {
    throw new AppError("Email is required to update user.", 400);
  }

  // 2. Find existing user by email
  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    throw new AppError("User not found with this email.", 404);
  }

  // 3. Validate and update name
  if (name) {
    if (!validator.isLength(name, { min: 2, max: 30 })) {
      throw new AppError(
        "Please make sure your name is between 2 and 30 characters.",
        400
      );
    }
    user.name = name;
  }

  // 4. Picture update
  if (picture !== undefined) {
    user.picture = picture || null;
  }

  // 5. Status update
  if (status) {
    const allowedStatus = ["active", "inactive", "suspended", "deleted"];
    if (!allowedStatus.includes(status)) {
      throw new AppError("Invalid status provided.", 400);
    }
    user.status = status;
  }

  // 6. Handle password change
  if (password) {
    if (!validator.isLength(password, { min: 6, max: 20 })) {
      throw new AppError(
        "Please make sure your password is between 6 and 20 characters.",
        400
      );
    }

    const isSamePassword = await bcrypt.compare(password, user.password);
    if (!isSamePassword) {
      user.password = password;
      user.passwordChangedAt = new Date();
    }
  }

  // 7. Save updated user
  await user.save();

  // 8. Sanitize output
  const updatedUser = user.toObject();
  delete updatedUser.password;
  delete updatedUser.isSuperUser;
  delete updatedUser.__v;

  return updatedUser;
};

export const updatePassword = async (payload) => {
  const { email, newPassword, otpCode } = payload || {};
  // 1. Ensure required inputs
  if (!email || !newPassword || !otpCode) {
    throw new AppError("Email, new password, and OTP are required.", 400);
  }

  // 2. Validate password length
  if (!validator.isLength(newPassword, { min: 6, max: 20 })) {
    throw new AppError(
      "Please make sure your password is between 6 and 20 characters.",
      400
    );
  }

  // 3. Find user by email
  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    throw new AppError("User not found with this email.", 404);
  }

  // 4. Verify OTP document
  const existingOtp = await OTP.findOne({ user: user._id }).sort({
    createdAt: -1,
  });
  if (!existingOtp) {
    throw new AppError("Invalid or expired OTP.", 400);
  }

  // ✅ Ensure OTP type matches
  if (existingOtp.otpType !== "password-reset") {
    throw new AppError("OTP type mismatch.", 400);
  }

  // ✅ Ensure OTP code matches
  if (existingOtp.otpCode !== Number(otpCode)) {
    throw new AppError("Invalid OTP code.", 400);
  }

  // ✅ Ensure OTP not expired
  if (existingOtp.expiresAt < new Date()) {
    throw new AppError("OTP has expired.", 400);
  }

  // 5. Ensure new password is not the same as the old one
  const isSamePassword = await bcrypt.compare(newPassword, user.password);
  if (isSamePassword) {
    throw new AppError(
      "New password cannot be the same as the old password.",
      400
    );
  }

  // 6. Update password and passwordChangedAt
  user.password = newPassword; // Will be hashed by pre-save hook
  user.passwordChangedAt = new Date();

  // 7. Save user
  await user.save();
};

/**
 * Service to verify a refresh token and return a new access token
 *
 * @param {string} refreshToken - The refresh token provided by the client
 * @returns {string} - Newly generated access token
 */
export const refreshTokenService = async (refreshToken) => {
  if (!refreshToken) {
    throw new AppError("Please provide a refresh token.", 400);
  }

  let decoded;
  try {
    // Verify refresh token
    decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
  } catch (err) {
    throw new AppError("Unauthorized - Invalid or expired refresh token", 401);
  }

  // Step 1 - Find user from decoded token
  const user = await User.findById(decoded.id).select("email");
  if (!user) {
    throw new AppError(
      "The user belonging to this token no longer exists",
      401
    );
  }

  // Step 2 - Check if user is active (optional, based on your schema)
  // if (user.status !== "active") {
  //   throw new AppError("Unauthorized - User account is not active", 403);
  // }

  // Step 3 - Check if password was changed after refresh token issued
  if (user.isPasswordChanged(decoded.iat)) {
    throw new AppError("Password changed recently. Please log in again.", 401);
  }

  // Step 4 - Generate new access token
  const accessToken = generateToken(
    { id: user._id, email: user.email, type: "access" },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN,
    }
  );

  return accessToken;
};
