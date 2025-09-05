import { Blog } from "../models/blogModel.js";
import { AppError } from "../utils/appError.js";
import { sanitizeArray, sanitizeObject } from "../utils/mongoDB-utils.js";

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

/**
 * Get published blogs with pagination
 * @param {number} limit - Number of blogs per page
 * @param {number} offset - Number of blogs to skip
 * @returns {Promise<{count: number, blogs: Array}>}
 */
export const getPublishedBlogsService = async (limit = 10, offset = 0) => {
  const count = await Blog.countDocuments({ status: "published" });

  let blogs = await Blog.find({ status: "published" })
    .skip(offset)
    .limit(limit)
    .populate("authorId", "name")
    .populate("tags", "title")
    .sort({ createdAt: -1 });

  // sanitize blogs and remove likedBy array
  blogs = sanitizeArray(blogs).map((blog) => {
    const { likedBy, ...rest } = blog; // remove likedBy
    const author = blog.authorId ? sanitizeObject(blog.authorId) : null;
    const tags = blog?.tags?.length ? sanitizeArray(blog.tags) : [];

    return {
      ...rest,
      authorId: author,
      tags: tags,
      likesCount: likedBy?.length || 0, // only send number of likes
    };
  });

  return {
    count,
    blogs,
  };
};
