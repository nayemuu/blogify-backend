import mongoose from "mongoose";
import User from "../models/userModel.js";
import { AppError } from "../utils/appError.js";
import { Blog } from "../models/blogModel.js";
import { sanitizeArray, sanitizeObject } from "../utils/mongoDB-utils.js";
import { Bookmark } from "../models/bookmarkModel.js";

export const getUserProfile = async (id) => {
  // Check if id is a valid ObjectId before querying
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid user ID", 400);
  }

  const user = await User.findById(id).select("name email picture");
  if (!user) {
    throw new AppError("User not found with the provided ID", 404);
  }

  return sanitizeObject(user.toObject());
};

/**
 * Get user blogs with optional status + pagination
 * @param {string} id - Current user's ID (also the author ID)
 * @param {Object} options - Query options
 * @param {string} [options.status] - Blog status filter
 * @param {number} [options.limit=10] - Number of blogs to fetch
 * @param {number} [options.offset=0] - Number of blogs to skip
 * @returns {Promise<{count: number, limit: number, offset: number, blogs: Array}>}
 */

export const getUserBlogs = async (id, { status, limit = 10, offset = 0 }) => {
  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid user ID", 400);
  }

  // Build filter (only fetch blogs authored by this user)
  const filter = { author: id };
  if (status) filter.status = status;

  // Count first
  const count = await Blog.countDocuments(filter);

  // Query blogs
  let blogs = await Blog.find(filter)
    .skip(offset)
    .limit(limit)
    .populate("author", "name email picture")
    .populate("tags", "title")
    .sort({ createdAt: -1 });

  // Sanitize blogs and add isLiked
  blogs = sanitizeArray(blogs).map((blog) => {
    const { likedBy, ...rest } = blog;
    const author = blog.author ? sanitizeObject(blog.author) : null;
    const tags = blog?.tags?.length ? sanitizeArray(blog.tags) : [];

    return {
      ...rest,
      author,
      tags,
      likesCount: likedBy?.length || 0,
      isLiked:
        likedBy?.some((userId) => userId.toString() === id.toString()) || false, // true if current user liked it
    };
  });

  return {
    count,
    limit,
    offset,
    results: blogs.length,
    blogs,
  };
};

//hey chatgpt, Add isLiked property also in this service

/**
 * Toggle like/unlike for a blog
 * @param {string} blogId - Blog ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Sanitized updated blog with likesCount & isLiked
 */
export const toggleLikeBlogService = async (blogId, userId) => {
  const blog = await Blog.findById(blogId)
    .populate("author", "name email picture")
    .populate("tags", "title");

  if (!blog) {
    throw new AppError("Blog not found", 404);
  }

  const alreadyLiked = blog.likedBy.includes(userId);

  if (alreadyLiked) {
    // Unlike
    blog.likedBy.pull(userId);
  } else {
    // Like
    blog.likedBy.push(userId);
  }

  await blog.save();

  // Convert to plain object
  const { likedBy, ...rest } = sanitizeObject(
    blog.toObject({ virtuals: true })
  );

  const author = blog.author ? sanitizeObject(blog.author) : null;
  const tags = blog?.tags?.length ? sanitizeArray(blog.tags) : [];

  return {
    ...rest,
    author,
    tags,
    likesCount: likedBy?.length || 0,
    isLiked: !alreadyLiked, // reflect latest action
  };
};

/**
 * Toggle a blog in user's bookmarks
 * @param {string} userId
 * @param {string} blogId
 * @returns {Promise<Object>} Sanitized bookmark document
 */
export const toggleBookmarkService = async (userId, blogId) => {
  // ✅ Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new AppError("Invalid user ID", 400);
  }
  if (!mongoose.Types.ObjectId.isValid(blogId)) {
    throw new AppError("Invalid blog ID", 400);
  }

  // ✅ Ensure user exists
  const userExists = await User.exists({ _id: userId });
  if (!userExists) {
    throw new AppError("User not found", 404);
  }

  // ✅ Ensure blog exists (must be published to bookmark)
  const blogExists = await Blog.exists({ _id: blogId, status: "published" });
  if (!blogExists) {
    throw new AppError("Blog not found or not published", 404);
  }

  // ✅ Find user's bookmark document (if any)
  let bookmarkDoc = await Bookmark.findOne({ user: userId });

  // will hold final bookmark state after toggling
  let isBookmarked = false;

  if (!bookmarkDoc) {
    // ✅ No bookmark doc exists for user → create one with this blog
    // (unique index on user prevents duplicates; handle duplicate-key at call-site if necessary)
    bookmarkDoc = await Bookmark.create({ user: userId, blogs: [blogId] });
    isBookmarked = true;
  } else {
    // ✅ Bookmark doc exists → check if blogId is present
    const index = bookmarkDoc.blogs.findIndex(
      (id) => id.toString() === blogId.toString()
    );

    if (index > -1) {
      // ✅ Already bookmarked → remove it
      bookmarkDoc.blogs.splice(index, 1);
      isBookmarked = false;
    } else {
      // ✅ Not bookmarked → add it
      bookmarkDoc.blogs.push(blogId);
      isBookmarked = true;
    }

    // ✅ Persist changes
    await bookmarkDoc.save();
  }

  // ✅ Return sanitized primitives (ObjectId -> string + boolean)
  return {
    blogId: blogId.toString(),
    isBookmarked,
  };
};

/**
 * Service: Get bookmarked blogs for a user
 */
export const getBookmarkedBlogsService = async (
  currentUserId,
  limit = 10,
  offset = 0
) => {
  // ✅ Fetch user’s bookmark document
  const bookmarkDoc = await Bookmark.findOne({ user: currentUserId }).select(
    "blogs"
  );

  if (!bookmarkDoc || !bookmarkDoc.blogs.length) {
    return { count: 0, blogs: [] };
  }

  // ✅ Count total bookmarked blogs
  const count = bookmarkDoc.blogs.length;

  // ✅ Get paginated bookmarked blogs
  let blogs = await Blog.find({
    _id: { $in: bookmarkDoc.blogs },
    status: "published", // show only published ones
  })
    .skip(offset)
    .limit(limit)
    .populate("author", "name")
    .populate("tags", "title")
    .sort({ createdAt: -1 });

  // ✅ Transform output
  blogs = sanitizeArray(blogs).map((blog) => {
    const { likedBy, ...rest } = blog;
    const author = blog.author ? sanitizeObject(blog.author) : null;
    const tags = blog?.tags?.length ? sanitizeArray(blog.tags) : [];

    return {
      ...rest,
      author,
      tags,
      likesCount: likedBy?.length || 0,
      isLiked: likedBy?.some(
        (userId) => userId.toString() === currentUserId.toString()
      ),
      isBookmarked: true, // since this is bookmarks list
    };
  });

  return { count, blogs };
};
