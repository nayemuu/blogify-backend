import User from "../models/userModel.js";
import { AppError } from "../utils/appError.js";
import { catchAsync } from "../utils/catchAsync.js";

/**
 * Middleware to check if a user has the required permission.
 * - Super users bypass the permission check.
 * - Otherwise, verifies if the user's permission list contains the required permission.
 *
 * @param {string} permission - The required permission name
 */

export const checkPermission = (permission) => {
  return catchAsync(async (req, res, next) => {
    // console.log("permission= ", permission);
    // console.log("req.user = ", req.user);

    if (!req?.user?.id) {
      throw new AppError("Please provide ueer id", 400);
    }
    const user = await User.findById(req.user.id);

    // console.log("user = ", user);

    if (!user) {
      throw new AppError("User not found", 404);
    }

    if (user?.isSuper) {
      req.user = { ...req.user, isSuper: true };
      return next();
    }

    // if (user?.userPermissionsList?.includes(permission)) {
    //   return next();
    // }

    throw new AppError("Forbidden", 403);
  });
};
