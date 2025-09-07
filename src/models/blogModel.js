import mongoose, { Schema } from "mongoose";
import validator from "validator";
import User from "./userModel.js";
import { Tag } from "./tagModel.js";

const blogSchema = new Schema(
  {
    // Blog title
    title: {
      type: String,
      required: [true, "title is required"],
      trim: true,
      minlength: [5, "title must be at least 5 characters long"],
      maxlength: [150, "title cannot exceed 150 characters"],
    },

    // tags
    tags: [
      {
        type: Schema.Types.ObjectId,
        ref: "Tag",
      },
    ],

    // Blog main content/body
    content: {
      type: String,
      required: [true, "content is required"],
    },

    // Blog thumbnail image (URL)
    thumbnail: {
      type: String,
      required: [true, "thumbnail URL is required"],
      trim: true,
      // match: [/^https?:\/\/.+/, "Please provide a valid URL"],
      validate: {
        validator: (val) => validator.isURL(val),
        message: "thumbnail must be a valid URL",
      },
    },

    // Author reference
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "author ID is required"],
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

    // published timestamp
    publishedAt: {
      type: Date,
      default: null, // stays null until status = published
    },
  },
  { timestamps: true }
);

export const Blog = mongoose.models.Blog ?? mongoose.model("Blog", blogSchema);
