import { Blog } from "../models/blogModel.js";
import { AppError } from "../utils/appError.js";
import { sanitizeArray, sanitizeObject } from "../utils/mongoDB-utils.js";

/**
 * Create a new blog
 * @param {Object} data - Blog data (must include authorId and status from controller).
 * @returns {Object} - Sanitized blog
 */
export const createBlogService = async (data) => {
  if (!data?.author) {
    throw new AppError("author ID is required", 400);
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
    .populate("author", "name")
    .populate("tags", "title")
    .sort({ createdAt: -1 });

  // sanitize blogs and remove likedBy array
  blogs = sanitizeArray(blogs).map((blog) => {
    const { likedBy, ...rest } = blog; // remove likedBy
    const author = blog.author ? sanitizeObject(blog.author) : null;
    const tags = blog?.tags?.length ? sanitizeArray(blog.tags) : [];

    return {
      ...rest,
      author: author,
      tags: tags,
      likesCount: likedBy?.length || 0, // only send number of likes
    };
  });

  return {
    count,
    blogs,
  };
};

/**
 * Service: Get a single published blog by ID
 * - Only returns if status is "published"
 * - Populates author & tags
 * - Removes likedBy, replaces with likesCount & isLiked
 */
export const getPublishedBlogByIdService = async (id, currentUserId = null) => {
  const blog = await Blog.findOne({ _id: id, status: "published" })
    .populate("author", "name email picture")
    .populate("tags", "title");

  if (!blog) {
    throw new AppError("Blog not found", 404);
  }

  const sanitizedBlog = sanitizeObject(blog);
  const author = blog.author ? sanitizeObject(blog.author) : null;
  const tags = blog?.tags?.length ? sanitizeArray(blog.tags) : [];

  return {
    ...sanitizedBlog,
    author,
    tags,
    likesCount: blog.likedBy?.length || 0,
    isLiked: currentUserId
      ? blog.likedBy?.some(
          (userId) => userId.toString() === currentUserId.toString()
        )
      : false, // logged-out users always false
    // 🚫 explicitly remove likedBy
    likedBy: undefined,
  };
};
/* Note:
 * - The `likedBy` field is **removed** by setting `likedBy: undefined`.
 * - In JavaScript, properties with value `undefined` are **not included**
 *   when an object is serialized to JSON (`res.json()`).
 *   Example:
 *   ```js
 *   JSON.stringify({ a: 1, b: undefined }); // {"a":1}
 *   ```
 *   That’s why you won’t see `likedBy` in the API response.
 * - If you want the property to appear as empty, use `null` or `[]` instead.
 */
