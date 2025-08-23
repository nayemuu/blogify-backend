import express from "express";
import trimRequest from "trim-request";
import {
  register,
  login,
  forgotPassword,
} from "../controllers/authController.js";

const route = express.Router();

route.post("/register", trimRequest.all, register);
route.post("/login", trimRequest.all, login);
route.post("/forgot-password", trimRequest.all, forgotPassword);
route.post("/resetPassword", trimRequest.all, login);

export default route;
