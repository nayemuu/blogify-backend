import mongoose from "mongoose";
import validator from "validator";
import { Tag } from "../models/tagModel.js";
import { AppError } from "../utils/appError.js";

export const createTagService = async (title) => {
  if (!title) throw new AppError("Tag title is required", 400);

  // validate string and length
  if (!validator.isLength(title, { max: 200 })) {
    throw new AppError("Tag title must not exceed 200 characters", 400);
  }

  const tag = await Tag.create({ title: title.trim() });
  return tag;
};

export const getAllTagsService = async () => {
  return await Tag.find().sort({ createdAt: -1 });
};

export const getTagByIdService = async (id) => {
  // Check if id is a valid ObjectId before querying
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid tag ID", 400);
  }

  const tag = await Tag.findById(id);
  if (!tag) throw new AppError("Tag not found", 404);
  return tag;
};

export const updateTagService = async (id, title) => {
  // Check if id is a valid ObjectId before querying
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid tag ID", 400);
  }

  if (!title) throw new AppError("Tag title is required", 400);

  if (!validator.isLength(title, { max: 200 })) {
    throw new AppError("Tag title must not exceed 200 characters", 400);
  }

  const tag = await Tag.findByIdAndUpdate(
    id,
    { title: title.trim() },
    { new: true, runValidators: true }
  );

  if (!tag) throw new AppError("Tag not found", 404);
  return tag;
};

export const deleteTagService = async (id) => {
  // Check if id is a valid ObjectId before querying
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid tag ID", 400);
  }

  const tag = await Tag.findByIdAndDelete(id);
  if (!tag) throw new AppError("Tag not found", 404);
  return tag;
};
