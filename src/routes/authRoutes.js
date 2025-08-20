import express from "express";
import trimRequest from "trim-request";
import { register, login } from "../controllers/authController.js";

const route = express.Router();

route.post("/register", trimRequest.all, register);
route.post("/login", trimRequest.all, login);

export default route;
