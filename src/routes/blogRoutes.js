import express from "express";
import trimRequest from "trim-request";
import {
  createBlog,
  //   getAllBlogs,
  //   getBlogById,
  //   updateBlog,
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
  checkPermission("can_create_blog"),
  createBlog
);
// route.get("/", trimRequest.all, getAllBlogs);
// route.get("/:id", trimRequest.all, getBlogById);
// route.post("/:id", trimRequest.all, updateBlog);
// route.delete("/:id", trimRequest.all, deleteBlog);

export default route;
