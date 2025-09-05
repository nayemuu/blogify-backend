import validator from "validator";
import { AppError } from "../utils/appError.js";
import { catchAsync } from "../utils/catchAsync.js";
import { deleteImage, uploadImage } from "../utils/imageUploadUtils.js";
import { removeLocalFile } from "../utils/fsUtils.js";
import {
  createBlogService,
  getPublishedBlogsService,
} from "../services/blogService.js";
import mongoose from "mongoose";

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
  const { title, content } = req.body;
  const { file, user } = req;

  // ✅ Input validation
  if (!title || !validator.isLength(title, { min: 5, max: 150 })) {
    throw new AppError("title must be between 5 and 150 characters", 400);
  }
  if (!content) {
    throw new AppError("content is required", 400);
  }
  if (!file?.path) {
    throw new AppError("thumbnail is required", 400);
  }

  if (!req.body.tags) {
    if (file?.path) removeLocalFile(file.path);
    throw new AppError("tags are required", 400);
  }

  let tags = [];
  if (req.body.tags) {
    try {
      const parsedTags = JSON.parse(req.body.tags); // parse JSON string to array
      // convert each item to ObjectId
      tags = parsedTags.map((id) => new mongoose.Types.ObjectId(id));

      if (!tags.length) {
        throw new AppError("tags is required", 400);
      }
    } catch (err) {
      if (file?.path) {
        removeLocalFile(file.path);
      }
      throw new AppError("Invalid tags format", 400);
    }
  }

  let imageUrl;

  try {
    // ✅ Upload image
    const image = await uploadImage(file.path);
    imageUrl = image.secure_url;

    // ✅ Prepare blog data
    const blogData = {
      ...req.body,
      tags,
      thumbnail: imageUrl,
      authorId: user.id,
      status:
        user?.isSuper || user?.permissions?.includes("can_publish_blog")
          ? "published"
          : "pending",
    };

    // ✅ Save blog
    const blog = await createBlogService(blogData);

    res.status(201).json({
      status: "success",
      data: blog,
    });
  } catch (error) {
    // ✅ Rollback image if DB fails
    if (imageUrl) {
      await deleteImage(imageUrl);
    }
    throw error;
  } finally {
    // ✅ Always clean up local file
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
    data: blogs,
  });
});
