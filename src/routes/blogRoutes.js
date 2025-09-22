import express from "express";
import trimRequest from "trim-request";
import {
  createBlog,
  deleteBlog,
  getPublishedBlogById,
  getPublishedBlogs,
  //   getAllBlogs,
  //   getBlogById,
  updateBlog,
} from "../controllers/blogController.js";
import { upload } from "../utils/multer.js";
import { checkPermission } from "../middlewares/checkPermission.js";
import { checkAuth } from "../middlewares/checkAuth.js";

const route = express.Router();

route.post(
  "/",
  trimRequest.all,
  checkAuth,
  upload.single("thumbnail"),
  // checkPermission("can_create_blog"),
  createBlog
);
route.get("/", trimRequest.all, getPublishedBlogs);
route.get("/:id", trimRequest.all, getPublishedBlogById);
route.post(
  "/:id",
  trimRequest.all,
  checkAuth,
  upload.single("thumbnail"),
  updateBlog
);
route.delete("/:id", trimRequest.all, checkAuth, deleteBlog);

export default route;
