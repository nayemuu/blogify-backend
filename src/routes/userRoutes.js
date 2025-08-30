import express from "express";
import trimRequest from "trim-request";
import { profileController } from "../controllers/userController.js";
import { checkAuth } from "../middlewares/checkAuth.js";

const route = express.Router();

route.get("/profile", checkAuth, trimRequest.all, profileController);

export default route;
