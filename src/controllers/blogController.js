import validator from "validator";
import { AppError } from "../utils/appError.js";
import { catchAsync } from "../utils/catchAsync.js";
import { deleteImage, uploadImage } from "../utils/imageUploadUtils.js";
import { removeLocalFile } from "../utils/fsUtils.js";
import {
  createBlogService,
  getPublishedBlogByIdService,
  getPublishedBlogsService,
} from "../services/blogService.js";
import mongoose from "mongoose";
import { Blog } from "../models/blogModel.js";
import { getUserIdFromToken } from "../utils/tokenUtils.js";

/**
 * 🔹 Best Practice: Layered Validation in Node.js + Mongoose
 *
 * Validation should be handled in multiple layers to ensure both
 * performance and data integrity:
 *
 * 1. **Request-Level Validation (Controller Layer)**
 *    - Perform quick checks before hitting the database.
 *    - Examples:
 *      - Required fields present (`title`, `content`, etc.).
 *      - Field format (e.g., `thumbnail` must be a valid URL).
 *      - Business rules (e.g., user must have `"can_create_blog"` permission).
 *    - Use libraries like `validator` or `Joi` here.
 *
 * 2. **Database Schema Validation (Mongoose Layer)**
 *    - Acts as a safety net to enforce data integrity at the database level.
 *    - Examples:
 *      - Required fields (`required: true`).
 *      - Length constraints (`minlength`, `maxlength`).
 *      - Enum values (e.g., blog `status` can only be `"pending"` or `"published"`).
 *      - Custom validators using `validator` package.
 *    - Even if controller-level validation is bypassed, Mongoose ensures invalid
 *      data is never persisted.
 *
 * 3. **Service Layer (Business Logic & Sanitization)**
 *    - The service layer should not be responsible for validation.
 *    - Focus only on database operations and sanitizing returned data.
 *    - Example: `sanitizeObject()` and `sanitizeArray()` to remove sensitive
 *      fields (`_id`, `__v`) and return a clean API response.
 *
 * ✅ Summary:
 * - Controller → Quick request-level validation for performance & UX.
 * - Mongoose Schema → Guaranteed data integrity at DB level.
 * - Service → Keep clean, only DB operations + sanitization.
 *
 * This layered approach prevents invalid data, improves error handling,
 * and separates concerns cleanly.
 */

/**
 * Create new blog
 * - If user has "can_publish_blog", blog will be published
 *   else blog will be pending
 */

export const createBlog = catchAsync(async (req, res, next) => {
  const { title, content, tags: tagsRaw } = req.body;
  const { file, user } = req;

  let tags = [];
  let imageUrl;

  try {
    // ✅ Validate input
    if (!title || !validator.isLength(title, { min: 5, max: 150 })) {
      throw new AppError("title must be between 5 and 150 characters", 400);
    }

    if (!content) {
      throw new AppError("content is required", 400);
    }

    if (!file?.path) {
      throw new AppError("thumbnail is required", 400);
    }

    if (!tagsRaw) {
      throw new AppError("tags are required", 400);
    }

    // ✅ Parse and validate tags
    const parsedTags = JSON.parse(tagsRaw);
    if (!Array.isArray(parsedTags) || parsedTags.length === 0) {
      throw new AppError("tags are required", 400);
    }

    tags = parsedTags.map((id) => new mongoose.Types.ObjectId(id));

    // ✅ Upload image
    const image = await uploadImage(file.path);
    imageUrl = image.secure_url;

    // ✅ Determine blog status
    // const blogStatus =
    //   user?.isSuper || user?.permissions?.includes("can_publish_blog")
    //     ? "published"
    //     : "pending";

    const blogStatus = "published";

    // ✅ Prepare blog data
    const blogData = {
      ...req.body,
      tags,
      thumbnail: imageUrl,
      author: user.id,
      status: blogStatus,
      publishedAt: blogStatus === "published" ? new Date() : null,
    };

    // ✅ Save blog
    const blog = await createBlogService(blogData);

    res.status(201).json({
      status: "success",
      data: blog,
    });
  } catch (error) {
    // ✅ Rollback uploaded image if DB fails or validation throws after upload
    if (imageUrl) {
      await deleteImage(imageUrl);
    }
    throw error;
  } finally {
    // ✅ Always clean up local file on *any* outcome (success or error)
    if (file?.path) {
      removeLocalFile(file.path);
    }
  }
});

/**
 * Get all published blogs
 */
export const getPublishedBlogs = catchAsync(async (req, res, next) => {
  const limit = parseInt(req.query.limit) || 10;
  const offset = parseInt(req.query.offset) || 0;

  const { count, blogs } = await getPublishedBlogsService(limit, offset);

  res.status(200).json({
    status: "success",
    count, // total published blogs
    limit,
    offset,
    results: blogs.length,
    blogs: blogs,
  });
});

/**
 * Controller: Get a published blog by ID
 */
export const getPublishedBlogById = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  // Step 1 - Extract and decode token if present
  let currentUserId = null;
  const bearerToken = req.headers["authorization"];

  if (bearerToken?.startsWith("Bearer ")) {
    const token = bearerToken.split(" ")[1];
    currentUserId = getUserIdFromToken(token);
  }

  // Step 2 - Fetch the blog with optional personalization
  const blog = await getPublishedBlogByIdService(id, currentUserId);

  // Step 3 - Send response
  res.status(200).json({
    status: "success",
    data: blog,
  });
});

// Change Blog Status Api
export const updateBlogStatus = catchAsync(async (req, res, next) => {
  const { blogId } = req.params;
  const { status } = req.body;

  if (
    !["pending", "published", "archived", "suspended", "deleted"].includes(
      status
    )
  ) {
    throw new AppError("Invalid status", 400);
  }

  const blog = await Blog.findById(blogId);
  if (!blog) {
    throw new AppError("Blog not found", 404);
  }

  // ✅ Update status & publishedAt
  blog.status = status;
  blog.publishedAt = status === "published" ? new Date() : null;

  await blog.save();

  res.status(200).json({
    status: "success",
    data: blog,
  });
});
