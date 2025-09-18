import mongoose from "mongoose";
import User from "../models/userModel.js";
import { AppError } from "../utils/appError.js";
import { Blog } from "../models/blogModel.js";
import { sanitizeArray, sanitizeObject } from "../utils/mongoDB-utils.js";

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

/**
 * Get user blogs with optional status + pagination
 * @param {string} id - User ID
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

  // Build filter
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

  // Sanitize blogs and remove likedBy
  blogs = sanitizeArray(blogs).map((blog) => {
    const { likedBy, ...rest } = blog; // remove likedBy
    const author = blog.author ? sanitizeObject(blog.author) : null;
    const tags = blog?.tags?.length ? sanitizeArray(blog.tags) : [];

    return {
      ...rest,
      author,
      tags,
      likesCount: likedBy?.length || 0, // send only likes count
    };
  });

  return {
    count,
    limit,
    offset,
    blogs,
  };
};
