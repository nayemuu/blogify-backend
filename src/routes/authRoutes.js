import express from "express";
import trimRequest from "trim-request";
import {
  register,
  verifyEmailController,
  login,
  forgotPassword,
  resetPassword,
  refreshToken,
  logout,
} from "../controllers/authController.js";

const route = express.Router();

route.post("/register", trimRequest.all, register);
route.post("/verify-email", trimRequest.all, verifyEmailController);
route.post("/login", trimRequest.all, login);
route.post("/forgot-password", trimRequest.all, forgotPassword);
route.post("/reset-password", trimRequest.all, resetPassword);
route.post("/refresh-token", trimRequest.all, refreshToken);
route.post("/logout", trimRequest.all, logout);

export default route;
