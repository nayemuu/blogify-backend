import express from "express";
import authRoutes from "./authRoutes.js";
import tagRoutes from "./tagRoutes.js";
import userRoutes from "./userRoutes.js";
import blogRoutes from "./blogRoutes.js";
import { checkAuth } from "../middlewares/checkAuth.js";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/tags", tagRoutes);
router.use("/user", userRoutes);
router.use("/blogs", blogRoutes);

export default router;
