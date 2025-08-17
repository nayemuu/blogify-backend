import express from "express";
import trimRequest from "trim-request";
import { register } from "../controllers/authController.js";

const route = express.Router();

route.post("/register", trimRequest.all, register);

export default route;
