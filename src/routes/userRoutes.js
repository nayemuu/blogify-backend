import express from "express";
import trimRequest from "trim-request";
import {
  profileController,
  getMyBlogs,
  toggleLikeBlogController,
} from "../controllers/userController.js";
import { checkAuth } from "../middlewares/checkAuth.js";

const route = express.Router();

route.get("/profile", checkAuth, trimRequest.all, profileController);
route.get("/blogs", checkAuth, trimRequest.all, getMyBlogs);
route.post(
  "/blogs/like/:id",
  checkAuth,
  trimRequest.all,
  toggleLikeBlogController
);

export default route;
