import express from "express";
import trimRequest from "trim-request";
import {
  register,
  login,
  forgotPassword,
  resetPassword,
} from "../controllers/authController.js";

const route = express.Router();

route.post("/register", trimRequest.all, register);
route.post("/login", trimRequest.all, login);
route.post("/forgot-password", trimRequest.all, forgotPassword);
route.post("/reset-password", trimRequest.all, resetPassword);

export default route;
