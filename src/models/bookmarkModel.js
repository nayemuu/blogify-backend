import mongoose, { Schema } from "mongoose";
import User from "./userModel.js";
import { Blog } from "./blogModel.js";

const bookmarkSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // ✅ only one bookmark doc per user
    },
    blogs: [
      {
        type: Schema.Types.ObjectId,
        ref: "Blog",
      },
    ],
  },
  { timestamps: true }
);

export const Bookmark =
  mongoose.models.Bookmark ?? mongoose.model("Bookmark", bookmarkSchema);
