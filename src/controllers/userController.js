import { getUserProfile } from "../services/userService.js";
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
