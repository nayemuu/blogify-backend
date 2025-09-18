import express from "express";
import trimRequest from "trim-request";
import {
  profileController,
  getMyBlogs,
} from "../controllers/userController.js";
import { checkAuth } from "../middlewares/checkAuth.js";

const route = express.Router();

route.get("/profile", checkAuth, trimRequest.all, profileController);
route.get("/blogs", checkAuth, trimRequest.all, getMyBlogs);

export default route;
