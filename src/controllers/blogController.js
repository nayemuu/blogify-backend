import validator from "validator";
import { AppError } from "../utils/appError.js";
import { catchAsync } from "../utils/catchAsync.js";
import { deleteImage, uploadImage } from "../utils/imageUploadUtils.js";
import { removeLocalFile } from "../utils/fsUtils.js";
import { createBlogService } from "../services/blogService.js";

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
 * - Requires "can_create_blog"
 * - If user has "can_publish_blog", blog will be published
 *   else blog will be pending
 */

export const createBlog = catchAsync(async (req, res, next) => {
  // if (req?.body) {
  //   console.log("req.body = ", req.body);
  // }

  // console.log("req.file = ", req.file);

  // ✅ Optional request-level validation before DB call
  if (
    !req?.body?.title ||
    !validator.isLength(req.body.title, { min: 5, max: 150 })
  ) {
    throw new AppError("Title must be between 5 and 150 characters", 400);
  }

  if (!req?.body?.content) {
    throw new AppError("Content is required", 400);
  }

  if (!req.file?.path) {
    throw new AppError("Thumbnail is required", 400);
  }

  // Handle image upload if a file is provided
  let imageUrl = null;

  try {
    const image = await uploadImage(req.file.path);
    imageUrl = image.secure_url;
  } catch (uploadError) {
    throw new Error("Failed to upload image");
  } finally {
    // Ensure local file is removed if it exists
    if (req.file?.path) {
      removeLocalFile(req.file.path);
    }
  }

  try {
    const blogData = {
      ...req.body,
      thumbnail: imageUrl,
      authorId: req.user.id,
      status:
        req?.user?.isSuper ||
        req?.user?.permissions?.includes("can_publish_blog")
          ? "published"
          : "pending",
    };

    const blog = await createBlogService(blogData);

    res.status(201).json({
      status: "success",
      data: blog,
    });
  } catch (error) {
    console.log("error = ", error);
    if (imageUrl) {
      deleteImage(imageUrl);
    }
    throw error;
  }
});
