import mongoose, { Schema } from "mongoose";

const tagSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, "Tag title is required"],
      unique: true,
      trim: true,
      maxlength: [200, "Tag title must not exceed 200 characters"],
    },
  },
  { timestamps: true }
);

export const Tag = mongoose.models.Tag ?? mongoose.model("Tag", tagSchema);
