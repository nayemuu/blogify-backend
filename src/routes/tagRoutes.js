import express from "express";
import trimRequest from "trim-request";
import {
  createTag,
  deleteTag,
  getAllTags,
  getTagById,
  updateTag,
} from "../controllers/tagController.js";

const route = express.Router();

route.post("/", trimRequest.all, createTag);
route.get("/", trimRequest.all, getAllTags);
route.get("/:id", trimRequest.all, getTagById);
route.post("/:id", trimRequest.all, updateTag);
route.delete("/:id", trimRequest.all, deleteTag);

export default route;
