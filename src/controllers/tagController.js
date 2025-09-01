import {
  createTagService,
  deleteTagService,
  getAllTagsService,
  getTagByIdService,
  updateTagService,
} from "../services/tagService.js";
import { catchAsync } from "../utils/catchAsync.js";
import { replaceMongoIdInArray } from "../utils/mongoDB-utils.js";

export const createTag = catchAsync(async (req, res, next) => {
  const { title } = req.body || {};
  const tag = await createTagService(title);

  res.status(201).json({
    status: "success",
    message: "Tag created successfully",
    data: tag,
  });
});

export const getAllTags = catchAsync(async (req, res, next) => {
  const tags = await getAllTagsService();

  res.status(200).json({
    status: "success",
    results: tags.length,
    data: replaceMongoIdInArray(tags),
  });
});

export const getTagById = catchAsync(async (req, res, next) => {
  const tag = await getTagByIdService(req.params.id);

  res.status(200).json({
    status: "success",
    data: tag,
  });
});

export const updateTag = catchAsync(async (req, res, next) => {
  const { title } = req.body || {};
  const tag = await updateTagService(req.params.id, title);

  res.status(200).json({
    status: "success",
    message: "Tag updated successfully",
    data: tag,
  });
});

export const deleteTag = catchAsync(async (req, res, next) => {
  await deleteTagService(req.params.id);

  res.status(200).json({
    status: "success",
    message: "Tag deleted successfully",
  });
});
