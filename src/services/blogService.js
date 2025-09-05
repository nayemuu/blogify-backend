import { Blog } from "../models/blogModel.js";
import { AppError } from "../utils/appError.js";
import { sanitizeObject } from "../utils/mongoDB-utils.js";

/**
 * Create a new blog
 * @param {Object} data - Blog data (must include authorId and status from controller).
 * @returns {Object} - Sanitized blog
 */
export const createBlogService = async (data) => {
  if (!data?.authorId) {
    throw new AppError("Author ID is required", 400);
  }

  const blog = await Blog.create(data);

  return sanitizeObject(blog);
};
