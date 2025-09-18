import { getUserProfile, getUserBlogs } from "../services/userService.js";
import { catchAsync } from "../utils/catchAsync.js";

export const profileController = catchAsync(async (req, res, next) => {
  const user = await getUserProfile(req.user.id);
  const { _id, ...userProfileData } = user;
  //   console.log("userProfileData  = ", userProfileData);

  res.status(200).json({
    status: "success",
    data: { user: userProfileData },
  });
});

export const getMyBlogs = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const { status, limit = 10, offset = 0 } = req.query || {};

  const result = await getUserBlogs(userId, {
    status,
    limit: parseInt(limit, 10),
    offset: parseInt(offset, 10),
  });

  res.status(200).json({
    status: "success",
    ...result,
  });
});
