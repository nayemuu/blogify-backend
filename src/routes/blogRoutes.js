import express from "express";
import trimRequest from "trim-request";
import {
  createBlog,
  //   getAllBlogs,
  //   getBlogById,
  //   updateBlog,
} from "../controllers/blogController.js";

const route = express.Router();

route.post("/", trimRequest.all, createBlog);
// route.get("/", trimRequest.all, getAllBlogs);
// route.get("/:id", trimRequest.all, getBlogById);
// route.post("/:id", trimRequest.all, updateBlog);
// route.delete("/:id", trimRequest.all, deleteBlog);

export default route;
