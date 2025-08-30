import mongoose from "mongoose";
import User from "../models/userModel.js";
import { AppError } from "../utils/appError.js";

export const getUserProfile = async (id) => {
  // Check if id is a valid ObjectId before querying
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid user ID", 400);
  }

  const user = await User.findById(id).select("name email picture");
  if (!user) {
    throw new AppError("User not found with the provided ID", 404);
  }

  return user.toObject();
};
