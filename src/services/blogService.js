import validator from "validator";
import mongoose from "mongoose";
import { Blog } from "../models/blogModel.js";
import { AppError } from "../utils/appError.js";
import { deleteImage, uploadImage } from "../utils/imageUploadUtils.js";
import { sanitizeArray, sanitizeObject } from "../utils/mongoDB-utils.js";
import { removeLocalFile } from "../utils/fsUtils.js";

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
 *
 * @param {string|null} currentUserId - Current logged-in user ID (null if not logged in)
 * @param {number} limit - Number of blogs per page
 * @param {number} offset - Number of blogs to skip
 * @returns {Promise<{count: number, blogs: Array}>}
 *
 * Each blog object includes:
 * - author (sanitized author object)
 * - tags (sanitized tags array)
 * - likesCount (number of likes)
 * - isLiked (true if current user liked, false otherwise)
 *
 * Note:
 * - `likedBy` is not included in the response.
 */
export const getPublishedBlogsService = async (
  currentUserId = null,
  limit = 10,
  offset = 0
) => {
  // Count total published blogs
  const count = await Blog.countDocuments({ status: "published" });

  // Fetch paginated published blogs
  let blogs = await Blog.find({ status: "published" })
    .skip(offset)
    .limit(limit)
    .populate("author", "name")
    .populate("tags", "title")
    .sort({ createdAt: -1 });

  // Sanitize blogs and transform output
  blogs = sanitizeArray(blogs).map((blog) => {
    const { likedBy, ...rest } = blog;
    const author = blog.author ? sanitizeObject(blog.author) : null;
    const tags = blog?.tags?.length ? sanitizeArray(blog.tags) : [];

    return {
      ...rest,
      author,
      tags,
      likesCount: likedBy?.length || 0,
      isLiked: currentUserId
        ? likedBy?.some(
            (userId) => userId.toString() === currentUserId.toString()
          )
        : false,
    };
  });

  return {
    count,
    blogs,
  };
};

/**
 * Search published blogs (aggregation) with pagination.
 *
 * @param {Object} options
 * @param {string|null} options.currentUserId - Logged-in user id (to mark isLiked)
 * @param {number} options.limit - page size
 * @param {number} options.offset - skip
 * @param {string} [options.query] - text query (priority: title, author.name, tags.title, content)
 * @returns {Promise<{count: number, blogs: Array}>}
 */
export const searchPublishedBlogsService = async ({
  currentUserId = null,
  limit = 10,
  offset = 0,
  query = "",
} = {}) => {
  // sanitize / normalize pagination inputs
  limit = Number(limit) || 10;
  offset = Number(offset) || 0;
  query = (query || "").trim();

  // Base pipeline (match published + joins)
  const pipelineBase = [
    { $match: { status: "published" } },

    // join author
    {
      $lookup: {
        from: "users", // collection name
        localField: "author",
        foreignField: "_id",
        as: "author",
      },
    },
    // unwind author to object (preserve in case author missing)
    { $unwind: { path: "$author", preserveNullAndEmptyArrays: true } },

    // join tags
    {
      $lookup: {
        from: "tags",
        localField: "tags",
        foreignField: "_id",
        as: "tags",
      },
    },
  ];

  // If query is provided, add a $match that checks title, author.name, tags.title, content
  const regex = query ? new RegExp(query, "i") : null;
  const queryMatchStage = query
    ? {
        $match: {
          $or: [
            { title: regex }, // 1. title
            { "author.name": regex }, // 2. author name (joined)
            { "tags.title": regex }, // 3. tag title (joined array)
            { content: regex }, // 4. content
          ],
        },
      }
    : null;

  // Build count pipeline (base + optional query match + $count)
  const countPipeline = [
    ...pipelineBase,
    ...(queryMatchStage ? [queryMatchStage] : []),
    { $count: "total" },
  ];

  // Build fetch pipeline (base + optional query match + sort + paginate)
  const fetchPipeline = [
    ...pipelineBase,
    ...(queryMatchStage ? [queryMatchStage] : []),
    { $sort: { createdAt: -1 } },
    { $skip: offset },
    { $limit: limit },
  ];

  // Run count aggregation
  const countResult = await Blog.aggregate(countPipeline);
  const count = (countResult[0] && countResult[0].total) || 0;

  // Run fetch aggregation
  let blogs = await Blog.aggregate(fetchPipeline);

  // At this point `blogs` are plain objects from aggregation.
  // Sanitize and transform each blog (sanitize root blog, author, tags; compute likesCount & isLiked)
  blogs = sanitizeArray(blogs).map((blog) => {
    // likedBy might be array of ObjectId or strings depending on storage
    const { likedBy = [], author: authorRaw, tags: tagsRaw, ...rest } = blog;

    // sanitize author & tags
    const author = authorRaw ? sanitizeObject(authorRaw) : null;
    const tags =
      Array.isArray(tagsRaw) && tagsRaw.length ? sanitizeArray(tagsRaw) : [];

    const likesCount = Array.isArray(likedBy) ? likedBy.length : 0;
    const isLiked =
      currentUserId && Array.isArray(likedBy)
        ? likedBy.some((id) => id.toString() === currentUserId.toString())
        : false;

    return {
      ...rest,
      author,
      tags,
      likesCount,
      isLiked,
    };
  });

  return { count, blogs };
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

export const updateBlogService = async (
  id,
  { title, content, tags, thumbnail, file, userId, isSuper }
) => {
  const blog = await Blog.findById(id);
  if (!blog) throw new AppError("Blog not found", 404);

  // Authorization
  if (blog.author.toString() !== userId.toString()) {
    throw new AppError("You are not authorized to update this blog", 403);
  }

  let uploadedImageUrl;
  let newThumbnail = blog.thumbnail;

  try {
    // ✅ Validate title
    if (title && !validator.isLength(title, { min: 5, max: 150 })) {
      throw new AppError("title must be between 5 and 150 characters", 400);
    }

    // ✅ Validate content
    if (content !== undefined && content.trim().length === 0) {
      throw new AppError("content is required", 400);
    }

    // ✅ Handle tags
    let parsedTags = blog.tags;
    if (tags) {
      const parsed = JSON.parse(tags);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new AppError("tags are required", 400);
      }
      parsedTags = parsed.map((id) => new mongoose.Types.ObjectId(id));
    }

    // ✅ Handle thumbnail
    if (file?.path) {
      const image = await uploadImage(file.path);
      uploadedImageUrl = image.secure_url;
      newThumbnail = uploadedImageUrl;
    } else if (thumbnail) {
      if (!validator.isURL(thumbnail))
        throw new AppError("thumbnail must be a valid URL", 400);
      newThumbnail = thumbnail;
    }

    // ✅ If new thumbnail → delete old
    if (newThumbnail !== blog.thumbnail) {
      await deleteImage(blog.thumbnail);
    }

    // ✅ Save
    blog.title = title ?? blog.title;
    blog.content = content ?? blog.content;
    blog.tags = parsedTags;
    blog.thumbnail = newThumbnail;

    return sanitizeObject(await blog.save());
  } catch (err) {
    if (uploadedImageUrl) await deleteImage(uploadedImageUrl);
    throw err;
  } finally {
    if (file?.path) removeLocalFile(file.path);
  }
};

/**
 * Delete a blog
 * - Only author or super user can delete
 * - Remove blog from DB
 * - Delete thumbnail from storage
 */
export const deleteBlogService = async (id, { userId, isSuper }) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid blog ID", 400);
  }

  const blog = await Blog.findById(id);
  if (!blog) {
    throw new AppError("Blog not found", 404);
  }

  // ✅ Authorization check
  if (blog.author.toString() !== userId.toString()) {
    throw new AppError("You are not authorized to delete this blog", 403);
  }

  // ✅ Delete blog
  await Blog.deleteOne({ _id: id });

  // ✅ Delete image
  if (blog.thumbnail) {
    await deleteImage(blog.thumbnail);
  }

  return true;
};
