import {
  getUserProfile,
  getUserBlogs,
  toggleLikeBlogService,
  toggleBookmarkService,
  getBookmarkedBlogsService,
} from "../services/userService.js";
import { AppError } from "../utils/appError.js";
import { catchAsync } from "../utils/catchAsync.js";

export const profileController = catchAsync(async (req, res, next) => {
  const user = await getUserProfile(req.user.id);
  const { _id, ...userProfileData } = user;
  //   console.log("userProfileData  = ", userProfileData);

  res.status(200).json({
    status: "success",
    data: { user: user },
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

export const toggleLikeBlogController = catchAsync(async (req, res, next) => {
  const userId = req?.user?.id;
  if (!userId) {
    throw new AppError("You must be logged in first", 401);
  }

  const blogId = req.params.id;
  const updatedBlog = await toggleLikeBlogService(blogId, userId);

  res.status(200).json({
    status: "success",
    data: updatedBlog,
  });
});

/**
 * Controller for toggling a blog bookmark
 * POST /api/bookmarks/toggle/:blogId
 */
export const toggleBookmarkController = catchAsync(async (req, res, next) => {
  const userId = req?.user?.id;
  if (!userId) {
    throw new AppError("You must be logged in first", 401);
  }

  const blogId = req.params.id;

  const result = await toggleBookmarkService(userId, blogId);

  res.status(200).json({
    status: "success",
    message: result.isBookmarked
      ? "Blog added to your bookmark list"
      : "Blog removed from your bookmark list",
    data: result, // { blogId, isBookmarked }
  });
});

/**
 * Get bookmarked blogs for logged-in user
 */
export const getBookmarkedBlogs = catchAsync(async (req, res, next) => {
  const limit = parseInt(req.query.limit) || 10;
  const offset = parseInt(req.query.offset) || 0;

  // ✅ Require login
  const userId = req?.user?.id;
  if (!userId) {
    throw new AppError("You must be logged in first to view bookmarks", 401);
  }

  const { count, blogs } = await getBookmarkedBlogsService(
    userId,
    limit,
    offset
  );

  res.status(200).json({
    status: "success",
    count, // total bookmarked blogs
    limit,
    offset,
    results: blogs.length,
    blogs,
  });
});
