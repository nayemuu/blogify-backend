import mongoose, { Schema } from "mongoose";
import User from "./userModel.js";

const blogSchema = new Schema(
  {
    // Blog title
    title: {
      type: String,
      required: [true, "Blog title is required"],
      trim: true,
      minlength: [5, "Title must be at least 5 characters long"],
      maxlength: [150, "Title cannot exceed 150 characters"],
    },

    // Blog main content/body
    content: {
      type: String,
      required: [true, "Blog content is required"],
    },

    // Blog thumbnail image (URL)
    thumbnail: {
      type: String,
      required: [true, "Thumbnail URL is required"],
      trim: true,
      match: [/^https?:\/\/.+/, "Please provide a valid URL"],
    },

    // Author reference
    authorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Author ID is required"],
    },

    // Users who liked this blog
    likedBy: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // Blog visibility / lifecycle status
    status: {
      type: String,
      required: true,
      enum: [
        "pending", // Awaiting admin/moderation approval
        "published", // Visible to all readers
        "archived", // Old content kept for reference (not active)
        "suspended", // Temporarily hidden (e.g., violation/investigation)
        "deleted", // Soft-deleted (not visible, but kept in DB)
      ],
      default: "pending",
    },
  },
  { timestamps: true }
);

export const Blog = mongoose.models.Blog ?? mongoose.model("Blog", blogSchema);
